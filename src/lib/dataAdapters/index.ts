import { fetchCoupangPartnersProducts } from "./coupangPartnersAdapter";
import { fetchGoogleTrendSignal } from "./googleTrendsAdapter";
import { fetchNaverDataLabTrend } from "./naverDataLabAdapter";
import { fetchNaverSearchAdKeywords } from "./naverSearchAdAdapter";

export async function fetchViniminiMarketSignals(keyword: string) {
  const [coupangPartners, naverDataLab, naverSearchAd, googleTrends] = await Promise.all([
    fetchCoupangPartnersProducts(keyword),
    fetchNaverDataLabTrend(keyword),
    fetchNaverSearchAdKeywords(keyword),
    fetchGoogleTrendSignal(keyword),
  ]);

  return {
    keyword,
    adapters: {
      coupangPartners,
      naverDataLab,
      naverSearchAd,
      googleTrends,
    },
  };
}
