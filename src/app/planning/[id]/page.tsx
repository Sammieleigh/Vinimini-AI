import { PlanningRoom } from "@/components/planning/PlanningRoom";
import { getOpportunity, opportunities } from "@/lib/data";

export function generateStaticParams() {
  return opportunities.map((item) => ({ id: item.id }));
}

export default async function PlanningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getOpportunity(id);

  return <PlanningRoom product={product} />;
}
