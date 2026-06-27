import type { CoupangOpportunity } from "@/lib/types";
import { SectionCard } from "@/components/ui/SectionCard";

export function LearningNote({ product }: { product: CoupangOpportunity }) {
  return (
    <SectionCard eyebrow="Learning Note" title="AI 학습 노트">
      <p className="mt-5 text-sm leading-7 text-[#6F6A63]">{product.learningNote}</p>
    </SectionCard>
  );
}
