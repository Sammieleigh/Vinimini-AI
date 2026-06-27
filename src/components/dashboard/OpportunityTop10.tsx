import Link from "next/link";
import { opportunities } from "@/lib/data";
import { SectionCard } from "@/components/ui/SectionCard";

export function OpportunityTop10() {
  return (
    <SectionCard eyebrow="Opportunity Center" title="오늘의 기회 상품 TOP10">
      <div className="mt-5 grid gap-3">
        {opportunities.slice(0, 5).map((item, index) => (
          <Link
            href={`/planning/${item.id}`}
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-sm border border-[#E5DED5] p-4 transition hover:border-[#111111]"
          >
            <span className="flex items-center gap-4">
              <span className="text-sm text-[#6F6A63]">{String(index + 1).padStart(2, "0")}</span>
              <span className="font-medium">{item.productName}</span>
            </span>
            <span className="text-sm font-semibold">{item.opportunityScore}</span>
          </Link>
        ))}
      </div>
      <Link
        href="/opportunities"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-sm border border-[#111111] px-5 text-sm font-semibold text-[#111111]"
      >
        기회 상품 센터로 이동
      </Link>
    </SectionCard>
  );
}
