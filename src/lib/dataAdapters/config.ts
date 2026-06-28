import type { DataEngineSource, DataFreshness } from "@/lib/viniminiDataEngine";

export type AdapterEnvironmentStatus = {
  coupangPartners: DataFreshness;
  naverDataLab: DataFreshness;
  naverSearchAd: DataFreshness;
  googleTrends: DataFreshness;
};

export function getAdapterEnvironmentStatus(): AdapterEnvironmentStatus {
  return {
    coupangPartners: hasEnv("COUPANG_PARTNERS_ACCESS_KEY", "COUPANG_PARTNERS_SECRET_KEY") ? "LIVE DATA" : "API NOT CONNECTED",
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
      role: "상품 후보 생성",
      provides: ["상품명", "가격", "이미지", "상품 URL", "브랜드 후보", "카테고리 후보"],
    },
    {
      name: "네이버 데이터랩",
      status: status.naverDataLab,
      role: "시장 수요 계산",
      provides: ["검색량", "시즌성", "증가율"],
    },
    {
      name: "네이버 검색광고 키워드 도구",
      status: status.naverSearchAd,
      role: "시장 규모 계산",
      provides: ["월간 검색량", "경쟁도", "연관 키워드"],
    },
    {
      name: "Google Trends",
      status: status.googleTrends,
      role: "트렌드 점수 계산",
      provides: ["검색 추세", "급상승 키워드"],
    },
    {
      name: "VINIMINI AI Score Engine",
      status: hasLiveSource(status) ? "PARTIAL DATA" : "SOURCE LIMITED",
      role: "CEO 의사결정 점수 계산",
      provides: ["Opportunity Score", "진입 난이도", "예상 마진", "Strong Buy", "신규 셀러 성공 확률"],
    },
  ];
}

function hasEnv(...keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]));
}

function hasLiveSource(status: AdapterEnvironmentStatus) {
  return [status.coupangPartners, status.naverDataLab, status.naverSearchAd].some((item) => item === "LIVE DATA");
}
