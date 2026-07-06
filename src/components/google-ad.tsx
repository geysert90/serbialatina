"use client";

import { useEffect, useId, useRef } from "react";

const AD_CLIENT = "ca-pub-8770248289633380";

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

export function GoogleAd({ format: _format }: { format?: string }) {
  const id = useId();
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // retry on next render
    }
  }, []);

  return (
    <ins
      className="adsbygoogle block w-full"
      data-ad-client={AD_CLIENT}
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"
      id={id}
    />
  );
}
