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
      status: "API NOT CONNECTED",
      keyword: normalizedKeyword,
      message: "네이버 검색광고 API 키가 없어 월 검색량과 경쟁도를 연결하지 않았습니다.",
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
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Naver SearchAd failed: ${response.status}`);
    }

    const payload = (await response.json()) as NaverSearchAdResponse;
    const keywords = payload.keywordList ?? [];
    const main = findMainKeyword(keywords, normalizedKeyword) ?? keywords[0];

    if (!main) {
      return {
        source: "Naver SearchAd Keyword Tool",
        status: "PARTIAL DATA",
        keyword: normalizedKeyword,
        message: "네이버 검색광고 응답은 성공했지만 키워드 데이터가 비어 있습니다.",
        data: null,
        fetchedAt: new Date().toISOString(),
      };
    }

    const pcMonthlySearchVolume = parseCount(main.monthlyPcQcCnt);
    const mobileMonthlySearchVolume = parseCount(main.monthlyMobileQcCnt);
    const totalMonthlySearchVolume = pcMonthlySearchVolume + mobileMonthlySearchVolume;

    return {
      source: "Naver SearchAd Keyword Tool",
      status: "LIVE DATA",
      keyword: normalizedKeyword,
      message: "네이버 검색광고 월 검색량, PC/모바일 검색량, 경쟁도, 연관 키워드를 연결했습니다.",
      data: {
        keyword: main.relKeyword || normalizedKeyword,
        totalMonthlySearchVolume,
        pcMonthlySearchVolume,
        mobileMonthlySearchVolume,
        mobileSearchRatio: totalMonthlySearchVolume ? Math.round((mobileMonthlySearchVolume / totalMonthlySearchVolume) * 100) : null,
        pcSearchRatio: totalMonthlySearchVolume ? Math.round((pcMonthlySearchVolume / totalMonthlySearchVolume) * 100) : null,
        competitionLevel: normalizeCompetition(main.compIdx),
        relatedKeywords: keywords
          .map((item) => item.relKeyword)
          .filter((item): item is string => Boolean(item))
          .slice(0, 10),
      },
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      source: "Naver SearchAd Keyword Tool",
      status: "SOURCE LIMITED",
      keyword: normalizedKeyword,
      message: `네이버 검색광고 호출에 실패했습니다. SOURCE LIMITED로 표시합니다. ${error instanceof Error ? error.message : ""}`.trim(),
      data: null,
      fetchedAt: new Date().toISOString(),
    };
  }
}

function createSignature(timestamp: string, method: string, path: string, secretKey: string) {
  return createHmac("sha256", secretKey).update(`${timestamp}.${method}.${path}`).digest("base64");
}

function findMainKeyword(
  keywords: Array<{ relKeyword?: string; monthlyPcQcCnt?: string | number; monthlyMobileQcCnt?: string | number; compIdx?: string }>,
  keyword: string,
) {
  const normalized = keyword.replace(/\s/g, "").toLowerCase();
  return keywords.find((item) => item.relKeyword?.replace(/\s/g, "").toLowerCase() === normalized);
}

function normalizeCompetition(value: string | undefined) {
  if (!value) return "데이터 부족";
  if (value === "높음" || value === "중간" || value === "낮음") return value;
  if (value.toUpperCase() === "HIGH") return "높음";
  if (value.toUpperCase() === "MID") return "중간";
  if (value.toUpperCase() === "LOW") return "낮음";
  return value;
}

function parseCount(value: string | number | undefined) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  if (value === "< 10") return 9;
  const parsed = Number(value.toString().replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
