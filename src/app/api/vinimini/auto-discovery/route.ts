import { NextResponse } from "next/server";
import { runAutoDiscovery } from "@/lib/autoDiscovery";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("forceRefresh") === "true";

  try {
    const result = await runAutoDiscovery({ forceRefresh });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        cacheStatus: "Analysis Limited",
        message: `AI Auto Discovery failed. ${error instanceof Error ? error.message : ""}`.trim(),
      },
      { status: 500 },
    );
  }
}
