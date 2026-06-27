import { createDailyCoupangBriefing, dataEngineSources, scoreEngineSignals } from "./viniminiDataEngine";

const dailyBriefing = createDailyCoupangBriefing();

export const dailyBriefingStatus = {
  label: dailyBriefing.dataFreshness,
  detail: "쿠팡 파트너스, 네이버 데이터랩, 검색광고, Google Trends가 연결되기 전까지는 데모 브리핑입니다.",
};

export const dailyAutoBriefing = {
  risingKeywords: dailyBriefing.risingKeywords,
  recommendedProducts: dailyBriefing.opportunityTop10.slice(0, 4).map((item) => item.productName),
  crowdedProducts: dailyBriefing.crowdedProducts,
  firstToLaunch: dailyBriefing.oneBigProduct.productName,
};

export { dataEngineSources, scoreEngineSignals };
