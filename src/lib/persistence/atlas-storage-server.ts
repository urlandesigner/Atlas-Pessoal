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

  const current = await readAtlasStoragePayload()
  const mergedData = mergeAtlasStorageData(current.data, data)

  const payload: AtlasStoragePayload = {
    updatedAt: new Date().toISOString(),
    data: mergedData,
  }

  await writeFile(STORAGE_FILE, JSON.stringify(payload, null, 2), "utf8")

  return payload
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function mergeAtlasStorageData(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>
) {
  const merged: Record<string, unknown> = {
    ...current,
    ...incoming,
  }

  merged.atlas_crm_leads = mergeLeadCollections(current.atlas_crm_leads, incoming.atlas_crm_leads)

  return merged
}

function mergeLeadCollections(current: unknown, incoming: unknown) {
  const currentLeads = Array.isArray(current) ? current : []
  const incomingLeads = Array.isArray(incoming) ? incoming : []

  const byKey = new Map<string, unknown>()

  for (const lead of currentLeads) {
    byKey.set(getLeadMergeKey(lead), lead)
  }

  for (const lead of incomingLeads) {
    byKey.set(getLeadMergeKey(lead), lead)
  }

  return Array.from(byKey.values())
}

function getLeadMergeKey(lead: unknown) {
  if (!isRecord(lead)) return JSON.stringify(lead)

  const id = typeof lead.id === "string" ? lead.id : ""
  if (id) return `id:${id}`

  const prospect = isRecord(lead.prospect) ? lead.prospect : null
  const company = typeof prospect?.company === "string" ? prospect.company.trim().toLowerCase() : ""
  if (company) return `company:${company}`

  return JSON.stringify(lead)
}
