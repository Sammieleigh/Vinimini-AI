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
    title: "오늘 AI 경영진 브리핑 검토",
    priority: "High",
    estimatedTime: "15분",
    businessImpact: "대표 의사결정 품질 향상",
    status: "Todo",
  },
  {
    title: "첫 번째 기회 실행안 승인",
    priority: "High",
    estimatedTime: "20분",
    businessImpact: "상품기획 실행 속도 향상",
    status: "Todo",
  },
  {
    title: "출처 제한 항목 확인",
    priority: "Medium",
    estimatedTime: "25분",
    businessImpact: "실행 리스크 감소",
    status: "In Progress",
  },
];

export const executiveTeam: ExecutiveMember[] = [
  {
    role: "CEO 비서 AI",
    status: "Ready",
    briefing: "경영진 요약이 준비되었습니다. 대표님은 검색하지 않고 결정만 하시면 됩니다.",
  },
  {
    role: "마켓 디렉터 AI",
    status: "Ready",
    briefing: "AI 자동 탐색이 여성패션 후보군을 검토하고 오늘의 기회를 정렬했습니다.",
  },
  {
    role: "재무 디렉터 AI",
    status: "Warning",
    briefing: "OpenAI 분석은 비용 보호를 위해 배치 요청과 캐시 재사용을 우선합니다.",
  },
];

export const opportunities: CoupangOpportunity[] = [
  createProduct("wide-slacks", 0, "여름 와이드 슬랙스", "팬츠", "39,900원", "2,431개", "4.6", 96, "높음", "보통"),
  createProduct("linen-setup", 1, "린넨 반팔 셋업", "셋업", "49,800원", "1,184개", "4.5", 92, "높음", "낮음"),
  createProduct("long-skirt", 2, "체형 커버 롱스커트", "스커트", "34,900원", "3,028개", "4.7", 89, "보통", "낮음"),
  createProduct("cool-knit", 3, "냉감 니트 반팔", "상의", "24,900원", "5,812개", "4.6", 88, "보통", "보통"),
  createProduct("shirt-dress", 4, "여름 셔츠 원피스", "원피스", "42,900원", "1,902개", "4.5", 87, "높음", "보통"),
  createProduct("banding-pants", 0, "데일리 밴딩 팬츠", "팬츠", "29,900원", "4,210개", "4.4", 86, "보통", "낮음"),
  createProduct("crop-cardigan", 1, "라이트 크롭 가디건", "아우터", "27,900원", "2,784개", "4.6", 85, "보통", "보통"),
  createProduct("sleeveless-blouse", 2, "오피스 민소매 블라우스", "상의", "23,900원", "1,642개", "4.5", 84, "높음", "보통"),
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
  const isStrongBuy = opportunityScore >= 88;

  return {
    id,
    thumbnail: imagePool[imageIndex],
    productName,
    category,
    price,
    reviewCount,
    rating,
    productUrl: "https://www.coupang.com/",
    dataSource: "mock",
    opportunityScore,
    highProfit,
    lowCompetition,
    whyNow:
      "네이버 데이터랩과 연결된 시장 데이터로 실행 전 신호를 확인해야 합니다. 실시간 시장 데이터가 연결되기 전까지는 출처 제한 근거로만 기획합니다.",
    strongBuy: isStrongBuy,
    competitorCount: 128 - imageIndex * 9,
    expectedMargin: highProfit === "높음" ? "34%" : "28%",
    entryDifficulty: lowCompetition === "낮음" ? "낮음" : "보통",
    recommendedPrice: price,
    reviewComplaints: [
      "핏과 기장에 대한 불확실성",
      "원단 두께 정보 부족",
      "비침 우려",
      "실측표와 사이즈 안내 부족",
      "배송 후 구김과 포장 불만",
    ],
    reasons: [
      "계절 수요가 빠르게 상승할 수 있음",
      "상세페이지로 구매 불안을 줄일 수 있음",
      "썸네일 차별화 여지가 있음",
      "마진 구조를 검토할 가치가 있음",
    ],
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
      reasons: [
        "쿠팡 시장 전체 랭킹 데이터가 아직 완전히 연결되지 않았습니다.",
        "리뷰와 반품 원인은 실행 전 검증된 출처 데이터가 더 필요합니다.",
      ],
    },
    confidence: {
      percent: Math.min(97, opportunityScore + 1),
      evidence: [
        "최종 매입 전 네이버 데이터랩 트렌드 확인이 필요합니다.",
        "OpenAI는 연결된 근거를 분석할 수 있지만 상품 사실을 만들어내면 안 됩니다.",
        "쿠팡윙 운영 데이터는 판매자 보유 정보 중심으로 제한됩니다.",
      ],
    },
    competitiveAdvantages: [
      "명확한 핏 안내",
      "체형 커버 스타일링",
      "원단 클로즈업",
      "반품 예방 문구",
      "첫 화면 신뢰 구조",
    ],
    actionPlan: [
      "썸네일 테스트 방향 승인",
      "상세페이지 첫 화면 재작성",
      "사이즈와 원단 근거 추가",
      "광고 진입 예산 확인",
      "검증된 경쟁 데이터 요청",
    ],
    planningActions: {
      thumbnail: "모델 착용 핏과 원단 클로즈업을 함께 보여주세요. 구매자가 상세페이지를 읽기 전 핏을 이해해야 합니다.",
      detailPage: "핏, 원단, 비침 여부, 사용 상황 근거로 시작하세요. 결정에 필요한 근거를 첫 화면에 배치합니다.",
      copy: "일반적인 패션 문구보다 구매자의 아침 사용 상황에서 시작하세요.",
      sizeChart: "상세페이지 상단 1/3 안에 실측표와 모델 스펙을 배치하세요.",
      newImage: "전신 착용, 앉은 자세, 원단 클로즈업, 비교 이미지를 준비하세요.",
      returnReduction: "구매 결정 지점 근처에 핏, 기장, 비침 정보를 반복 노출하세요.",
    },
    viniminiConcepts: [
      {
        name: "A",
        thumbnailDirection: "전신 핏 + 원단 정보 강조",
        expectedCtr: "7.8%",
        reason: "쿠팡 리스트에서 핏 불안을 가장 빠르게 줄일 수 있습니다.",
        purpose: "클릭률",
      },
      {
        name: "B",
        thumbnailDirection: "원단 클로즈업 + 비침 우려 해소",
        expectedCtr: "6.9%",
        reason: "리뷰 불만을 구매 확신 요소로 바꿀 수 있습니다.",
        purpose: "구매전환",
      },
      {
        name: "C",
        thumbnailDirection: "프리미엄 데일리 착장 스타일링",
        expectedCtr: "6.2%",
        reason: "가격 경쟁이 아니라 브랜드 신뢰를 높이는 방향입니다.",
        purpose: "브랜드 강화",
      },
    ],
    recommendation: isStrongBuy
      ? "상품기획을 진행하세요. 다만 검증된 시장 데이터가 확인되기 전까지는 출처 제한 상태를 유지해야 합니다."
      : "추가 검토가 필요합니다. 재고나 광고비를 집행하기 전 더 강한 출처 데이터가 필요합니다.",
    learningNote:
      "AI 경영진은 검색 수요만 보지 않고 광고 난이도, 리뷰 리스크, 크리에이티브 개선 가능성을 함께 반영해야 합니다.",
  };
}
