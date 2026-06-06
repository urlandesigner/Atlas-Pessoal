export type WorkspaceType = "professional" | "freelancer"

export type RecordCategory =
  | "demand"
  | "improvement"
  | "decision"
  | "implementation"
  | "meeting"
  | "alignment"
  | "mentoring"
  | "automation"
  | "workshop"
  | "support"

export type RecordStatus = "draft" | "published" | "archived"
export type RecordPriority = "low" | "medium" | "high"

export type ProjectStatus =
  | "active"
  | "not_started"
  | "paused"
  | "closed"
  | "inactive"

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Record {
  id: string
  user_id: string
  workspace: WorkspaceType
  title: string
  description: string | null
  category: RecordCategory
  status: RecordStatus
  priority: RecordPriority
  date: string
  problem: string | null
  objective: string | null
  expected_impact: string | null
  contribution: string | null
  leadership: string | null
  decisions: string | null
  solution: string | null
  impact_generated: string | null
  perceived_improvement: string | null
  feedback: string | null
  learnings: string | null
  tags: string[]
  project_id: string | null
  ai_summary: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  workspace: WorkspaceType
  name: string
  description: string | null
  status: ProjectStatus
  stack: string[]
  value: number | null
  started_at: string | null
  ended_at: string | null
  links: ProjectLink[]
  client_id: string | null
  created_at: string
  updated_at: string
}

export interface ProjectLink {
  label: string
  url: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

export interface Contract {
  id: string
  user_id: string
  client_id: string
  project_id: string | null
  title: string
  value: number
  currency: string
  type: "fixed" | "monthly" | "hourly"
  status: "active" | "pending" | "closed"
  started_at: string
  ended_at: string | null
  renewal_at: string | null
  notes: string | null
  created_at: string
}

export interface Attachment {
  id: string
  record_id: string
  type: "image" | "file" | "link" | "figma" | "github" | "video"
  label: string
  url: string
  created_at: string
}

export interface AISummary {
  id: string
  user_id: string
  period_type: "weekly" | "monthly" | "quarterly"
  period_start: string
  period_end: string
  content: string
  highlights: string[]
  created_at: string
}
