import type { CeoTask, CoupangOpportunity, ExecutiveMember } from "./types";

const imagePool = [
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",
];

export const ceoTasks: CeoTask[] = [
  {
    title: "와이드 슬랙스 상세페이지 개선",
    priority: "High",
    estimatedTime: "40분",
    businessImpact: "구매전환율 증가",
    status: "Todo",
  },
  {
    title: "AI 썸네일 A/B 테스트 생성",
    priority: "High",
    estimatedTime: "20분",
    businessImpact: "클릭률 증가",
    status: "Todo",
  },
  {
    title: "경쟁상품 리뷰 불만 분석",
    priority: "Medium",
    estimatedTime: "30분",
    businessImpact: "반품률 감소",
    status: "In Progress",
  },
  {
    title: "광고 입찰가 확인",
    priority: "Medium",
    estimatedTime: "15분",
    businessImpact: "마진 보호",
    status: "Todo",
  },
  {
    title: "이번 주 신규 상품 아이디어 검토",
    priority: "Low",
    estimatedTime: "25분",
    businessImpact: "다음 상품 파이프라인 확보",
    status: "Todo",
  },
];

export const executiveTeam: ExecutiveMember[] = [
  {
    role: "AI CEO Advisor",
    status: "Ready",
    briefing: "오늘은 신규 탐색보다 전환율을 올리는 한 가지 업무에 집중하세요.",
  },
  {
    role: "AI Product Manager",
    status: "Ready",
    briefing: "와이드 슬랙스는 리뷰 불만을 상품 장점으로 바꾸기 좋은 기회입니다.",
  },
  {
    role: "AI Marketing Director",
    status: "Warning",
    briefing: "광고비 증액 전 썸네일 A/B 테스트를 먼저 생성하세요.",
  },
  {
    role: "AI Creative Director",
    status: "Ready",
    briefing: "첫 화면에서 핏, 원단, 실측표가 즉시 보여야 합니다.",
  },
  {
    role: "AI Data Analyst",
    status: "Ready",
    briefing: "리뷰 불만은 허리, 기장, 원단 두께에 집중되어 있습니다.",
  },
  {
    role: "AI Finance Director",
    status: "Ready",
    briefing: "초기 광고 일예산은 30,000원 이내로 검증하는 것이 적절합니다.",
  },
  {
    role: "AI Risk Manager",
    status: "Warning",
    briefing: "허리와 기장 불만을 상세페이지에서 선제적으로 줄여야 합니다.",
  },
];

export const opportunities: CoupangOpportunity[] = [
  createProduct("wide-slacks", 0, "여름 와이드 밴딩 슬랙스", "팬츠", "39,900원", "2,431개", "4.6", 96, "높음", "보통"),
  createProduct("linen-setup", 1, "린넨 반팔 셋업", "셋업", "49,800원", "1,184개", "4.5", 92, "높음", "낮음"),
  createProduct("long-skirt", 2, "체형 커버 롱 스커트", "스커트", "34,900원", "3,028개", "4.7", 89, "보통", "낮음"),
  createProduct("cool-knit", 3, "쿨링 니트 반팔", "상의", "24,900원", "5,812개", "4.6", 88, "보통", "보통"),
  createProduct("shirt-dress", 4, "여름 셔츠 원피스", "원피스", "42,900원", "1,902개", "4.5", 87, "높음", "보통"),
  createProduct("banding-pants", 0, "바스락 밴딩 팬츠", "팬츠", "29,900원", "4,210개", "4.4", 86, "보통", "낮음"),
  createProduct("crop-cardigan", 1, "데일리 크롭 가디건", "아우터", "27,900원", "2,784개", "4.6", 85, "보통", "보통"),
  createProduct("sleeveless-blouse", 2, "출근룩 민소매 블라우스", "상의", "23,900원", "1,642개", "4.5", 84, "높음", "보통"),
  createProduct("seersucker-shorts", 3, "시어서커 반바지", "팬츠", "22,900원", "1,088개", "4.3", 83, "보통", "낮음"),
  createProduct("cool-inner", 4, "냉감 이너 티셔츠", "상의", "18,900원", "7,342개", "4.7", 82, "보통", "보통"),
];

export function getOpportunity(id: string) {
  return opportunities.find((item) => item.id === id) ?? opportunities[0];
}

