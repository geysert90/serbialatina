import { NextResponse } from "next/server";

import { getPushPublicKey, hasPushProviderApiKey, isPushConfigured } from "@/lib/push";

export async function GET() {
  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push notifications are not configured." },
      { status: 503 },
    );
  }

  const publicKey = getPushPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { error: "Push public key is missing." },
      { status: 500 },
    );
  }

  return NextResponse.json({ publicKey, providerApiKeyConfigured: hasPushProviderApiKey() });
}
