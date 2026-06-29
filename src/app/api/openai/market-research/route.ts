import { NextResponse } from "next/server";
import { runOpenAiMarketResearch } from "@/lib/openAiMarketResearch";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim() || "여성패션";
  const url = searchParams.get("url")?.trim() || "";
  const forceRefresh = searchParams.get("forceRefresh") === "true";

  try {
    const result = await runOpenAiMarketResearch({ keyword, url, forceRefresh });
    return NextResponse.json(result, { status: result.cacheStatus === "Analysis Limited" ? 502 : 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        cacheStatus: "Analysis Limited",
        message: `OpenAI Executive Market Research failed. ${error instanceof Error ? error.message : ""}`.trim(),
      },
      { status: 500 },
    );
  }
}
