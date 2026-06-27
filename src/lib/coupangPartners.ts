export type PartnersCapabilityStatus = "가능" | "불가능" | "대체 필요";

export type PartnersCapability = {
  item: string;
  status: PartnersCapabilityStatus;
  officialData: string;
  viniminiDecision: string;
};

export type PartnersCapabilityReport = {
  mode: "mock-adapter" | "credentials-ready";
  label: "MOCK ADAPTER / NO LIVE AFFILIATE DATA" | "COUPANG PARTNERS CREDENTIALS READY";
  summary: string;
  requiredEnv: string[];
  endpointsToVerify: string[];
  capabilities: PartnersCapability[];
};

const requiredEnv = ["COUPANG_PARTNERS_ACCESS_KEY", "COUPANG_PARTNERS_SECRET_KEY", "COUPANG_PARTNERS_SUB_ID"];

export function hasCoupangPartnersCredentials() {
  return Boolean(process.env.COUPANG_PARTNERS_ACCESS_KEY && process.env.COUPANG_PARTNERS_SECRET_KEY);
}

export function getCoupangPartnersCapabilityReport(): PartnersCapabilityReport {
  const hasCredentials = hasCoupangPartnersCredentials();

  return {
    mode: hasCredentials ? "credentials-ready" : "mock-adapter",
    label: hasCredentials ? "COUPANG PARTNERS CREDENTIALS READY" : "MOCK ADAPTER / NO LIVE AFFILIATE DATA",
    summary: hasCredentials
      ? "쿠팡 파트너스 키가 감지되었습니다. 다음 단계에서 실제 endpoint 호출 검증이 가능합니다."
      : "쿠팡 파트너스 키가 없어 실제 호출은 하지 않고 공식 API 검증 구조만 준비했습니다.",
    requiredEnv,
    endpointsToVerify: [
      "GET /v2/providers/affiliate_open_api/apis/openapi/products/search",
      "GET /v2/providers/affiliate_open_api/apis/openapi/products/bestcategories/{categoryId}",
      "GET /v2/providers/affiliate_open_api/apis/openapi/products/goldbox",
      "POST /v2/providers/affiliate_open_api/apis/openapi/v1/deeplink",
    ],
    capabilities: [
      {
        item: "키워드 검색",
        status: "가능",
        officialData: "상품 검색 endpoint로 keyword 기반 상품 후보를 받을 수 있는 구조입니다.",
        viniminiDecision: "오늘의 여성패션 TOP10 후보 수집 1차 소스로 사용합니다.",
      },
      {
        item: "여성패션 카테고리 조회",
        status: "대체 필요",
        officialData: "베스트 카테고리 endpoint는 categoryId 기반 검증이 필요합니다.",
        viniminiDecision: "여성패션 categoryId를 확정하고, 부족하면 키워드 풀로 보완합니다.",
      },
      {
        item: "상품명",
        status: "가능",
        officialData: "상품 검색 응답의 상품명 필드로 처리 가능합니다.",
        viniminiDecision: "Opportunity Card의 productName source로 사용합니다.",
      },
      {
        item: "가격",
        status: "가능",
        officialData: "상품 가격 필드로 처리 가능합니다.",
        viniminiDecision: "가격대와 예상 마진 점수의 입력값으로 사용합니다.",
      },
      {
        item: "이미지",
        status: "가능",
        officialData: "상품 이미지 URL 필드로 처리 가능합니다.",
        viniminiDecision: "경쟁상품 썸네일과 썸네일 품질 비교 입력값으로 사용합니다.",
      },
      {
        item: "상품 URL",
        status: "가능",
        officialData: "파트너스 상품 URL 또는 deeplink로 처리 가능합니다.",
        viniminiDecision: "상품 상세 이동 URL로 사용하되 affiliate 표시 정책을 준수합니다.",
      },
      {
        item: "리뷰수",
        status: "불가능",
        officialData: "파트너스 상품 API의 핵심 공개 응답으로 확정하기 어렵습니다.",
        viniminiDecision: "리뷰 장벽 점수는 별도 합법 데이터 소스 또는 추후 API가 필요합니다.",
      },
      {
        item: "평점",
        status: "불가능",
        officialData: "파트너스 상품 API의 핵심 공개 응답으로 확정하기 어렵습니다.",
        viniminiDecision: "AI가 추측하지 않고 DEMO/대체 데이터로 명확히 분리합니다.",
      },
      {
        item: "베스트/랭킹 데이터",
        status: "대체 필요",
        officialData: "베스트 카테고리/goldbox 계열 endpoint 검증이 필요합니다.",
        viniminiDecision: "카테고리 랭킹은 보조 신호로 쓰고, 최종 TOP10은 VINIMINI 점수로 재정렬합니다.",
      },
    ],
  };
}
