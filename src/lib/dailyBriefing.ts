import { createDailyCoupangBriefing, dataEngineSources, scoreEngineSignals } from "./viniminiDataEngine";

const dailyBriefing = createDailyCoupangBriefing();

export const dailyBriefingStatus = {
  label: dailyBriefing.dataFreshness,
  detail: "쿠팡, 네이버 데이터랩, 네이버 검색광고, Google Trends가 완전히 연결되기 전까지는 출처 제한 브리핑입니다.",
};

export const dailyAutoBriefing = {
  risingKeywords: dailyBriefing.risingKeywords,
  recommendedProducts: dailyBriefing.opportunityTop10.slice(0, 4).map((item) => item.productName),
  crowdedProducts: dailyBriefing.crowdedProducts,
  firstToLaunch: dailyBriefing.oneBigProduct.productName,
};

export { dataEngineSources, scoreEngineSignals };
