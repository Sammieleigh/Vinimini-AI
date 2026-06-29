export type AdapterStatus = "LIVE DATA" | "PARTIAL DATA" | "SOURCE LIMITED" | "API NOT CONNECTED" | "DISABLED";

export type AdapterResult<T> = {
  source: string;
  status: AdapterStatus;
  keyword: string;
  message: string;
  data: T;
  fetchedAt: string | null;
};

export type PartnerProduct = {
  productName: string;
  price: string;
  image: string;
  productUrl: string;
  category: string;
  brand: string;
};

export type DataLabTrend = {
  keyword: string;
  trendPoints: Array<{ period: string; ratio: number }>;
  growthRate: number;
  seasonality: string;
};

export type SearchAdKeyword = {
  keyword: string;
  totalMonthlySearchVolume: number;
  pcMonthlySearchVolume: number;
  mobileMonthlySearchVolume: number;
  mobileSearchRatio: number | null;
  pcSearchRatio: number | null;
  competitionLevel: string;
  relatedKeywords: string[];
};

export type GoogleTrendSignal = {
  keyword: string;
  trendScore: number | null;
  rising: boolean;
};
