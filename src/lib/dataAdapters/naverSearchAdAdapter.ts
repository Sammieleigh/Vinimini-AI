import { createHmac } from "crypto";
import type { AdapterResult, SearchAdKeyword } from "./types";

const NAVER_SEARCHAD_ORIGIN = "https://api.searchad.naver.com";
const KEYWORD_TOOL_PATH = "/keywordstool";

type NaverSearchAdResponse = {
  keywordList?: Array<{
    relKeyword?: string;
    monthlyPcQcCnt?: string | number;
    monthlyMobileQcCnt?: string | number;
    compIdx?: string;
  }>;
};

export async function fetchNaverSearchAdKeywords(keyword: string): Promise<AdapterResult<SearchAdKeyword | null>> {
  const apiKey = process.env.NAVER_SEARCHAD_API_KEY;
  const secretKey = process.env.NAVER_SEARCHAD_SECRET_KEY;
  const customerId = process.env.NAVER_SEARCHAD_CUSTOMER_ID;
  const normalizedKeyword = keyword.trim();

  if (!apiKey || !secretKey || !customerId) {
    return {
      source: "Naver SearchAd Keyword Tool",
      status: "DEMO DATA",
      keyword: normalizedKeyword,
      message: "네이버 검색광고 키가 없어 월간 검색량, 경쟁도, 연관 키워드는 DEMO fallback입니다.",
      data: null,
      fetchedAt: null,
    };
  }

  const query = `hintKeywords=${encodeURIComponent(normalizedKeyword)}&showDetail=1`;
  const timestamp = Date.now().toString();
  const signature = createSignature(timestamp, "GET", KEYWORD_TOOL_PATH, secretKey);

  try {
    const response = await fetch(`${NAVER_SEARCHAD_ORIGIN}${KEYWORD_TOOL_PATH}?${query}`, {
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": apiKey,
        "X-Customer": customerId,
        "X-Signature": signature,
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`Naver SearchAd failed: ${response.status}`);
    }

    const payload = (await response.json()) as NaverSearchAdResponse;
    const keywords = payload.keywordList ?? [];
    const main = keywords[0];

    return {
      source: "Naver SearchAd Keyword Tool",
      status: main ? "LIVE DATA" : "PARTIAL DATA",
      keyword: normalizedKeyword,
      message: main ? "네이버 검색광고 키워드 데이터를 연결했습니다." : "네이버 검색광고 응답은 성공했지만 키워드 데이터가 비어 있습니다.",
      data: main
        ? {
            keyword: main.relKeyword || normalizedKeyword,
            monthlySearchVolume: parseCount(main.monthlyPcQcCnt) + parseCount(main.monthlyMobileQcCnt),
            competition: main.compIdx || "미제공",
            relatedKeywords: keywords
              .map((item) => item.relKeyword)
              .filter((item): item is string => Boolean(item))
              .slice(0, 10),
          }
        : null,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      source: "Naver SearchAd Keyword Tool",
      status: "PARTIAL DATA",
      keyword: normalizedKeyword,
      message: `네이버 검색광고 호출에 실패해 DEMO fallback을 유지합니다. ${error instanceof Error ? error.message : ""}`.trim(),
      data: null,
      fetchedAt: new Date().toISOString(),
    };
  }
}

function createSignature(timestamp: string, method: string, path: string, secretKey: string) {
  return createHmac("sha256", secretKey).update(`${timestamp}.${method}.${path}`).digest("base64");
}

function parseCount(value: string | number | undefined) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  if (value === "< 10") return 9;
  const parsed = Number(value.toString().replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
