export interface WorkflowStep {
  id: string
  role: string
  username: string
  status: "pending" | "approved" | "rejected"
  date?: Date
  comments?: string
}

export interface Workflow {
  status: "in_progress" | "approved" | "rejected"
  currentStep: number
  steps: WorkflowStep[]
}

export interface Notification {
  id: string
  userId: string // "all" para todos os usuários
  title: string
  message: string
  date: Date
  read: boolean
  type: string // "payment_approval", "payment_approved", "payment_rejected", etc.
  relatedId?: string
  actionUrl?: string
}

export interface WorkflowConfigStep {
  role: string
  username: string
  title: string
}

export interface WorkflowConfig {
  enabled: boolean
  steps: WorkflowConfigStep[]
}

