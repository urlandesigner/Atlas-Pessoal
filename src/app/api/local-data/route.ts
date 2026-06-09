import { NextResponse } from "next/server"
import { readAtlasStoragePayload, writeAtlasStoragePayload } from "@/lib/persistence/atlas-storage-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const payload = await readAtlasStoragePayload()
  return NextResponse.json(payload)
}

export async function POST(request: Request) {
  const body = (await request.json()) as { data?: unknown }

  if (!isRecord(body?.data)) {
    return NextResponse.json({ error: "Invalid atlas storage payload." }, { status: 400 })
  }

  const payload = await writeAtlasStoragePayload(body.data)
  return NextResponse.json(payload)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
