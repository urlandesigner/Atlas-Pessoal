import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import type { AtlasStoragePayload } from "./atlas-storage-shared"

const STORAGE_DIRECTORY = path.join(process.cwd(), ".atlas")
const STORAGE_FILE = path.join(STORAGE_DIRECTORY, "local-data.json")

export async function readAtlasStoragePayload(): Promise<AtlasStoragePayload> {
  try {
    const raw = await readFile(STORAGE_FILE, "utf8")
    const parsed = JSON.parse(raw) as Partial<AtlasStoragePayload>

    return {
      updatedAt:
        typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
      data: isRecord(parsed.data) ? parsed.data : {},
    }
  } catch {
    return {
      updatedAt: new Date(0).toISOString(),
      data: {},
    }
  }
}

export async function writeAtlasStoragePayload(data: Record<string, unknown>) {
  await mkdir(STORAGE_DIRECTORY, { recursive: true })

  const payload: AtlasStoragePayload = {
    updatedAt: new Date().toISOString(),
    data,
  }

  await writeFile(STORAGE_FILE, JSON.stringify(payload, null, 2), "utf8")

  return payload
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
