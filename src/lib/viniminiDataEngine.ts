import { opportunities } from "./data";
import type { CoupangOpportunity } from "./types";

export type DataFreshness = "LIVE DATA" | "PARTIAL DATA" | "SOURCE LIMITED" | "API NOT CONNECTED" | "DISABLED";

export type DataEngineSource = {
  name: string;
  status: DataFreshness;
  role: string;
  provides: string[];
};

export type DailyOpportunityItem = {
  id: string;
  rank: number;
  productName: string;
  category: string;
  price: string;
  opportunityScore: number;
  entryDifficulty: string;
  expectedMargin: string;
  strongBuy: boolean;
  whyNow: string;
};

export type DailyCoupangBriefing = {
  date: string;
  dataFreshness: DataFreshness;
  cacheTtlHours: number;
  forceRefreshOnly: boolean;
  oneBigProduct: DailyOpportunityItem;
  opportunityTop10: DailyOpportunityItem[];
  lowCompetitionTop10: DailyOpportunityItem[];
  highMarginTop10: DailyOpportunityItem[];
  fastGrowthTop10: DailyOpportunityItem[];
  reviewImprovementTop10: DailyOpportunityItem[];
  risingKeywords: string[];
  crowdedProducts: string[];
  executiveSummary: string;
  dataSources: DataEngineSource[];
  scoreSignals: string[];
};

export const DATA_ENGINE_CACHE_TTL_HOURS = 24;

export const dataEngineSources: DataEngineSource[] = [
  {
    name: "쿠팡 파트너스 API",
    status: "API NOT CONNECTED",
    role: "상품 후보 수집",
    provides: ["상품명", "가격", "이미지", "상품 URL", "브랜드 후보", "카테고리 후보"],
  },
  {
    name: "네이버 데이터랩",
    status: "SOURCE LIMITED",
    role: "검색 수요와 시즌성 확인",
    provides: ["검색 흐름", "시즌성", "성장률"],
  },
  {
    name: "네이버 검색광고 키워드 도구",
    status: "API NOT CONNECTED",
    role: "검색 규모와 경쟁도 확인",
    provides: ["월간 검색량", "경쟁도", "연관 키워드"],
  },
  {
    name: "Google Trends",
    status: "DISABLED",
    role: "트렌드 방향 교차 확인",
    provides: ["검색 추세", "급상승 키워드"],
  },
  {
    name: "VINIMINI AI Score Engine",
    status: "SOURCE LIMITED",
    role: "CEO 의사결정 점수 계산",
    provides: ["기회 점수", "진입 난이도", "예상 마진", "적극 추천", "신규 셀러 성공 확률"],
  },
];

export const scoreEngineSignals = [
  "기회 점수",
  "진입 난이도",
  "예상 마진",
  "적극 추천",
  "검색 성장률",
  "시장 경쟁도",
  "리뷰 장벽",
  "상세페이지 개선 가능성",
  "썸네일 개선 가능성",
  "광고 효율",
  "신규 셀러 성공 확률",
];

export function createDailyCoupangBriefing(
  products: CoupangOpportunity[] = opportunities,
  sources: DataEngineSource[] = dataEngineSources,
): DailyCoupangBriefing {
  const opportunityTop10 = toRankedItems([...products].sort((a, b) => b.opportunityScore - a.opportunityScore));
  const lowCompetitionTop10 = toRankedItems([...products].sort((a, b) => a.lowCompetition.localeCompare(b.lowCompetition) || b.opportunityScore - a.opportunityScore));
  const highMarginTop10 = toRankedItems([...products].sort((a, b) => b.expectedMargin.localeCompare(a.expectedMargin) || b.opportunityScore - a.opportunityScore));
  const fastGrowthTop10 = toRankedItems([...products].sort((a, b) => b.confidence.percent - a.confidence.percent || b.opportunityScore - a.opportunityScore));
  const reviewImprovementTop10 = toRankedItems([...products].sort((a, b) => b.reviewComplaints.length - a.reviewComplaints.length || b.opportunityScore - a.opportunityScore));
  const oneBigProduct = opportunityTop10[0];

  return {
    date: getKoreanDateLabel(),
    dataFreshness: getOverallDataFreshness(sources),
    cacheTtlHours: DATA_ENGINE_CACHE_TTL_HOURS,
    forceRefreshOnly: true,
    oneBigProduct,
    opportunityTop10,
    lowCompetitionTop10,
    highMarginTop10,
    fastGrowthTop10,
    reviewImprovementTop10,
    risingKeywords: ["냉감 티셔츠", "린넨 셋업", "밴딩 팬츠", "체형커버 스커트", "여름 원피스"],
    crowdedProducts: ["냉감 이너 티셔츠", "쿨링 니트 반팔"],
    executiveSummary: `${oneBigProduct.productName}은 오늘 가장 먼저 검토할 쿠팡 여성패션 후보입니다. 현재는 출처 제한 상태이며, 실제 데이터 연결 후 점수를 재계산해야 합니다.`,
    dataSources: sources,
    scoreSignals: scoreEngineSignals,
  };
}

function getOverallDataFreshness(sources: DataEngineSource[]): DataFreshness {
  const liveCount = sources.filter((source) => source.status === "LIVE DATA").length;
  if (liveCount >= 3) return "LIVE DATA";
  if (liveCount > 0) return "PARTIAL DATA";
  return "SOURCE LIMITED";
}

function toRankedItems(products: CoupangOpportunity[]): DailyOpportunityItem[] {
  return products.slice(0, 10).map((product, index) => ({
    id: product.id,
    rank: index + 1,
    productName: product.productName,
    category: product.category,
    price: product.price,
    opportunityScore: product.opportunityScore,
    entryDifficulty: product.entryDifficulty,
    expectedMargin: product.expectedMargin,
    strongBuy: product.strongBuy,
    whyNow: product.whyNow,
  }));
}

function getKoreanDateLabel() {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}
