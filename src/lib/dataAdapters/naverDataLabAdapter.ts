import type { AdapterResult, DataLabTrend } from "./types";

const NAVER_DATALAB_URL = "https://openapi.naver.com/v1/datalab/search";

type NaverDataLabResponse = {
  results?: Array<{
    title?: string;
    keywords?: string[];
    data?: Array<{ period: string; ratio: number }>;
  }>;
};

export async function fetchNaverDataLabTrend(keyword: string): Promise<AdapterResult<DataLabTrend | null>> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    return {
      source: "Naver DataLab",
      status: "PARTIAL DATA",
      keyword: "",
      message: "검색어가 비어 있어 네이버 데이터랩을 호출하지 않았습니다.",
      data: null,
      fetchedAt: null,
    };
  }

  if (!clientId || !clientSecret) {
    return {
      source: "Naver DataLab",
      status: "API NOT CONNECTED",
      keyword: normalizedKeyword,
      message: "NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 없어 네이버 데이터랩을 호출하지 않았습니다.",
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
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Naver DataLab failed: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as NaverDataLabResponse;
    const points = payload.results?.[0]?.data ?? [];

    return {
      source: "Naver DataLab",
      status: points.length ? "LIVE DATA" : "PARTIAL DATA",
      keyword: normalizedKeyword,
      message: points.length
        ? "네이버 데이터랩 검색 추세를 실제 점수 계산에 반영했습니다."
        : "네이버 데이터랩 응답은 성공했지만 추세 데이터가 비어 있습니다.",
      data: points.length
        ? {
            keyword: normalizedKeyword,
            trendPoints: points,
            growthRate: calculateGrowthRate(points),
            seasonality: inferSeasonality(points),
          }
        : null,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      source: "Naver DataLab",
      status: "SOURCE LIMITED",
      keyword: normalizedKeyword,
      message: `네이버 데이터랩 호출에 실패했습니다. ${error instanceof Error ? error.message : ""}`.trim(),
      data: null,
      fetchedAt: new Date().toISOString(),
    };
  }
}

function calculateGrowthRate(points: Array<{ ratio: number }>) {
  if (points.length < 2) return 0;
  const firstWindow = average(points.slice(0, Math.min(4, points.length)).map((point) => point.ratio));
  const recentWindow = average(points.slice(-4).map((point) => point.ratio));
  const denominator = firstWindow || 1;
  return Math.round(((recentWindow - firstWindow) / denominator) * 100);
}

function inferSeasonality(points: Array<{ ratio: number }>) {
  if (points.length < 4) return "데이터 부족";
  const recent = average(points.slice(-4).map((point) => point.ratio));
  const previous = average(points.slice(-8, -4).map((point) => point.ratio));
  if (recent >= previous * 1.15) return "상승 계절성";
  if (recent <= previous * 0.85) return "하락 계절성";
  return "안정 추세";
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function getDateBeforeDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}
