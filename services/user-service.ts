import type { User } from "@/types/user"
import { v4 as uuidv4 } from "uuid"

// In-memory storage for users
const users: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123", // In production, this should be encrypted
    fullName: "Administrator",
    email: "admin@example.com",
    role: "admin",
    isActive: true,
    forcePasswordChange: false,
    permissions: ["all"],
    permissionGroups: ["admin"],
  },
]

let currentUser: User | null = null

export const UserService = {
  // Get all users
  async getAllUsers() {
    try {
      return users
    } catch (error) {
      console.error("Error getting users:", error)
      throw error
    }
  },

  // Get user by ID
  async getUserById(id: string) {
    try {
      const user = users.find((u) => u.id === id)
      if (!user) throw new Error(`User with ID ${id} not found`)
      return user
    } catch (error) {
      console.error(`Error getting user with ID ${id}:`, error)
      throw error
    }
  },

  // Add a new user
  async addUser(user: User) {
    try {
      const newUser = {
        ...user,
        id: user.id || uuidv4(),
      }
      users.push(newUser)
      return newUser
    } catch (error) {
      console.error("Error adding user:", error)
      throw error
    }
  },

  // Update a user
  async updateUser(user: User) {
    try {
      const index = users.findIndex((u) => u.id === user.id)
      if (index === -1) throw new Error(`User with ID ${user.id} not found`)

      users[index] = {
        ...users[index],
        ...user,
      }

      return users[index]
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  },

  // Delete a user
  async deleteUser(id: string) {
    try {
      const index = users.findIndex((u) => u.id === id)
      if (index === -1) throw new Error(`User with ID ${id} not found`)

      users.splice(index, 1)
      return true
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error)
      throw error
    }
  },

  // Login
  async login(username: string, password: string) {
    try {
      const user = users.find((u) => u.username === username && u.password === password && u.isActive)

      if (user) {
        currentUser = user
      }

      return user || null
    } catch (error) {
      console.error("Error during login:", error)
      return null
    }
  },

  // Logout
  async logout() {
    try {
      currentUser = null
      return true
    } catch (error) {
      console.error("Error during logout:", error)
      throw error
    }
  },

  // Get current user
  getCurrentUser() {
    return currentUser
  },

  // Set current user (for testing/development)
  setCurrentUser(user: User | null) {
    currentUser = user
  },

  // Subscribe to user changes (mock implementation)
  subscribeUsers(callback: (payload: any) => void) {
    // This is a mock implementation that doesn't actually subscribe to anything
    console.log("User subscription requested (mock implementation)")
    return {
      unsubscribe: () => {
        console.log("User subscription unsubscribed (mock implementation)")
      },
    }
  },
}

