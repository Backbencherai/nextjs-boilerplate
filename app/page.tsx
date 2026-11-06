"use client";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import dynamic from "next/dynamic";

const Loader = dynamic(() => import("@/components/intro/Opening").then((m) => m.Loader), { ssr: false, loading: () => <div className="blank" /> });
const Story = dynamic(() => import("@/components/intro/Opening").then((m) => m.Story), { ssr: false, loading: () => <div className="blank" /> });
const Onboarding = dynamic(() => import("@/components/intro/Opening").then((m) => m.Onboarding), { ssr: false, loading: () => <div className="blank" /> });
import { Home } from "@/components/home/Home";

type Phase = "wait" | "load" | "story" | "onboard" | "home";

export default function Page() {
  const hydrated = useStore((s) => s.hydrated);
  const me = useStore((s) => s.me);
  const space = useStore((s) => s.space);
  const introSeen = useStore((s) => s.introSeen);
  const markIntroSeen = useStore((s) => s.markIntroSeen);
  const [phase, setPhase] = useState<Phase>("wait");

  const after = useCallback(
    (from: Phase) => {
      const s = useStore.getState();
      const hasId = !!s.me && !!s.space;
      if (from === "load") {
        if (!s.introSeen) return setPhase("story");
        return setPhase(hasId ? "home" : "onboard");
      }
      if (from === "story") {
        if (hasId) {
          markIntroSeen();
          return setPhase("home");
        }
        return setPhase("onboard");
      }
      if (from === "onboard") {
        markIntroSeen();
        setPhase("home");
      }
    },
    [markIntroSeen]
  );

  useEffect(() => {
    if (!hydrated || phase !== "wait") return;
    let seen = false;
    try {
      seen = sessionStorage.getItem("adxd:loaded") === "1";
    } catch {}
    if (!seen) setPhase("load");
    else after("load");
  }, [hydrated, phase, after]);

  const onLoaded = useCallback(() => {
    try {
      sessionStorage.setItem("adxd:loaded", "1");
    } catch {}
    after("load");
  }, [after]);

  const ready = me && space && introSeen;
  return (
    <>
      <AnimatePresence mode="wait">
        {phase === "load" && <Loader key="load" onDone={onLoaded} />}
        {phase === "story" && <Story key="story" onDone={() => after("story")} />}
        {phase === "onboard" && <Onboarding key="onboard" onDone={() => after("onboard")} />}
      </AnimatePresence>
      {phase === "home" && ready && <Home />}
      {phase === "wait" && <div className="blank" />}
    </>
  );
}
