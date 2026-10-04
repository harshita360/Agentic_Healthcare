import { NextResponse } from "next/server";
import { standardizeCareAddress } from "@/rails/delhivery/location";
export const runtime = "nodejs";
export async function POST(request: Request) { const body = await request.json().catch(() => null) as { address?: unknown } | null; if (!body || typeof body.address !== "string" || !body.address.trim()) return NextResponse.json({ error: "Enter an address to standardize." }, { status: 400 }); try { return NextResponse.json(await standardizeCareAddress(body.address.trim())); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to process this address." }, { status: 502 }); } }
