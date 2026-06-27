import Image from "next/image";
import type { CoupangOpportunity } from "@/lib/types";
import { SectionCard } from "@/components/ui/SectionCard";

export function CompetitorAnalysis({ product }: { product: CoupangOpportunity }) {
  return (
    <SectionCard eyebrow="경쟁상품 분석" title="상위 경쟁상품">
      <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-sm bg-[#E5DED5]">
        <Image src={product.thumbnail} alt={product.productName} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#6F6A63]">
        <p>가격: {product.price}</p>
        <p>리뷰: {product.reviewCount}</p>
        <p>평점: {product.rating}</p>
        <p>경쟁상품: {product.competitorCount}개</p>
      </div>
      <a className="mt-4 inline-flex border-b border-[#111111] text-sm font-medium text-[#111111]" href={product.productUrl} target="_blank" rel="noreferrer">
        쿠팡 상세페이지 보기
      </a>
    </SectionCard>
  );
}