function createProduct(
  id: string,
  imageIndex: number,
  productName: string,
  category: string,
  price: string,
  reviewCount: string,
  rating: string,
  opportunityScore: number,
  highProfit: string,
  lowCompetition: string,
): CoupangOpportunity {
  return {
    id,
    thumbnail: imagePool[imageIndex],
    productName,
    category,
    price,
    reviewCount,
    rating,
    productUrl: "https://www.coupang.com/",
    opportunityScore,
    highProfit,
    lowCompetition,
    whyNow: "이번 주 여성패션 검색 수요가 오르지만 상위 경쟁상품의 썸네일, 실측, 리뷰 대응 품질이 아직 약합니다.",
    strongBuy: opportunityScore >= 88,
    competitorCount: 128 - imageIndex * 9,
    expectedMargin: highProfit === "높음" ? "34%" : "28%",
    entryDifficulty: lowCompetition === "낮음" ? "쉬움" : "보통",
    recommendedPrice: price,
    reviewComplaints: ["허리가 크게 느껴짐", "기장이 예상보다 김", "원단이 얇아 비침 걱정", "상세 실측표가 부족함", "배송 후 구김이 있음"],
    reasons: ["검색량 상승", "마진 확보 가능", "리뷰 불만 해결 가능", "썸네일 품질 개선 여지"],
    expectedResult: {
      ctr: "+18%",
      conversion: "+12%",
      margin: highProfit === "높음" ? "34%" : "28%",
      dailySales: "18개",
      returnRate: "-15%",
      scoreChange: "+9",
    },
    risk: {
      level: lowCompetition === "낮음" ? "Low" : "Medium",
      reasons: ["가격 경쟁이 빠르게 강해질 수 있습니다.", "원단 설명이 부족하면 반품률이 높아질 수 있습니다."],
    },
    confidence: {
      percent: Math.min(97, opportunityScore + 1),
      evidence: ["리뷰 불만 패턴이 명확합니다.", "여름 시즌 검색 수요가 유지되고 있습니다.", "가격대별 경쟁 밀도가 낮습니다."],
    },
    competitiveAdvantages: ["기장 비교 이미지", "체형 커버 강조", "허리 밴딩 확대 컷", "원단 클로즈업", "반품 예방 문구"],
    actionPlan: ["새 썸네일 생성", "상세페이지 첫 화면 수정", "실측표 추가", "쿠팡 등록", "광고 시작", "3일 후 리뷰 분석"],
    planningActions: {
      thumbnail: "모델 착장 1장과 원단 클로즈업 1장을 분할해 핏과 소재를 동시에 보여줍니다.",
      detailPage: "첫 화면에는 여름 착용 상황, 핏 장점, 비침 방지 정보를 3초 안에 읽히게 배치합니다.",
      copy: "출근부터 휴가까지 하루 종일 시원한 핏이라는 문구로 사용 장면을 좁힙니다.",
      sizeChart: "상세페이지 첫 30% 지점에 실측표와 모델 사이즈를 고정합니다.",
      newImage: "밝은 배경의 전신 착장, 앉은 자세 핏, 원단 투과도 비교 이미지를 새로 생성합니다.",
      returnReduction: "허리, 총장, 비침 정보를 썸네일 하단과 상세 첫 화면에 반복 노출합니다.",
    },
    viniminiConcepts: [
      {
        name: "A",
        thumbnailDirection: "밝은 배경 전신 착장 + 핏 강조",
        expectedCtr: "7.8%",
        reason: "쿠팡 리스트에서 상품 형태와 핏을 가장 빠르게 이해시킵니다.",
        purpose: "클릭률",
      },
      {
        name: "B",
        thumbnailDirection: "원단 클로즈업 + 비침 걱정 해소",
        expectedCtr: "6.9%",
        reason: "리뷰 불만을 선제적으로 해결해 상세페이지 이탈을 낮춥니다.",
        purpose: "구매전환",
      },
      {
        name: "C",
        thumbnailDirection: "차분한 톤의 브랜드형 룩북 컷",
        expectedCtr: "6.2%",
        reason: "저가 상품처럼 보이지 않게 만들어 장기 브랜드 신뢰를 쌓습니다.",
        purpose: "브랜드 강화",
      },
    ],
    recommendation:
      "지금 진입을 권장합니다. 우선 썸네일 A안, 상세페이지 B안, 광고 일예산 30,000원 전략으로 시작하세요.",
    learningNote:
      "상위 상품은 리뷰는 많지만 실측 안내가 약했습니다. VINIMINI는 실측표를 상세페이지 첫 30% 지점에 고정하는 전략을 유지합니다.",
  };
}
