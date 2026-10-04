import { NextResponse } from "next/server";
import { rankSuitableLabs } from "@/rails/delhivery/location";
import type { CareAddress } from "@/lib/types";
export const runtime = "nodejs";
export async function POST(request: Request) { const body = await request.json().catch(() => null) as { address?: CareAddress; labAddresses?: string[] } | null; if (!body?.address?.location) return NextResponse.json({ error: "Confirm a complete care address first." }, { status: 400 }); try { return NextResponse.json(await rankSuitableLabs(body.address, body.labAddresses ?? [])); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to verify supplied labs." }, { status: 400 }); } }
