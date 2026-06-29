import type { DataEngineSource, DataFreshness } from "@/lib/viniminiDataEngine";

export type AdapterEnvironmentStatus = {
  coupangPartners: DataFreshness;
  naverDataLab: DataFreshness;
  naverSearchAd: DataFreshness;
  googleTrends: DataFreshness;
};

export function getAdapterEnvironmentStatus(): AdapterEnvironmentStatus {
  return {
    coupangPartners: hasAnyCredentialPair(["COUPANG_PARTNERS_ACCESS_KEY", "COUPANG_PARTNERS_SECRET_KEY"], ["COUPANG_ACCESS_KEY", "COUPANG_SECRET_KEY"])
      ? "LIVE DATA"
      : "API NOT CONNECTED",
    naverDataLab: hasEnv("NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET") ? "LIVE DATA" : "API NOT CONNECTED",
    naverSearchAd: hasEnv("NAVER_SEARCHAD_API_KEY", "NAVER_SEARCHAD_SECRET_KEY", "NAVER_SEARCHAD_CUSTOMER_ID")
      ? "LIVE DATA"
      : "API NOT CONNECTED",
    googleTrends: "DISABLED",
  };
}

export function createDataEngineSources(status: AdapterEnvironmentStatus): DataEngineSource[] {
  return [
    {
      name: "쿠팡 파트너스 API",
      status: status.coupangPartners,
      role: "공식 상품 데이터 연결",
      provides: ["상품명", "가격", "이미지", "상품 URL", "브랜드", "카테고리"],
    },
    {
      name: "네이버 데이터랩",
      status: status.naverDataLab,
      role: "검색 추세와 계절성 계산",
      provides: ["검색량 추세", "성장률", "계절성"],
    },
    {
      name: "네이버 검색광고 키워드 도구",
      status: status.naverSearchAd,
      role: "수요 규모와 경쟁도 계산",
      provides: ["전체 월 검색량", "PC 검색량", "모바일 검색량", "모바일 검색 비중", "경쟁도", "연관 키워드"],
    },
    {
      name: "Google Trends",
      status: status.googleTrends,
      role: "글로벌 추세 보조 신호",
      provides: ["검색 추세", "급상승 키워드"],
    },
    {
      name: "VINIMINI AI Score Engine",
      status: hasLiveSource(status) ? "PARTIAL DATA" : "SOURCE LIMITED",
      role: "CEO 의사결정 점수 계산",
      provides: ["기회 점수", "진입 난이도", "예상 마진", "모바일 구매 적합도", "광고 경쟁 위험"],
    },
  ];
}

function hasEnv(...keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]));
}

function hasAnyCredentialPair(...pairs: string[][]) {
  return pairs.some((pair) => pair.every((key) => Boolean(process.env[key])));
}

function hasLiveSource(status: AdapterEnvironmentStatus) {
  return [status.coupangPartners, status.naverDataLab, status.naverSearchAd].some((item) => item === "LIVE DATA");
}
