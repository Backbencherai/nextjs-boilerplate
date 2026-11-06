"use client";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { Home } from "@/components/home/Home";

const blank = () => <div className="blank" />;
const Loader = dynamic(() => import("@/components/intro/Opening").then((m) => m.Loader), { ssr: false, loading: blank });
const Landing = dynamic(() => import("@/components/intro/Opening").then((m) => m.Landing), { ssr: false, loading: blank });
const Story = dynamic(() => import("@/components/intro/Opening").then((m) => m.Story), { ssr: false, loading: blank });
const Onboarding = dynamic(() => import("@/components/intro/Opening").then((m) => m.Onboarding), { ssr: false, loading: blank });

type Phase = "wait" | "load" | "landing" | "story" | "onboard" | "home";

export default function Page() {
  const hydrated = useStore((s) => s.hydrated);
  const me = useStore((s) => s.me);
  const space = useStore((s) => s.space);
  const introSeen = useStore((s) => s.introSeen);
  const markIntroSeen = useStore((s) => s.markIntroSeen);
  const [phase, setPhase] = useState<Phase>("wait");
  const hasId = () => {
    const s = useStore.getState();
    return !!s.me && !!s.space;
  };

  useEffect(() => {
    if (!hydrated || phase !== "wait") return;
    let seen = false;
    try {
      seen = sessionStorage.getItem("adxd:loaded") === "1";
    } catch {}
    if (!seen) setPhase("load");
    else setPhase(hasId() && useStore.getState().introSeen ? "home" : "landing");
  }, [hydrated, phase]);

  const onLoaded = useCallback(() => {
    try {
      sessionStorage.setItem("adxd:loaded", "1");
    } catch {}
    setPhase("landing");
  }, []);

  const afterStory = () => {
    if (hasId()) {
      markIntroSeen();
      setPhase("home");
    } else setPhase("onboard");
  };
  const start = () => {
    if (hasId()) {
      markIntroSeen();
      setPhase("home");
    } else if (!useStore.getState().introSeen) setPhase("story");
    else setPhase("onboard");
  };

  const ready = me && space && introSeen;
  return (
    <>
      <AnimatePresence mode="wait">
        {phase === "load" && <Loader key="load" onDone={onLoaded} />}
        {phase === "landing" && <Landing key="landing" onStart={start} onStory={() => setPhase("story")} returning={!!me && !!space} />}
        {phase === "story" && <Story key="story" onDone={afterStory} />}
        {phase === "onboard" &&
          <Onboarding
            key="onboard"
            onDone={() => {
              markIntroSeen();
              setPhase("home");
            }}
          />
        }
      </AnimatePresence>
      {phase === "home" && ready && <Home />}
      {phase === "wait" && <div className="blank" />}
    </>
  );
}
