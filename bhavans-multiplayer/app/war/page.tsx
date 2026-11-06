"use client";
import { Suspense } from "react";
import { War } from "@/components/pages/War";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <War />
    </Suspense>
  );
}
