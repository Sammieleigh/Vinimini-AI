import type { AdapterResult, DataLabTrend } from "./types";

const NAVER_SHOPPING_KEYWORDS_URL = "https://openapi.naver.com/v1/datalab/shopping/category/keywords";
const NAVER_SHOPPING_KEYWORD_DEVICE_URL = "https://openapi.naver.com/v1/datalab/shopping/category/keyword/device";
const DEFAULT_WOMEN_FASHION_CATEGORY_ID = "50000000";

type NaverShoppingInsightResponse = {
  results?: Array<{
    title?: string;
    keyword?: string[] | string;
    data?: Array<{ period: string; ratio: number }>;
  }>;
};

class NaverApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorCode?: string,
  ) {
    super(message);
  }
}

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
    const [total, device] = await Promise.all([
      fetchKeywordTrend({ keyword: normalizedKeyword, categoryId, clientId, clientSecret }),
      fetchKeywordDeviceTrend({ keyword: normalizedKeyword, categoryId, clientId, clientSecret }),
    ]);
    const trendPoints = total.results?.[0]?.data ?? [];
    const { pcTrendPoints, mobileTrendPoints } = splitDeviceTrend(device);

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
      status: classifyNaverError(error),
      keyword: normalizedKeyword,
      message: createNaverFailureMessage(error),
      data: null,
      fetchedAt: new Date().toISOString(),
    };
  }
}

async function fetchKeywordTrend({
  keyword,
  categoryId,
  clientId,
  clientSecret,
}: {
  keyword: string;
  categoryId: string;
  clientId: string;
  clientSecret: string;
}) {
  return postNaverShoppingInsight(NAVER_SHOPPING_KEYWORDS_URL, clientId, clientSecret, {
    startDate: getDateBeforeDays(90),
    endDate: getDateBeforeDays(1),
    timeUnit: "week",
    category: categoryId,
    keyword: [{ name: keyword, param: [keyword] }],
  });
}

async function fetchKeywordDeviceTrend({
  keyword,
  categoryId,
  clientId,
  clientSecret,
}: {
  keyword: string;
  categoryId: string;
  clientId: string;
  clientSecret: string;
}) {
  return postNaverShoppingInsight(NAVER_SHOPPING_KEYWORD_DEVICE_URL, clientId, clientSecret, {
    startDate: getDateBeforeDays(90),
    endDate: getDateBeforeDays(1),
    timeUnit: "week",
    category: categoryId,
    keyword,
  });
}

async function postNaverShoppingInsight(url: string, clientId: string, clientSecret: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    body: JSON.stringify(body),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const errorPayload = await parseNaverError(response);
    throw new NaverApiError(errorPayload.message, response.status, errorPayload.errorCode);
  }

  return (await response.json()) as NaverShoppingInsightResponse;
}

async function parseNaverError(response: Response) {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw) as { errorCode?: string; errorMessage?: string; message?: string };
    return {
      errorCode: parsed.errorCode,
      message: parsed.errorMessage || parsed.message || raw,
    };
  } catch {
    return { errorCode: undefined, message: raw };
  }
}

function splitDeviceTrend(payload: NaverShoppingInsightResponse) {
  const results = payload.results ?? [];
  const pc = results.find((result) => normalizeDeviceTitle(result.title).includes("pc"));
  const mobile = results.find((result) => {
    const title = normalizeDeviceTitle(result.title);
    return title.includes("mo") || title.includes("mobile") || title.includes("모바일");
  });

  return {
    pcTrendPoints: pc?.data ?? [],
    mobileTrendPoints: mobile?.data ?? [],
  };
}

function normalizeDeviceTitle(value: string | undefined) {
  return (value || "").toLowerCase().replace(/\s/g, "");
}

function classifyNaverError(error: unknown): AdapterResult<null>["status"] {
  if (error instanceof NaverApiError && (error.status === 401 || error.errorCode === "024")) return "SOURCE LIMITED";
  return "SOURCE LIMITED";
}

function createNaverFailureMessage(error: unknown) {
  if (error instanceof NaverApiError && (error.status === 401 || error.errorCode === "024")) {
    return [
      "네이버 API 인증 실패",
      "환경변수 또는 API 권한 확인 필요",
      "Naver Developers에서 DataLab Shopping Insight 사용 권한과 애플리케이션 API 설정을 확인해주세요.",
      `상태: ${error.status}${error.errorCode ? ` / errorCode ${error.errorCode}` : ""}`,
    ].join(" · ");
  }

  if (error instanceof NaverApiError) {
    return `네이버 쇼핑인사이트 호출에 실패했습니다. SOURCE LIMITED로 표시합니다. 상태: ${error.status}${error.errorCode ? ` / errorCode ${error.errorCode}` : ""}`;
  }

  return `네이버 쇼핑인사이트 호출에 실패했습니다. SOURCE LIMITED로 표시합니다. ${error instanceof Error ? error.message : ""}`.trim();
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
