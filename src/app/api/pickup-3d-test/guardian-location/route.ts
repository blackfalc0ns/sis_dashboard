import { NextResponse } from "next/server";
import { getGuardianLiveLocationSnapshot } from "@/features/pickup-3d-test/mockGuardianLocation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getGuardianLiveLocationSnapshot(), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
