import type { CoupangOpportunity } from "@/lib/types";
import { SectionHeading, SourceLimitedNotice } from "./PlanningPrimitives";

export function CompetitorAnalysis({ product }: { product: CoupangOpportunity }) {
  const competitors = [
    {
      name: `${product.category} 상위 노출 경쟁상품`,
      price: product.price,
      reviews: product.reviewCount,
      rating: product.rating,
      strength: product.lowCompetition,
      difference: product.competitiveAdvantages[0],
    },
    {
      name: `${product.category} 가격 경쟁상품`,
      price: product.recommendedPrice,
      reviews: "출처 제한",
      rating: "출처 제한",
      strength: "추가 데이터 필요",
      difference: product.competitiveAdvantages[1],
    },
    {
      name: `${product.category} 리뷰 강점 경쟁상품`,
      price: "추가 데이터 필요",
      reviews: "추가 데이터 필요",
      rating: "추가 데이터 필요",
      strength: "출처 제한",
      difference: product.competitiveAdvantages[2],
    },
  ];

  return (
    <div>
      <SectionHeading eyebrow="마켓 디렉터 AI" title="경쟁사 분석" text="검증된 출처 데이터가 연결되기 전까지 경쟁 데이터는 보수적으로 표시합니다." />
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#D9D0C4] text-xs uppercase tracking-[0.16em] text-[#8A8277]">
              <th className="py-3 pr-4">경쟁상품</th>
              <th className="py-3 pr-4">가격</th>
              <th className="py-3 pr-4">리뷰 수</th>
              <th className="py-3 pr-4">평점</th>
              <th className="py-3 pr-4">경쟁 강도</th>
              <th className="py-3">차별화 포인트</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((competitor) => (
              <tr key={competitor.name} className="border-b border-[#E5DED5] last:border-b-0">
                <td className="py-4 pr-4 font-semibold">{competitor.name}</td>
                <td className="py-4 pr-4">{competitor.price}</td>
                <td className="py-4 pr-4">{competitor.reviews}</td>
                <td className="py-4 pr-4">{competitor.rating}</td>
                <td className="py-4 pr-4">{competitor.strength}</td>
                <td className="py-4 leading-6 text-[#625B53]">{competitor.difference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5">
        <SourceLimitedNotice />
      </div>
    </div>
  );
}
