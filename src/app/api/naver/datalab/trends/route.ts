import { NextResponse } from "next/server";
import { fetchNaverDataLabTrend } from "@/lib/dataAdapters/naverDataLabAdapter";

export const dynamic = "force-dynamic";

const DEFAULT_KEYWORDS = ["와이드슬랙스", "냉감팬츠", "여성반팔"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keywords = parseKeywords(searchParams.get("keywords"));
  const results = await Promise.all(keywords.map((keyword) => fetchNaverDataLabTrend(keyword)));
  const hasLiveData = results.some((result) => result.status === "LIVE DATA");
  const hasError = results.some((result) => result.status === "PARTIAL DATA" && !result.data);

  return NextResponse.json({
    ok: !hasError || hasLiveData,
    source: "Naver DataLab",
    status: hasLiveData ? "LIVE DATA" : "PARTIAL DATA",
    keywords,
    message: hasLiveData
      ? "네이버 데이터랩 검색어 트렌드 API 연결 성공"
      : "네이버 API 키가 없거나 호출이 실패해 실제 트렌드 데이터를 표시할 수 없습니다.",
    results,
  });
}

function parseKeywords(value: string | null) {
  const keywords = value
    ?.split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 5);

  return keywords?.length ? keywords : DEFAULT_KEYWORDS;
}
