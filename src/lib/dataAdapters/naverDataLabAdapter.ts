import type { AdapterResult, DataLabTrend } from "./types";

const NAVER_SHOPPING_INSIGHT_URL = "https://openapi.naver.com/v1/datalab/shopping/categories/keywords";
const DEFAULT_WOMEN_FASHION_CATEGORY_ID = "50000000";

type NaverShoppingInsightResponse = {
  results?: Array<{
    title?: string;
    keyword?: string[];
    data?: Array<{ period: string; ratio: number }>;
  }>;
};

export async function fetchNaverDataLabTrend(keyword: string): Promise<AdapterResult<DataLabTrend | null>> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const categoryId = process.env.NAVER_SHOPPING_CATEGORY_ID || DEFAULT_WOMEN_FASHION_CATEGORY_ID;
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    return {
      source: "Naver DataLab Shopping Insight",
      status: "PARTIAL DATA",
      keyword: "",
      message: "검색어가 비어 있어 네이버 쇼핑인사이트를 호출하지 않았습니다.",
      data: null,
      fetchedAt: null,
    };
  }

  if (!clientId || !clientSecret) {
    return {
      source: "Naver DataLab Shopping Insight",
      status: "API NOT CONNECTED",
      keyword: normalizedKeyword,
      message: "NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 없어 네이버 쇼핑인사이트를 호출하지 않았습니다.",
      data: null,
      fetchedAt: null,
    };
  }

  try {
    const [total, pc, mobile] = await Promise.all([
      fetchShoppingInsight({ keyword: normalizedKeyword, categoryId, clientId, clientSecret }),
      fetchShoppingInsight({ keyword: normalizedKeyword, categoryId, clientId, clientSecret, device: "pc" }),
      fetchShoppingInsight({ keyword: normalizedKeyword, categoryId, clientId, clientSecret, device: "mo" }),
    ]);
    const trendPoints = total.results?.[0]?.data ?? [];
    const pcTrendPoints = pc.results?.[0]?.data ?? [];
    const mobileTrendPoints = mobile.results?.[0]?.data ?? [];

    return {
      source: "Naver DataLab Shopping Insight",
      status: trendPoints.length ? "LIVE DATA" : "PARTIAL DATA",
      keyword: normalizedKeyword,
      message: trendPoints.length
        ? "네이버 쇼핑인사이트 수요, 트렌드, PC/모바일 비중을 실제 점수 계산에 반영했습니다."
        : "네이버 쇼핑인사이트 응답은 성공했지만 추세 데이터가 비어 있습니다.",
      data: trendPoints.length
        ? {
            keyword: normalizedKeyword,
            trendPoints,
            pcTrendPoints,
            mobileTrendPoints,
            growthRate: calculateGrowthRate(trendPoints),
            seasonality: inferSeasonality(trendPoints),
            mobileTrendRatio: calculateDeviceRatio(mobileTrendPoints, pcTrendPoints),
            pcTrendRatio: calculateDeviceRatio(pcTrendPoints, mobileTrendPoints),
            categoryId,
          }
        : null,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      source: "Naver DataLab Shopping Insight",
      status: "SOURCE LIMITED",
      keyword: normalizedKeyword,
      message: `네이버 쇼핑인사이트 호출에 실패했습니다. ${error instanceof Error ? error.message : ""}`.trim(),
      data: null,
      fetchedAt: new Date().toISOString(),
    };
  }
}

async function fetchShoppingInsight({
  keyword,
  categoryId,
  clientId,
  clientSecret,
  device,
}: {
  keyword: string;
  categoryId: string;
  clientId: string;
  clientSecret: string;
  device?: "pc" | "mo";
}) {
  const response = await fetch(NAVER_SHOPPING_INSIGHT_URL, {
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
      category: categoryId,
      keyword: [{ name: keyword, param: [keyword] }],
      ...(device ? { device } : {}),
    }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Naver Shopping Insight failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as NaverShoppingInsightResponse;
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

function calculateDeviceRatio(primary: Array<{ ratio: number }>, secondary: Array<{ ratio: number }>) {
  const primaryRecent = average(primary.slice(-4).map((point) => point.ratio));
  const secondaryRecent = average(secondary.slice(-4).map((point) => point.ratio));
  const total = primaryRecent + secondaryRecent;
  if (!total) return null;
  return Math.round((primaryRecent / total) * 100);
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function getDateBeforeDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}
