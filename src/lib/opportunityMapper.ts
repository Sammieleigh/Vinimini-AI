import type { CoupangOpportunity, CoupangSearchProduct } from "./types";

export function mapCoupangProductToOpportunity(product: CoupangSearchProduct): CoupangOpportunity {
  const highProfit = product.estimatedMargin;
  const lowCompetition = product.competitionLevel === "낮음" ? "낮음" : product.competitionLevel === "보통" ? "보통" : "높음";

  return {
    id: product.id,
    thumbnail: product.thumbnail,
    productName: product.productName,
    category: product.category,
    price: product.price,
    reviewCount: product.reviewCount,
    rating: product.rating,
    productUrl: product.productUrl,
    sellerName: product.sellerName,
    isRocket: product.isRocket,
    isRocketGrowth: product.isRocketGrowth,
    isAd: product.isAd,
    dataSource: "coupang",
    opportunityScore: product.opportunityScore,
    highProfit,
    lowCompetition,
    whyNow: product.recommendation,
    strongBuy: product.opportunityScore >= 88 && product.competitionLevel !== "높음",
    competitorCount: 10,
    expectedMargin: product.estimatedMargin,
    entryDifficulty: product.entryDifficulty,
    recommendedPrice: product.price,
    reviewComplaints: ["리뷰 원문 연결 전", "사이즈 불만 추적 예정", "원단 불만 추적 예정", "배송 불만 추적 예정", "상세정보 부족 추적 예정"],
    reasons: [
      `추천도 ${product.opportunityScore}`,
      `경쟁 강도 ${product.competitionLevel}`,
      `리뷰 강도 ${product.reviewStrength}`,
    ],
    expectedResult: {
      ctr: "분석 예정",
      conversion: "분석 예정",
      margin: product.estimatedMargin,
      dailySales: "분석 예정",
      returnRate: "분석 예정",
      scoreChange: "분석 예정",
    },
    risk: {
      level: product.competitionLevel === "높음" ? "High" : product.competitionLevel === "보통" ? "Medium" : "Low",
      reasons: [
        product.isAd ? "광고 상품이 포함되어 경쟁비가 높을 수 있습니다." : "광고 상품 여부는 낮거나 확인되지 않았습니다.",
        product.reviewStrength === "강함" ? "리뷰가 많은 상위 상품과 직접 경쟁할 수 있습니다." : "리뷰 장벽은 아직 낮거나 보통입니다.",
      ],
    },
    confidence: {
      percent: Math.min(95, product.opportunityScore),
      evidence: ["쿠팡 검색 결과", "가격", "리뷰 수", "평점", "배송/광고 신호"],
    },
    competitiveAdvantages: ["썸네일 개선", "실측표 강화", "리뷰 불만 기반 상세페이지", "가격대 포지셔닝", "반품 예방 문구"],
    actionPlan: ["리뷰 불만 수집", "경쟁 썸네일 비교", "상세페이지 첫 화면 설계", "가격/마진 검토", "광고 테스트 준비"],
    planningActions: {
      thumbnail: "검색 결과에서 핏과 소재가 바로 보이도록 썸네일을 설계합니다.",
      detailPage: "가격, 배송, 실측 정보를 첫 화면에서 바로 확인하게 구성합니다.",
      copy: "리뷰 불만을 줄이는 문구를 상품명과 상세페이지에 반영합니다.",
      sizeChart: "상세페이지 상단 30% 지점에 실측표를 배치합니다.",
      newImage: "키별 착용 비교와 원단 클로즈업 이미지를 준비합니다.",
      returnReduction: "사이즈, 기장, 원단 두께 정보를 구매 전 반복 노출합니다.",
    },
    viniminiConcepts: [
      {
        name: "A",
        thumbnailDirection: "핏이 명확한 전신 착용 컷",
        expectedCtr: "분석 예정",
        reason: "상품 형태를 검색 결과에서 즉시 이해시킵니다.",
        purpose: "클릭률",
      },
      {
        name: "B",
        thumbnailDirection: "원단과 디테일 클로즈업 컷",
        expectedCtr: "분석 예정",
        reason: "리뷰 불만을 구매 전 신뢰 요소로 전환합니다.",
        purpose: "구매전환",
      },
      {
        name: "C",
        thumbnailDirection: "브랜드형 룩북 컷",
        expectedCtr: "분석 예정",
        reason: "저가 경쟁보다 브랜드 신뢰를 강조합니다.",
        purpose: "브랜드 강화",
      },
    ],
    recommendation: product.recommendation,
    learningNote: "실제 쿠팡 검색 데이터 기반 학습 노트는 리뷰 분석 연결 후 자동 생성됩니다.",
  };
}
