import type { AdapterResult, GoogleTrendSignal } from "./types";

export async function fetchGoogleTrendSignal(keyword: string): Promise<AdapterResult<GoogleTrendSignal | null>> {
  const normalizedKeyword = keyword.trim();

  return {
    source: "Google Trends",
    status: "DISABLED",
    keyword: normalizedKeyword,
    message: "Google Trends는 공식 서버 API가 확인되지 않아 현재 Adapter를 DISABLED 상태로 둡니다.",
    data: null,
    fetchedAt: null,
  };
}
