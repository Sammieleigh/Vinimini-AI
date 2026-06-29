export type TaskStatus = "Todo" | "In Progress" | "Done";
export type Priority = "High" | "Medium" | "Low";
export type RiskLevel = "Low" | "Medium" | "High";
export type ExecutiveStatus = "Ready" | "Warning" | "Critical";

export type CeoTask = {
  title: string;
  priority: Priority;
  estimatedTime: string;
  businessImpact: string;
  status: TaskStatus;
};

export type ExecutiveMember = {
  role: string;
  status: ExecutiveStatus;
  briefing: string;
};

export type ViniminiConcept = {
  name: "A" | "B" | "C";
  thumbnailDirection: string;
  expectedCtr: string;
  reason: string;
  purpose: "Click Rate" | "Conversion" | "Brand Trust" | "클릭률" | "구매전환" | "브랜드 강화";
};

export type CoupangOpportunity = {
  id: string;
  thumbnail: string;
  productName: string;
  category: string;
  price: string;
  reviewCount: string;
  rating: string;
  productUrl: string;
  sellerName?: string;
  isRocket?: boolean;
  isRocketGrowth?: boolean;
  isAd?: boolean;
  dataSource?: "mock" | "coupang";
  opportunityScore: number;
  highProfit: string;
  lowCompetition: string;
  whyNow: string;
  strongBuy: boolean;
  competitorCount: number;
  expectedMargin: string;
  entryDifficulty: string;
  recommendedPrice: string;
  reviewComplaints: string[];
  reasons: string[];
  expectedResult: {
    ctr: string;
    conversion: string;
    margin: string;
    dailySales: string;
    returnRate: string;
    scoreChange: string;
  };
  risk: {
    level: RiskLevel;
    reasons: string[];
  };
  confidence: {
    percent: number;
    evidence: string[];
  };
  competitiveAdvantages: string[];
  actionPlan: string[];
  planningActions: {
    thumbnail: string;
    detailPage: string;
    copy: string;
    sizeChart: string;
    newImage: string;
    returnReduction: string;
  };
  viniminiConcepts: ViniminiConcept[];
  recommendation: string;
  learningNote: string;
};

export type CoupangSearchProduct = {
  id: string;
  productName: string;
  price: string;
  reviewCount: string;
  rating: string;
  thumbnail: string;
  productUrl: string;
  sellerName: string;
  category: string;
  isRocket: boolean;
  isRocketGrowth: boolean;
  isAd: boolean;
  opportunityScore: number;
  estimatedMargin: string;
  competitionLevel: string;
  reviewStrength: string;
  entryDifficulty: string;
  recommendation: string;
};
