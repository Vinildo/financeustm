"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import type { User, UserRole } from "@/types/user"
import { useAppContext } from "@/contexts/AppContext"
import React from "react"

// Define the default users with the specified admin credentials
const DEFAULT_USERS = [
  {
    id: "1",
    username: "admin",
    fullName: "Admin User",
    email: "admin@example.com",
    role: "admin" as UserRole,
    password: "admin123",
    isActive: true,
    forcePasswordChange: false,
  },
  {
    id: "2",
    username: "user",
    fullName: "Regular User",
    email: "user@example.com",
    role: "user" as UserRole,
    password: "user123",
    isActive: true,
    forcePasswordChange: false,
  },
  {
    id: "3",
    username: "Benigna Magaia",
    fullName: "Benigna Magaia",
    email: "benigna.magaia@example.com",
    role: "user" as UserRole,
    password: "01",
    isActive: true,
    forcePasswordChange: false,
  },
  {
    id: "4",
    username: "Vinildo Mondlane",
    fullName: "Vinildo Mondlane",
    email: "v.mondlane1@gmail.com",
    role: "admin" as UserRole,
    password: "Vinildo123456",
    isActive: true,
    forcePasswordChange: false,
  },
  {
    id: "5",
    username: "diretora.financeira",
    password: "123456",
    fullName: "Diretora Financeira",
    email: "diretora@example.com",
    role: "financial_director" as UserRole,
    isActive: true,
    forcePasswordChange: false,
  },
  {
    id: "6",
    username: "reitor",
    password: "123456",
    fullName: "Reitor",
    email: "reitor@example.com",
    role: "rector" as UserRole,
    isActive: true,
    forcePasswordChange: false,
  },
]

