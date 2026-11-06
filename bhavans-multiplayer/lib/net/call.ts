"use client";
/**
 * President-to-president voice and video calls. Media flows peer-to-peer (WebRTC), relayed through TURN
 * when networks are strict, so calls connect from anywhere. The game server only carries the signals.
 * ICE is gathered fully before sending (non-trickle), so one offer and one answer are enough.
 */
export type Signal =
  | { t: "ring"; call: string; from: string; fromName: string; video: boolean; sdp: RTCSessionDescriptionInit }
  | { t: "answer"; call: string; from: string; sdp: RTCSessionDescriptionInit }
  | { t: "hangup"; call: string; from: string; reason?: string };

export interface CallState {
  state: "idle" | "calling" | "ringing" | "connecting" | "active";
  call?: string;
  peer?: string;
  peerName?: string;
  since?: number;
  muted?: boolean;
  video?: boolean;
  camOff?: boolean;
  reason?: string;
}

let iceCache: RTCIceServer[] | null = null;
async function iceServers(): Promise<RTCIceServer[]> {
  if (iceCache) return iceCache;
  try {
    const r = await fetch("/api/ice/", { cache: "no-store" });
    iceCache = ((await r.json()) as { iceServers: RTCIceServer[] }).iceServers;
  } catch {
    iceCache = [{ urls: ["stun:stun.l.google.com:19302"] }];
  }
  return iceCache;
}

function gathered(pc: RTCPeerConnection, ms = 3500) {
  return new Promise<void>((res) => {
    if (pc.iceGatheringState === "complete") return res();
    const t = setTimeout(res, ms);
    pc.addEventListener("icegatheringstatechange", () => {
      if (pc.iceGatheringState === "complete") {
        clearTimeout(t);
        res();
      }
    });
  });
}

export class Caller {
  private pc: RTCPeerConnection | null = null;
  local: MediaStream | null = null;
  remote: MediaStream | null = null;
  private audio: HTMLAudioElement | null = null;
  private pendingOffer: Extract<Signal, { t: "ring" }> | null = null;
  private ringTimer: ReturnType<typeof setInterval> | null = null;
  state: CallState = { state: "idle" };
  onMedia: () => void = () => {};

  constructor(
    private me: () => { id: string; name: string },
    private send: (to: string, s: Signal) => void,
    private onState: (s: CallState) => void
  ) {}

  private set(s: CallState) {
    this.state = s;
    this.onState(s);
  }

  private async setup(video: boolean) {
    try {
      this.local = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: video ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false,
      });
    } catch (e) {
      if (!video) throw e;
      this.local = await navigator.mediaDevices.getUserMedia({ audio: true }); // no camera: fall back to voice
    }
    const pc = new RTCPeerConnection({ iceServers: await iceServers() });
    this.pc = pc;
    this.local.getTracks().forEach((t) => pc.addTrack(t, this.local!));
    if (video && !this.local.getVideoTracks().length) pc.addTransceiver("video", { direction: "recvonly" });
    pc.ontrack = (e) => {
      this.remote = e.streams[0] ?? new MediaStream([e.track]);
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.autoplay = true;
      }
      this.audio.srcObject = this.remote;
      this.audio.play().catch(() => {});
      this.onMedia();
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") this.set({ ...this.state, state: "active", since: this.state.since ?? Date.now() });
      if (pc.connectionState === "failed") this.end("connection failed");
    };
    this.onMedia();
    return pc;
  }

  async dial(peer: string, peerName: string, video = false) {
    if (this.state.state !== "idle") return;
    const call = "call-" + Math.random().toString(36).slice(2, 10);
    this.set({ state: "calling", call, peer, peerName, video });
    try {
      const pc = await this.setup(video);
      await pc.setLocalDescription(await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: video }));
      await gathered(pc);
      if (this.state.call !== call) return;
      this.send(peer, { t: "ring", call, from: this.me().id, fromName: this.me().name, video, sdp: pc.localDescription!.toJSON() });
      setTimeout(() => this.state.call === call && this.state.state === "calling" && this.end("no answer"), 45_000);
    } catch {
      this.end(video ? "camera/mic blocked" : "mic blocked");
    }
  }

  async accept(withVideo?: boolean) {
    const s = this.pendingOffer;
    if (!s) return;
    this.stopRing();
    const video = withVideo ?? s.video;
    this.set({ ...this.state, state: "connecting", video });
    try {
      const pc = await this.setup(video);
      await pc.setRemoteDescription(s.sdp);
      await pc.setLocalDescription(await pc.createAnswer());
      await gathered(pc);
      this.send(s.from, { t: "answer", call: s.call, from: this.me().id, sdp: pc.localDescription!.toJSON() });
      this.pendingOffer = null;
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
    if (this.state.peer && this.state.call && this.state.state !== "idle") this.send(this.state.peer, { t: "hangup", call: this.state.call, from: this.me().id, reason });
    this.cleanup(reason);
  }

  mute(on: boolean) {
    this.local?.getAudioTracks().forEach((t) => (t.enabled = !on));
    this.set({ ...this.state, muted: on });
  }
  camera(off: boolean) {
    this.local?.getVideoTracks().forEach((t) => (t.enabled = !off));
    this.set({ ...this.state, camOff: off });
  }
  async flip() {
    const t = this.local?.getVideoTracks()[0];
    if (!t || !this.pc) return;
    const mode = t.getSettings().facingMode === "environment" ? "user" : "environment";
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
      const nt = s.getVideoTracks()[0];
      await this.pc.getSenders().find((x) => x.track?.kind === "video")?.replaceTrack(nt);
      this.local!.removeTrack(t);
      t.stop();
      this.local!.addTrack(nt);
      this.onMedia();
    } catch {}
  }

  private cleanup(reason?: string) {
    this.stopRing();
    this.pc?.close();
    this.pc = null;
    this.local?.getTracks().forEach((t) => t.stop());
    this.local = null;
    this.remote = null;
    if (this.audio) this.audio.srcObject = null;
    this.pendingOffer = null;
    this.set({ state: "idle", reason });
    this.onMedia();
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
      this.set({ state: "ringing", call: s.call, peer: s.from, peerName: s.fromName, video: s.video });
      this.ring();
    } else if (s.call !== this.state.call) return;
    else if (s.t === "answer") {
      this.set({ ...this.state, state: "connecting" });
      await this.pc?.setRemoteDescription(s.sdp).catch(() => this.end("connection failed"));
    } else if (s.t === "hangup") this.cleanup(s.reason);
  }
}
