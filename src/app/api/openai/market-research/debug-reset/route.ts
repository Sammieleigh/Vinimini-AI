import { NextResponse } from "next/server";
import { resetOpenAiMarketResearchDebugUsage } from "@/lib/openAiMarketResearch";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = resetOpenAiMarketResearchDebugUsage();

  return NextResponse.json(result, { status: result.ok ? 200 : 403 });
}