export function useAuth() {
  const {
    currentUser,
    setCurrentUser,
    users,
    addUser,
    updateUser,
    login: contextLogin,
    logout: contextLogout,
    hasPermission: contextHasPermission,
  } = useAppContext()

  // State for loading status
  const [isLoading, setIsLoading] = useState(true)
  // State for whether an admin exists
  const [hasAdmin, setHasAdmin] = useState(true)
  // Ref to track initialization
  const initialized = useRef(false)
  // Ref to track if auth is in progress
  const authInProgress = useRef(false)

  // Initialize auth state on component mount
  useEffect(() => {
    // Prevent multiple initializations or running when auth is in progress
    if (initialized.current || authInProgress.current) return

    const initAuth = async () => {
      authInProgress.current = true
      setIsLoading(true)

      try {
        // Carregar usuários do localStorage ou usar os padrões
        const storedUsers = localStorage.getItem("users")
        if (storedUsers) {
          const parsedUsers = JSON.parse(storedUsers)
          console.log("Usuários carregados do localStorage:", parsedUsers.length)

          // Se não houver usuários no contexto, adicionamos os usuários do localStorage
          if (users.length === 0) {
            for (const user of parsedUsers) {
              // Verificar se o usuário já existe
              if (!users.some((u) => u.id === user.id)) {
                await addUser(user)
              }
            }
          }
        } else {
          // Se não houver usuários no localStorage, usar os padrões
          if (users.length === 0) {
            for (const user of DEFAULT_USERS) {
              // Verificar se o usuário já existe
              if (!users.some((u) => u.id === user.id)) {
                await addUser(user)
              }
            }
          }
          localStorage.setItem("users", JSON.stringify(DEFAULT_USERS))
          console.log("Usuários padrão carregados:", DEFAULT_USERS.length)
        }

        // Try to get the stored user from localStorage
        const storedUserJson = localStorage.getItem("currentUser")
        if (storedUserJson && !currentUser) {
          try {
            const storedUser = JSON.parse(storedUserJson)
            setCurrentUser(storedUser)
            console.log("Usuário atual carregado:", storedUser.username)
          } catch (e) {
            console.error("Error parsing stored user:", e)
            localStorage.removeItem("currentUser")
          }
        }

        // Always set hasAdmin to true since we have default admin users
        setHasAdmin(true)
      } catch (error) {
        console.error("Error during auth initialization:", error)
      } finally {
        setIsLoading(false)
        initialized.current = true
        authInProgress.current = false
      }
    }

    initAuth()
  }, [addUser, setCurrentUser, users, currentUser])

  // Login function - updated to accept email as login credential
  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      setIsLoading(true)
      try {
        console.log("Tentando login com:", { usernameOrEmail, password: "***" })

        // Verificar se as credenciais do administrador Vinildo Mondlane estão corretas
        // Garantir que funcione com email ou username
        if (
          (usernameOrEmail.toLowerCase() === "v.mondlane1@gmail.com" ||
            usernameOrEmail.toLowerCase() === "vinildo mondlane") &&
          password === "Vinildo123456"
        ) {
          console.log("Login especial para Vinildo Mondlane")
          const vinildoUser = {
            id: "4",
            username: "Vinildo Mondlane",
            fullName: "Vinildo Mondlane",
            email: "v.mondlane1@gmail.com",
            role: "admin" as UserRole,
            isActive: true,
            forcePasswordChange: false,
          }

          setCurrentUser(vinildoUser)
          localStorage.setItem("currentUser", JSON.stringify(vinildoUser))

          toast({
            title: "Login bem-sucedido",
            description: `Bem-vindo, ${vinildoUser.fullName}!`,
          })

          return vinildoUser
        }

        // Para depuração - listar todos os usuários disponíveis
        console.log(
          "Usuários disponíveis:",
          users.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            password: u.password ? "***" : null,
            isActive: u.isActive,
          })),
        )

        // Implementação manual de login para garantir compatibilidade
        const foundUser = users.find(
          (u) =>
            (u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
              (u.email && u.email.toLowerCase() === usernameOrEmail.toLowerCase())) &&
            u.password === password,
        )

        if (foundUser) {
          if (!foundUser.isActive) {
            console.log("Conta desativada")
            toast({
              title: "Conta desativada",
              description: "Esta conta de usuário está desativada. Contacte o administrador.",
              variant: "destructive",
            })
            throw new Error("Conta desativada")
          }

          // Create a copy without the password
          const { password: _, ...userWithoutPassword } = foundUser

          setCurrentUser(userWithoutPassword)
          localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))
          console.log("Login bem-sucedido para:", userWithoutPassword.username)

          toast({
            title: "Login bem-sucedido",
            description: `Bem-vindo, ${foundUser.fullName}!`,
          })

          return userWithoutPassword
        }

        // Se chegou aqui, não encontrou o usuário
        console.log("Credenciais inválidas - usuário não encontrado")
        toast({
          title: "Erro no login",
          description: "Nome de usuário ou senha incorretos. Por favor, tente novamente.",
          variant: "destructive",
        })
        throw new Error("Credenciais inválidas")
      } catch (error) {
        console.error("Login error:", error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [users, setCurrentUser],
  )

  // Logout function
  const logout = useCallback(() => {
    contextLogout()
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    })
  }, [contextLogout])

  // Register function
  const register = useCallback(
    async (username: string, password: string) => {
      setIsLoading(true)
      try {
        // Check if an admin already exists
        if (users.some((u) => u.role === "admin")) {
          throw new Error("Administrador já existe")
        }

        // Create a new admin user with the specified email
        const newAdmin: User = {
          id: Date.now().toString(),
          username,
          password,
          role: "admin",
          fullName: "Admin User",
          email: "v.mondlane1@gmail.com", // Use the specified admin email
          isActive: true,
          forcePasswordChange: false,
        }

        // Add the new admin using the addUser function from context
        await addUser(newAdmin)

        // Salvar no localStorage
        localStorage.setItem("users", JSON.stringify([...users, newAdmin]))

        // Set hasAdmin to true
        setHasAdmin(true)

        // Create a copy without the password
        const { password: _, ...adminWithoutPassword } = newAdmin

        // Set the current user
        setCurrentUser(adminWithoutPassword)
        localStorage.setItem("currentUser", JSON.stringify(adminWithoutPassword))

        toast({
          title: "Registro bem-sucedido",
          description: "Conta de administrador criada com sucesso.",
        })

        return adminWithoutPassword
      } catch (error) {
        console.error("Registration error:", error)
        toast({
          title: "Erro no registro",
          description: "Não foi possível criar a conta. Por favor, tente novamente.",
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [users, addUser, setCurrentUser],
  )

  // Reset password function
  const resetPassword = useCallback(
    async (username: string, newPassword: string) => {
      setIsLoading(true)
      try {
        // Find the user index by username or email
        const userToUpdate = users.find(
          (u) =>
            u.username.toLowerCase() === username.toLowerCase() ||
            (u.email && u.email.toLowerCase() === username.toLowerCase()),
        )

        if (!userToUpdate) {
          throw new Error("Usuário não encontrado")
        }

        // Update the user with the new password
        const updatedUser = {
          ...userToUpdate,
          password: newPassword,
          forcePasswordChange: false,
        }

        // Use updateUser from context
        await updateUser(updatedUser)

        toast({
          title: "Senha redefinida",
          description: "Sua senha foi redefinida com sucesso.",
        })
      } catch (error) {
        console.error("Reset password error:", error)
        toast({
          title: "Erro ao redefinir senha",
          description:
            error instanceof Error ? error.message : "Não foi possível redefinir a senha. Por favor, tente novamente.",
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [users, updateUser],
  )

  // Check if a user has a specific permission
  const hasPermission = useCallback(
    (permission: string) => {
      return contextHasPermission(permission)
    },
    [contextHasPermission],
  )

  // Memoize the return value to prevent unnecessary re-renders
  return React.useMemo(
    () => ({
      user: currentUser,
      login,
      logout,
      register,
      hasAdmin,
      isLoading,
      hasPermission,
      resetPassword,
    }),
    [currentUser, login, logout, register, hasAdmin, isLoading, hasPermission, resetPassword],
  )
}

