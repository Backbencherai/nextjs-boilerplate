"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useLocalState } from "@/lib/useLocalState";

export type Reminder = { id: string; title: string; kind: string; due: string; done: boolean };
export type Note = { id: string; text: string; at: string };
export type Mode = "checking" | "local" | "account";

const uid = () => Math.random().toString(36).slice(2);

/**
 * Reminders + notes. Signed in -> Supabase tables (row-level security: owner only).
 * Otherwise -> this browser's localStorage. Callers see one API either way.
 */
export function useCareStore() {
  const [mode, setMode] = useState<Mode>("checking");
  const [localR, setLocalR, ready1] = useLocalState<Reminder[]>("ss-reminders", []);
  const [localN, setLocalN, ready2] = useLocalState<Note[]>("ss-notes", []);
  const [cloudR, setCloudR] = useState<Reminder[]>([]);
  const [cloudN, setCloudN] = useState<Note[]>([]);
  const [error, setError] = useState("");
  const [sbClient, setSbClient] = useState<SupabaseClient | null>(null);

  const load = useCallback(async () => {
    const sb = await getBrowserSupabase();
    if (!sb) return setMode("local");
    try {
      const { data } = await sb.auth.getUser();
      if (!data.user) return setMode("local");
      const [r, n] = await Promise.all([
        sb.from("reminders").select("id,title,kind,due,done").order("created_at", { ascending: true }),
        sb.from("notes").select("id,body,created_at").order("created_at", { ascending: false }),
      ]);
      if (r.error || n.error) throw new Error("load");
      setCloudR((r.data ?? []).map((x) => ({ id: x.id, title: x.title, kind: x.kind, due: x.due ?? "", done: x.done })));
      setCloudN((n.data ?? []).map((x) => ({ id: x.id, text: x.body, at: new Date(x.created_at).toLocaleString() })));
      setSbClient(sb);
      setMode("account");
    } catch {
      setError("Could not load your saved items from your account. Showing this device's items instead.");
      setMode("local");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const account = mode === "account";
  const fail = () => setError("That change could not be saved to your account. Please try again.");

  async function addReminder(r: Omit<Reminder, "id" | "done">) {
    setError("");
    if (!account) return setLocalR([...localR, { ...r, id: uid(), done: false }]);
    const { data, error } = await sbClient!.from("reminders").insert({ title: r.title, kind: r.kind, due: r.due || null }).select("id").single();
    if (error || !data) return fail();
    setCloudR([...cloudR, { ...r, id: data.id, done: false }]);
  }
  async function updateReminder(id: string, patch: Partial<Omit<Reminder, "id">>) {
    setError("");
    if (!account) return setLocalR(localR.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await sbClient!.from("reminders").update({ ...patch, ...("due" in patch ? { due: patch.due || null } : {}) }).eq("id", id);
    if (error) return fail();
    setCloudR(cloudR.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  async function removeReminder(id: string) {
    setError("");
    if (!account) return setLocalR(localR.filter((x) => x.id !== id));
    const { error } = await sbClient!.from("reminders").delete().eq("id", id);
    if (error) return fail();
    setCloudR(cloudR.filter((x) => x.id !== id));
  }
  async function addNote(text: string) {
    setError("");
    if (!account) return setLocalN([{ id: uid(), text, at: new Date().toLocaleString() }, ...localN]);
    const { data, error } = await sbClient!.from("notes").insert({ body: text }).select("id").single();
    if (error || !data) return fail();
    setCloudN([{ id: data.id, text, at: new Date().toLocaleString() }, ...cloudN]);
  }
  async function removeNote(id: string) {
    setError("");
    if (!account) return setLocalN(localN.filter((x) => x.id !== id));
    const { error } = await sbClient!.from("notes").delete().eq("id", id);
    if (error) return fail();
    setCloudN(cloudN.filter((x) => x.id !== id));
  }
  /** Deletes the saved reminders and notes of whichever store is active (RLS limits cloud deletes to the owner). */
  async function wipe() {
    setError("");
    if (account) {
      const sb = sbClient!;
      const [a, b] = await Promise.all([
        sb.from("reminders").delete().not("id", "is", null),
        sb.from("notes").delete().not("id", "is", null),
      ]);
      if (a.error || b.error) return fail();
      setCloudR([]); setCloudN([]);
    } else {
      setLocalR([]); setLocalN([]);
      try { localStorage.removeItem("ss-reminders"); localStorage.removeItem("ss-notes"); } catch {}
    }
  }

  return {
    mode, ready: mode !== "checking" && ready1 && ready2, error,
    reminders: account ? cloudR : localR,
    notes: account ? cloudN : localN,
    addReminder, updateReminder, removeReminder, addNote, removeNote, wipe,
    hasLocalItems: localR.length + localN.length > 0,
  };
}
