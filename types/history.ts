export type HistoryEntry = {
  id: string
  timestamp: Date
  userId: string
  username: string
  action: "create" | "update" | "delete"
  entityType: "payment" | "supplier" | "check" | "budget"
  entityId: string
  details: string
  previousState?: any
  newState?: any
}

