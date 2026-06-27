import type { CoupangOpportunity } from "@/lib/types";
import { SectionCard } from "@/components/ui/SectionCard";

export function MeetingHistory({ product }: { product: CoupangOpportunity }) {
  return (
    <SectionCard eyebrow="Meeting History" title="회의 기록">
      <p className="mt-5 text-sm leading-6 text-[#6F6A63]">2026년 6월 27일 · {product.productName} 회의 결과</p>
      <p className="mt-4 text-sm leading-6 text-[#6F6A63]">{product.recommendation}</p>
    </SectionCard>
  );
}
