"use client"

import { useState, useEffect } from "react"
import type { User } from "@/types/user"

export function useOfflineAuth() {
  const [offlineUser, setOfflineUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkOfflineUser = () => {
      try {
        const storedUser = localStorage.getItem("currentUser")
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          if (parsedUser && parsedUser.email === "v.mondlane1@gmail.com") {
            setOfflineUser(parsedUser)
          }
        }
      } catch (error) {
        console.error("Erro ao verificar usuário offline:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkOfflineUser()
  }, [])

  const login = (email: string, password: string): Promise<User | null> => {
    return new Promise((resolve, reject) => {
      if (
        (email.toLowerCase() === "v.mondlane1@gmail.com" || email.toLowerCase() === "vinildo mondlane") &&
        password === "Vinildo123456"
      ) {
        const adminUser: User = {
          id: "admin-fallback",
          username: "Vinildo Mondlane",
          fullName: "Vinildo Mondlane",
          email: "v.mondlane1@gmail.com",
          role: "admin",
          isActive: true,
          forcePasswordChange: false,
        }

        localStorage.setItem("currentUser", JSON.stringify(adminUser))
        setOfflineUser(adminUser)
        resolve(adminUser)
      } else {
        reject(new Error("Credenciais inválidas"))
      }
    })
  }

  const logout = () => {
    localStorage.removeItem("currentUser")
    setOfflineUser(null)
  }

  return {
    user: offlineUser,
    isLoading,
    login,
    logout,
    hasPermission: (permission: string) => offlineUser?.role === "admin",
  }
}

