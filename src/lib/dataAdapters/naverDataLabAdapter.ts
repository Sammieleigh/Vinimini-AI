import type { AdapterResult, DataLabTrend } from "./types";

const NAVER_DATALAB_URL = "https://openapi.naver.com/v1/datalab/search";

type NaverDataLabResponse = {
  results?: Array<{
    title?: string;
    data?: Array<{ period: string; ratio: number }>;
  }>;
};

export async function fetchNaverDataLabTrend(keyword: string): Promise<AdapterResult<DataLabTrend | null>> {
  const clientId = process.env.NAVER_DATALAB_CLIENT_ID;
  const clientSecret = process.env.NAVER_DATALAB_CLIENT_SECRET;
  const normalizedKeyword = keyword.trim();

  if (!clientId || !clientSecret) {
    return {
      source: "Naver DataLab",
      status: "DEMO DATA",
      keyword: normalizedKeyword,
      message: "네이버 데이터랩 키가 없어 검색 추이, 시즌성, 성장률은 DEMO fallback입니다.",
      data: null,
      fetchedAt: null,
    };
  }

  try {
    const response = await fetch(NAVER_DATALAB_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      body: JSON.stringify({
        startDate: getDateBeforeDays(90),
        endDate: getDateBeforeDays(1),
        timeUnit: "week",
        keywordGroups: [{ groupName: normalizedKeyword, keywords: [normalizedKeyword] }],
      }),
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`Naver DataLab failed: ${response.status}`);
    }

    const payload = (await response.json()) as NaverDataLabResponse;
    const firstResult = payload.results?.[0];
    const points = firstResult?.data ?? [];

    return {
      source: "Naver DataLab",
      status: points.length ? "LIVE DATA" : "PARTIAL DATA",
      keyword: normalizedKeyword,
      message: points.length ? "네이버 데이터랩 검색 추이를 연결했습니다." : "네이버 데이터랩 응답은 성공했지만 추이 데이터가 비어 있습니다.",
      data: {
        keyword: normalizedKeyword,
        trendPoints: points,
        growthRate: calculateGrowthRate(points),
        seasonality: inferSeasonality(points),
      },
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      source: "Naver DataLab",
      status: "PARTIAL DATA",
      keyword: normalizedKeyword,
      message: `네이버 데이터랩 호출에 실패해 DEMO fallback을 유지합니다. ${error instanceof Error ? error.message : ""}`.trim(),
      data: null,
      fetchedAt: new Date().toISOString(),
    };
  }
}

function calculateGrowthRate(points: Array<{ ratio: number }>) {
  if (points.length < 2) return 0;
  const first = points[0].ratio || 1;
  const last = points[points.length - 1].ratio;
  return Math.round(((last - first) / first) * 100);
}

function inferSeasonality(points: Array<{ ratio: number }>) {
  if (points.length < 4) return "데이터 부족";
  const recent = points.slice(-4).reduce((sum, point) => sum + point.ratio, 0) / 4;
  const previous = points.slice(0, Math.min(4, points.length)).reduce((sum, point) => sum + point.ratio, 0) / Math.min(4, points.length);
  return recent >= previous ? "상승 시즌" : "하락 또는 안정";
}

function getDateBeforeDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}
