import { fetchCoupangPartnersProducts } from "./coupangPartnersAdapter";
import { fetchGoogleTrendSignal } from "./googleTrendsAdapter";
import { fetchNaverDataLabTrend } from "./naverDataLabAdapter";
import { fetchNaverSearchAdKeywords } from "./naverSearchAdAdapter";
import { fetchNaverShoppingProducts } from "./naverShoppingSearchAdapter";

export async function fetchViniminiMarketSignals(keyword: string) {
  const [coupangPartners, naverDataLab, naverShoppingSearch, naverSearchAd, googleTrends] = await Promise.all([
    fetchCoupangPartnersProducts(keyword),
    fetchNaverDataLabTrend(keyword),
    fetchNaverShoppingProducts(keyword),
    fetchNaverSearchAdKeywords(keyword),
    fetchGoogleTrendSignal(keyword),
  ]);

  return {
    keyword,
    adapters: {
      coupangPartners,
      naverDataLab,
      naverShoppingSearch,
      naverSearchAd,
      googleTrends,
    },
  };
}
