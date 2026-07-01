import { PlanningRoom } from "@/components/planning/PlanningRoom";
import { getOpportunity, opportunities } from "@/lib/data";

export function generateStaticParams() {
  return opportunities.map((item) => ({ id: item.id }));
}

export default async function PlanningPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams ?? Promise.resolve<{ tab?: string }>({})]);
  const product = getOpportunity(id);

  return <PlanningRoom product={product} initialTab={resolvedSearchParams.tab} />;
}
