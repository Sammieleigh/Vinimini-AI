import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_TTL_HOURS = 24;
const DEFAULT_DAILY_LIMIT = 10;

type CachedResult = {
  createdAt: number;
  result: OpenAiCoupangCheckResult;
};

type OpenAiCoupangCheckResult = {
  ok: boolean;
  keyword: string;
  date: string;
  source: "cache" | "disabled" | "openai" | "openai-error";
  dataLabel: "OPENAI MARKET ANALYSIS" | "OPENAI API NOT CONNECTED" | "COUPANG API NOT CONNECTED";
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
  const ttlHours = Number(process.env.OPENAI_CACHE_TTL_HOURS || DEFAULT_TTL_HOURS);
  const ttlMs = Math.max(1, ttlHours) * 60 * 60 * 1000;
  const dailyLimit = Number(process.env.OPENAI_DAILY_LIMIT || DEFAULT_DAILY_LIMIT);
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

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      createBaseResult(keyword, date, "disabled", "OPENAI_API_KEY가 없어 OpenAI를 호출하지 않았습니다.", undefined, undefined, "OPENAI API NOT CONNECTED"),
    );
  }

  if (openAiCallCount >= dailyLimit) {
    return NextResponse.json(
      createBaseResult(
        keyword,
        date,
        "disabled",
        `OpenAI daily limit reached. 오늘 허용된 ${dailyLimit}회 호출을 모두 사용했습니다. 캐시된 분석만 사용하세요.`,
        undefined,
        undefined,
        "OPENAI API NOT CONNECTED",
      ),
      { status: 429 },
    );
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
              "You are VINIMINI AI Market Department. You are an executive reasoning engine, not a data source. Do not invent Coupang live product facts. Analyze only the given context and clearly say when more data is required.",
          },
          {
            role: "user",
            content: `Keyword: "${keyword}". Create a short Korean AI Market Department briefing for the CEO. Include: 1) what OpenAI can analyze, 2) what it cannot know without Coupang/Naver live data, 3) next CEO action. If evidence is insufficient, say "추가 데이터 필요".`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const outputText = extractOutputText(payload);
    const result = createBaseResult(
      keyword,
      date,
      "openai",
      outputText ||
        "OpenAI API 호출은 성공했습니다. 단, OpenAI 단독으로는 쿠팡의 실시간 상품명, 썸네일, 리뷰수, 평점을 가져올 수 없으므로 수집된 데이터의 분석, 요약, 점수화, 실행 전략 제안에 사용해야 합니다.",
      model,
      outputText,
      "OPENAI MARKET ANALYSIS",
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
        undefined,
        "OPENAI API NOT CONNECTED",
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
  dataLabel: OpenAiCoupangCheckResult["dataLabel"] = "COUPANG API NOT CONNECTED",
): OpenAiCoupangCheckResult {
  return {
    ok: source !== "openai-error",
    keyword,
    date,
    source,
    dataLabel,
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

function extractOutputText(payload: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }) {
  if (payload.output_text) return payload.output_text;
  return payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text).filter(Boolean).join("\n").trim() || "";
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
