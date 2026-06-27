import { NextResponse } from "next/server";
import { getCoupangPartnersCapabilityReport } from "@/lib/coupangPartners";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getCoupangPartnersCapabilityReport());
}
