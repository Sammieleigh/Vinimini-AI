import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

type CachedResult = {
  createdAt: number;
  result: OpenAiCoupangCheckResult;
};

type OpenAiCoupangCheckResult = {
  ok: boolean;
  keyword: string;
  date: string;
  source: "cache" | "disabled" | "openai" | "openai-error";
  dataLabel: "DEMO DATA / NO LIVE COUPANG DATA";
  canOpenAiFetchLiveCoupangData: false;
  conclusion: string;
  allowedRole: string[];
  blockedRole: string[];
  openAiCallCount: number;
  lastOpenAiCallAt: string | null;
  model?: string;
  rawOpenAiSummary?: string;
};

const cache = new Map<string, CachedResult>();
let openAiCallCount = 0;
let lastOpenAiCallAt: string | null = null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim() || "여성패션";
  const forceRefresh = searchParams.get("forceRefresh") === "true";
  const date = getKoreanDateKey();
  const ttlMs = Number(process.env.OPENAI_CACHE_TTL_MS || DEFAULT_TTL_MS);
  const cacheKey = `${date}:${keyword}`;
  const cached = cache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.createdAt < ttlMs) {
    return NextResponse.json({
      ...cached.result,
      source: "cache",
      openAiCallCount,
      lastOpenAiCallAt,
    });
  }

  if (process.env.ENABLE_OPENAI_TEST !== "true") {
    return NextResponse.json(createBaseResult(keyword, date, "disabled", "OpenAI 테스트 호출은 비활성화되어 있습니다. ENABLE_OPENAI_TEST=true일 때만 호출합니다."));
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(createBaseResult(keyword, date, "disabled", "OPENAI_API_KEY가 없어 OpenAI를 호출하지 않았습니다."));
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  try {
    openAiCallCount += 1;
    lastOpenAiCallAt = new Date().toISOString();
    console.info(`[VINIMINI] OpenAI test call #${openAiCallCount} at ${lastOpenAiCallAt} keyword="${keyword}"`);

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "You are a strict product data validation assistant. You do not browse the web, do not invent Coupang products, and do not claim live data unless live source data is provided.",
          },
          {
            role: "user",
            content: `Question: Can OpenAI API alone fetch live Coupang product names, thumbnails, review counts, and ratings for keyword "${keyword}" without a Coupang/public data source? Answer briefly in Korean. Make clear that no live Coupang data was provided.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const payload = (await response.json()) as { output_text?: string };
    const result = createBaseResult(
      keyword,
      date,
      "openai",
      "OpenAI API 단독으로는 쿠팡의 실시간 상품명, 썸네일, 리뷰수, 평점을 가져올 수 없습니다. OpenAI는 수집된 데이터의 분석, 요약, 점수화, 실행 전략 제안에 사용해야 합니다.",
      model,
      payload.output_text,
    );

    cache.set(cacheKey, { createdAt: Date.now(), result });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      createBaseResult(
        keyword,
        date,
        "openai-error",
        `OpenAI 테스트 호출에 실패했습니다. 쿠팡 LIVE DATA는 없습니다. ${error instanceof Error ? error.message : ""}`.trim(),
        model,
      ),
      { status: 502 },
    );
  }
}

function createBaseResult(
  keyword: string,
  date: string,
  source: OpenAiCoupangCheckResult["source"],
  conclusion: string,
  model?: string,
  rawOpenAiSummary?: string,
): OpenAiCoupangCheckResult {
  return {
    ok: source !== "openai-error",
    keyword,
    date,
    source,
    dataLabel: "DEMO DATA / NO LIVE COUPANG DATA",
    canOpenAiFetchLiveCoupangData: false,
    conclusion,
    allowedRole: ["수집된 쿠팡 데이터 분석", "Opportunity Score 계산 보조", "리뷰 불만 요약", "썸네일/상세페이지 개선안 제안", "CEO 실행 전략 작성"],
    blockedRole: ["쿠팡 실시간 상품 검색 대체", "상품명/썸네일/리뷰수/평점 생성", "출처 없는 LIVE DATA 표시", "쿠팡 데이터를 추측해서 채우기"],
    openAiCallCount,
    lastOpenAiCallAt,
    model,
    rawOpenAiSummary,
  };
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
