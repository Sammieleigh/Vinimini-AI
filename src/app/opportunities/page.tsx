import { OpportunityCenter } from "@/components/opportunities/OpportunityCenter";
import { createDataEngineSources, getAdapterEnvironmentStatus } from "@/lib/dataAdapters/config";
import { opportunities } from "@/lib/data";

export default function OpportunitiesPage() {
  return <OpportunityCenter products={opportunities} dataSources={createDataEngineSources(getAdapterEnvironmentStatus())} />;
}
