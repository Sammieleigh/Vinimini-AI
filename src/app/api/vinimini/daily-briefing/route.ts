import { NextResponse } from "next/server";
import { fetchViniminiMarketSignals } from "@/lib/dataAdapters";
import { createDataEngineSources, getAdapterEnvironmentStatus } from "@/lib/dataAdapters/config";
import { createDailyCoupangBriefing, DATA_ENGINE_CACHE_TTL_HOURS, type DailyCoupangBriefing } from "@/lib/viniminiDataEngine";

export const dynamic = "force-dynamic";

type BriefingCache = {
  createdAt: number;
  cacheKey: string;
  briefing: DailyCoupangBriefing;
  marketSignals: Awaited<ReturnType<typeof fetchViniminiMarketSignals>>;
};

let cache: BriefingCache | null = null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("forceRefresh") === "true";
  const dateKey = getKoreanDateKey();
  const keyword = searchParams.get("keyword")?.trim() || "여성패션";
  const cacheKey = `${dateKey}:${keyword}`;
  const ttlMs = DATA_ENGINE_CACHE_TTL_HOURS * 60 * 60 * 1000;

  if (!forceRefresh && cache && cache.cacheKey === cacheKey && Date.now() - cache.createdAt < ttlMs) {
    return NextResponse.json({
      source: "cache",
      ttlHours: DATA_ENGINE_CACHE_TTL_HOURS,
      briefing: cache.briefing,
      marketSignals: cache.marketSignals,
    });
  }

  const marketSignals = await fetchViniminiMarketSignals(keyword);
  const briefing = createDailyCoupangBriefing(undefined, createDataEngineSources(getAdapterEnvironmentStatus()));
  cache = {
    createdAt: Date.now(),
    cacheKey,
    briefing,
    marketSignals,
  };

  return NextResponse.json({
    source: "generated",
    ttlHours: DATA_ENGINE_CACHE_TTL_HOURS,
    briefing,
    marketSignals,
  });
}

function getKoreanDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}
