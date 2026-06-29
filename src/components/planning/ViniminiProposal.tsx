import type { CoupangOpportunity } from "@/lib/types";
import { ThumbnailProposal } from "./ThumbnailProposal";

export function ViniminiProposal({ product }: { product: CoupangOpportunity }) {
  return <ThumbnailProposal product={product} />;
}
