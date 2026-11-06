"use client";
/**
 * President-to-president voice calls. Audio flows peer-to-peer (WebRTC); the relay only carries the
 * tiny "ring / offer / answer / ice / hangup" signals. Works on phones and computers with a microphone.
 */
export type Signal =
  | { t: "ring"; call: string; from: string; fromName: string; sdp: RTCSessionDescriptionInit }
  | { t: "answer"; call: string; from: string; sdp: RTCSessionDescriptionInit }
  | { t: "ice"; call: string; from: string; c: RTCIceCandidateInit }
  | { t: "hangup"; call: string; from: string; reason?: string };

export interface CallState {
  state: "idle" | "calling" | "ringing" | "active";
  call?: string;
  peer?: string;
  peerName?: string;
  since?: number;
  muted?: boolean;
}

const DEFAULT_ICE: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];

export class Caller {
  private pc: RTCPeerConnection | null = null;
  private local: MediaStream | null = null;
  private audio: HTMLAudioElement | null = null;
  private pendingOffer: Signal | null = null;
  private queued: RTCIceCandidateInit[] = [];
  private ringTimer: ReturnType<typeof setInterval> | null = null;
  state: CallState = { state: "idle" };

  constructor(
    private me: () => { id: string; name: string },
    private send: (to: string, s: Signal) => void,
    private onState: (s: CallState) => void,
    private ice: RTCIceServer[] = DEFAULT_ICE
  ) {}

  private set(s: CallState) {
    this.state = s;
    this.onState(s);
  }

  private async setup(peer: string, call: string) {
    this.local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const pc = new RTCPeerConnection({ iceServers: this.ice });
    this.pc = pc;
    this.local.getTracks().forEach((t) => pc.addTrack(t, this.local!));
    pc.onicecandidate = (e) => e.candidate && this.send(peer, { t: "ice", call, from: this.me().id, c: e.candidate.toJSON() });
    pc.ontrack = (e) => {
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.autoplay = true;
      }
      this.audio.srcObject = e.streams[0];
      this.audio.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") this.set({ ...this.state, state: "active", since: Date.now() });
      if (pc.connectionState === "failed" || pc.connectionState === "closed") this.end("lost");
    };
    return pc;
  }

  async dial(peer: string, peerName: string) {
    if (this.state.state !== "idle") return;
    const call = "call-" + Math.random().toString(36).slice(2, 10);
    this.set({ state: "calling", call, peer, peerName });
    try {
      const pc = await this.setup(peer, call);
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      this.send(peer, { t: "ring", call, from: this.me().id, fromName: this.me().name, sdp: offer });
      setTimeout(() => this.state.call === call && this.state.state === "calling" && this.end("no answer"), 45_000);
    } catch {
      this.end("mic blocked");
    }
  }

  async accept() {
    const s = this.pendingOffer;
    if (!s || s.t !== "ring") return;
    this.stopRing();
    try {
      const pc = await this.setup(s.from, s.call);
      await pc.setRemoteDescription(s.sdp);
      for (const c of this.queued) await pc.addIceCandidate(c).catch(() => {});
      this.queued = [];
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      this.send(s.from, { t: "answer", call: s.call, from: this.me().id, sdp: ans });
      this.set({ state: "active", call: s.call, peer: s.from, peerName: s.fromName, since: Date.now() });
    } catch {
      this.end("mic blocked");
    }
  }

  decline() {
    const s = this.pendingOffer;
    if (s) this.send(s.from, { t: "hangup", call: s.call, from: this.me().id, reason: "declined" });
    this.cleanup();
  }

  end(reason = "ended") {
    if (this.state.peer && this.state.call) this.send(this.state.peer, { t: "hangup", call: this.state.call, from: this.me().id, reason });
    this.cleanup();
  }

  mute(on: boolean) {
    this.local?.getAudioTracks().forEach((t) => (t.enabled = !on));
    this.set({ ...this.state, muted: on });
  }

  private cleanup() {
    this.stopRing();
    this.pc?.close();
    this.pc = null;
    this.local?.getTracks().forEach((t) => t.stop());
    this.local = null;
    if (this.audio) this.audio.srcObject = null;
    this.pendingOffer = null;
    this.queued = [];
    this.set({ state: "idle" });
  }

  private ring() {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new Ctx();
      const beep = () => {
        [0, 0.3].forEach((d) => {
          const o = ac.createOscillator();
          const g = ac.createGain();
          o.frequency.value = 480;
          g.gain.setValueAtTime(0.18, ac.currentTime + d);
          g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d + 0.25);
          o.connect(g).connect(ac.destination);
          o.start(ac.currentTime + d);
          o.stop(ac.currentTime + d + 0.26);
        });
      };
      beep();
      this.ringTimer = setInterval(beep, 2000);
      navigator.vibrate?.([300, 200, 300]);
    } catch {}
  }
  private stopRing() {
    if (this.ringTimer) clearInterval(this.ringTimer);
    this.ringTimer = null;
  }

  async onSignal(s: Signal) {
    if (s.t === "ring") {
      if (this.state.state !== "idle") return this.send(s.from, { t: "hangup", call: s.call, from: this.me().id, reason: "busy" });
      this.pendingOffer = s;
      this.set({ state: "ringing", call: s.call, peer: s.from, peerName: s.fromName });
      this.ring();
    } else if (s.call !== this.state.call) return;
    else if (s.t === "answer") await this.pc?.setRemoteDescription(s.sdp);
    else if (s.t === "ice") {
      if (this.pc?.remoteDescription) await this.pc.addIceCandidate(s.c).catch(() => {});
      else this.queued.push(s.c);
    } else if (s.t === "hangup") this.cleanup();
  }
}
