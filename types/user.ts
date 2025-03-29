import type { PermissionType } from "./permission"

export type UserRole = "admin" | "user" | "financial_director" | "rector"

export interface User {
  id: string
  username: string
  password?: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
  forcePasswordChange: boolean
  permissions?: PermissionType[]
  permissionGroups?: string[]
}

