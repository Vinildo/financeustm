import { UserService } from "./user-service"
import type { User } from "@/types/user"

export const AuthService = {
  // Login
  async login(username: string, password: string): Promise<User | null> {
    try {
      return await UserService.login(username, password)
    } catch (error) {
      console.error("Error during login:", error)
      return null
    }
  },

  // Logout
  async logout(): Promise<boolean> {
    try {
      return await UserService.logout()
    } catch (error) {
      console.error("Error during logout:", error)
      return false
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return UserService.getCurrentUser()
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return UserService.getCurrentUser() !== null
  },

  // Check if user has permission
  hasPermission(permission: string): boolean {
    const user = UserService.getCurrentUser()
    if (!user) return false

    // Admin has all permissions
    if (user.role === "admin" || user.permissions.includes("all")) {
      return true
    }

    return user.permissions.includes(permission)
  },

  // Check if user is in permission group
  isInPermissionGroup(group: string): boolean {
    const user = UserService.getCurrentUser()
    if (!user) return false

    // Admin is in all groups
    if (user.role === "admin") {
      return true
    }

    return user.permissionGroups.includes(group)
  },
}

