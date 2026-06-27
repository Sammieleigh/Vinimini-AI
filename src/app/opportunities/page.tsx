import { OpportunityCenter } from "@/components/opportunities/OpportunityCenter";
import { opportunities } from "@/lib/data";

export default function OpportunitiesPage() {
  return <OpportunityCenter products={opportunities} />;
}
