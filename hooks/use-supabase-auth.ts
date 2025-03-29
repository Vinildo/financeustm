"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import type { User, UserRole } from "@/types/user"
import { AuthService } from "@/services/auth-service"

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAdmin, setHasAdmin] = useState(true)
  const [databaseInitialized, setDatabaseInitialized] = useState(true)

  // Verificar se o banco de dados está inicializado
  const checkDatabaseInitialized = useCallback(async () => {
    // In our in-memory implementation, the database is always "initialized"
    return true
  }, [])

  // Carregar usuário atual ao inicializar
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true)

      try {
        // Verificar se o banco de dados está inicializado
        const isInitialized = await checkDatabaseInitialized()
        if (!isInitialized) {
          setIsLoading(false)
          return
        }

        // Verificar se há um usuário autenticado
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Erro ao carregar sessão:", error)
          setIsLoading(false)
          return
        }

        if (session?.user) {
          try {
            // Buscar dados adicionais do usuário
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single()

            if (userError) {
              if (userError.message.includes("does not exist")) {
                console.warn("Tabela de usuários não existe:", userError.message)
                setDatabaseInitialized(false)
                setIsLoading(false)
                return
              }

              console.error("Erro ao carregar dados do usuário:", userError)
              setIsLoading(false)
              return
            }

            // Combinar dados da autenticação com dados do perfil
            setUser({
              id: session.user.id,
              username: userData.username,
              fullName: userData.full_name,
              email: userData.email,
              role: userData.role as UserRole,
              isActive: userData.is_active,
              forcePasswordChange: userData.force_password_change,
              permissions: userData.permissions,
              permissionGroups: userData.permission_groups,
            })
          } catch (e) {
            console.error("Erro ao processar dados do usuário:", e)
          }
        }

        // Verificar se existe algum administrador
        try {
          const { data: admins, error: adminsError } = await supabase
            .from("users")
            .select("id")
            .eq("role", "admin")
            .limit(1)

          if (adminsError) {
            if (adminsError.message.includes("does not exist")) {
              console.warn("Tabela de usuários não existe:", adminsError.message)
              setDatabaseInitialized(false)
              setHasAdmin(false)
            } else {
              console.error("Erro ao verificar administradores:", adminsError)
            }
          } else {
            setHasAdmin(admins && admins.length > 0)
          }
        } catch (e) {
          console.error("Erro ao verificar administradores:", e)
          // Assumir que não há admin em caso de erro para permitir a criação
          setHasAdmin(false)
        }
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()

    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Verificar se o banco de dados está inicializado
        const isInitialized = await checkDatabaseInitialized()
        if (!isInitialized) {
          return
        }

        try {
          // Buscar dados adicionais do usuário
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (userError) {
            if (userError.message.includes("does not exist")) {
              console.warn("Tabela de usuários não existe:", userError.message)
              setDatabaseInitialized(false)
              return
            }

            console.error("Erro ao carregar dados do usuário:", userError)
            return
          }

          // Combinar dados da autenticação com dados do perfil
          setUser({
            id: session.user.id,
            username: userData.username,
            fullName: userData.full_name,
            email: userData.email,
            role: userData.role as UserRole,
            isActive: userData.is_active,
            forcePasswordChange: userData.force_password_change,
            permissions: userData.permissions,
            permissionGroups: userData.permission_groups,
          })
        } catch (e) {
          console.error("Erro ao processar dados do usuário após login:", e)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [checkDatabaseInitialized])

  // Login com email e senha
  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      setIsLoading(true)
      try {
        // Verificar credenciais do administrador Vinildo Mondlane
        if (
          (usernameOrEmail.toLowerCase() === "v.mondlane1@gmail.com" ||
            usernameOrEmail.toLowerCase() === "vinildo mondlane") &&
          password === "Vinildo123456"
        ) {
          console.log("Login especial para Vinildo Mondlane via Supabase Auth")
          const vinildoUser = {
            id: "admin-vinildo",
            username: "Vinildo Mondlane",
            fullName: "Vinildo Mondlane",
            email: "v.mondlane1@gmail.com",
            role: "admin",
            isActive: true,
            forcePasswordChange: false,
          }

          // Salvar no localStorage
          localStorage.setItem("supabaseUser", JSON.stringify(vinildoUser))

          // Atualizar o estado
          setUser(vinildoUser)

          return vinildoUser
        }

        // Verificar se o banco de dados está inicializado
        const isInitialized = await checkDatabaseInitialized()
        if (!isInitialized) {
          toast({
            title: "Banco de dados não inicializado",
            description: "O banco de dados precisa ser inicializado antes de fazer login.",
            variant: "destructive",
          })
          setIsLoading(false)
          throw new Error("Banco de dados não inicializado")
        }

        // Verificar se é um email ou username
        const isEmail = usernameOrEmail.includes("@")

        if (isEmail) {
          // Login direto com email
          const { data, error } = await supabase.auth.signInWithPassword({
            email: usernameOrEmail,
            password,
          })

          if (error) throw error

          if (data.user) {
            // Buscar dados adicionais do usuário
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("id", data.user.id)
              .single()

            if (userError) {
              if (userError.message.includes("does not exist")) {
                toast({
                  title: "Banco de dados não inicializado",
                  description: "O banco de dados precisa ser inicializado antes de fazer login.",
                  variant: "destructive",
                })
                await supabase.auth.signOut()
                throw new Error("Banco de dados não inicializado")
              }
              throw userError
            }

            if (!userData.is_active) {
              await supabase.auth.signOut()
              toast({
                title: "Conta desativada",
                description: "Esta conta de usuário está desativada. Contacte o administrador.",
                variant: "destructive",
              })
              throw new Error("Conta desativada")
            }

            // Combinar dados da autenticação com dados do perfil
            const userWithProfile = {
              id: data.user.id,
              username: userData.username,
              fullName: userData.full_name,
              email: userData.email,
              role: userData.role as UserRole,
              isActive: userData.is_active,
              forcePasswordChange: userData.force_password_change,
              permissions: userData.permissions,
              permissionGroups: userData.permission_groups,
            }

            setUser(userWithProfile)

            toast({
              title: "Login bem-sucedido",
              description: `Bem-vindo, ${userData.full_name}!`,
            })

            return userWithProfile
          }
        } else {
          // Buscar email associado ao username
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("email")
            .eq("username", usernameOrEmail)
            .single()

          if (userError) {
            if (userError.message.includes("does not exist")) {
              toast({
                title: "Banco de dados não inicializado",
                description: "O banco de dados precisa ser inicializado antes de fazer login.",
                variant: "destructive",
              })
              throw new Error("Banco de dados não inicializado")
            }

            toast({
              title: "Erro no login",
              description: "Nome de usuário ou senha incorretos. Por favor, tente novamente.",
              variant: "destructive",
            })
            throw new Error("Usuário não encontrado")
          }

          // Login com o email encontrado
          const { data, error } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password,
          })

          if (error) {
            toast({
              title: "Erro no login",
              description: "Nome de usuário ou senha incorretos. Por favor, tente novamente.",
              variant: "destructive",
            })
            throw error
          }

          if (data.user) {
            // Buscar dados completos do usuário
            const { data: fullUserData, error: fullUserError } = await supabase
              .from("users")
              .select("*")
              .eq("id", data.user.id)
              .single()

            if (fullUserError) {
              if (fullUserError.message.includes("does not exist")) {
                toast({
                  title: "Banco de dados não inicializado",
                  description: "O banco de dados precisa ser inicializado antes de fazer login.",
                  variant: "destructive",
                })
                await supabase.auth.signOut()
                throw new Error("Banco de dados não inicializado")
              }
              throw fullUserError
            }

            if (!fullUserData.is_active) {
              await supabase.auth.signOut()
              toast({
                title: "Conta desativada",
                description: "Esta conta de usuário está desativada. Contacte o administrador.",
                variant: "destructive",
              })
              throw new Error("Conta desativada")
            }

            // Combinar dados da autenticação com dados do perfil
            const userWithProfile = {
              id: data.user.id,
              username: fullUserData.username,
              fullName: fullUserData.full_name,
              email: fullUserData.email,
              role: fullUserData.role as UserRole,
              isActive: fullUserData.is_active,
              forcePasswordChange: fullUserData.force_password_change,
              permissions: fullUserData.permissions,
              permissionGroups: fullUserData.permission_groups,
            }

            setUser(userWithProfile)

            toast({
              title: "Login bem-sucedido",
              description: `Bem-vindo, ${fullUserData.full_name}!`,
            })

            return userWithProfile
          }
        }

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
    [checkDatabaseInitialized],
  )

  // Logout
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar desconectar.",
        variant: "destructive",
      })
    }
  }, [])

  // Registro de novo usuário
  const register = useCallback(
    async (username: string, password: string, email: string, fullName: string) => {
      setIsLoading(true)
      try {
        // Verificar se já existe um administrador
        if (hasAdmin) {
          throw new Error("Administrador já existe")
        }

        // Registrar o usuário na autenticação
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: "admin",
            },
          },
        })

        if (error) throw error

        if (data.user) {
          // Verificar se o banco de dados está inicializado
          const isInitialized = await checkDatabaseInitialized()
          if (!isInitialized) {
            toast({
              title: "Banco de dados não inicializado",
              description: "O banco de dados precisa ser inicializado antes de registrar um usuário.",
              variant: "destructive",
            })
            await supabase.auth.signOut()
            throw new Error("Banco de dados não inicializado")
          }

          // Adicionar dados adicionais na tabela users
          const { data: userData, error: userError } = await supabase
            .from("users")
            .insert([
              {
                id: data.user.id,
                username,
                full_name: fullName,
                email,
                role: "admin",
                is_active: true,
                force_password_change: false,
              },
            ])
            .select()
            .single()

          if (userError) {
            if (userError.message.includes("does not exist")) {
              toast({
                title: "Banco de dados não inicializado",
                description: "O banco de dados precisa ser inicializado antes de registrar um usuário.",
                variant: "destructive",
              })
              await supabase.auth.signOut()
              throw new Error("Banco de dados não inicializado")
            }
            throw userError
          }

          // Atualizar estado
          setHasAdmin(true)

          // Combinar dados da autenticação com dados do perfil
          const userWithProfile = {
            id: data.user.id,
            username,
            fullName,
            email,
            role: "admin" as UserRole,
            isActive: true,
            forcePasswordChange: false,
          }

          setUser(userWithProfile)

          toast({
            title: "Registro bem-sucedido",
            description: "Conta de administrador criada com sucesso.",
          })

          return userWithProfile
        }

        throw new Error("Falha ao criar usuário")
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
    [hasAdmin, checkDatabaseInitialized],
  )

  // Redefinir senha
  const resetPassword = useCallback(
    async (username: string, newPassword: string) => {
      setIsLoading(true)
      try {
        // Verificar se o banco de dados está inicializado
        const isInitialized = await checkDatabaseInitialized()
        if (!isInitialized) {
          toast({
            title: "Banco de dados não inicializado",
            description: "O banco de dados precisa ser inicializado antes de redefinir a senha.",
            variant: "destructive",
          })
          throw new Error("Banco de dados não inicializado")
        }

        // Buscar o usuário pelo username
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, email")
          .or(`username.eq.${username},email.eq.${username}`)
          .single()

        if (userError) {
          if (userError.message.includes("does not exist")) {
            toast({
              title: "Banco de dados não inicializado",
              description: "O banco de dados precisa ser inicializado antes de redefinir a senha.",
              variant: "destructive",
            })
            throw new Error("Banco de dados não inicializado")
          }
          throw new Error("Usuário não encontrado")
        }

        // Atualizar a senha
        const { error } = await supabase.auth.admin.updateUserById(userData.id, { password: newPassword })

        if (error) throw error

        // Atualizar o flag de forçar mudança de senha
        const { error: updateError } = await supabase
          .from("users")
          .update({ force_password_change: false })
          .eq("id", userData.id)

        if (updateError) {
          if (updateError.message.includes("does not exist")) {
            toast({
              title: "Banco de dados não inicializado",
              description: "O banco de dados precisa ser inicializado antes de redefinir a senha.",
              variant: "destructive",
            })
            throw new Error("Banco de dados não inicializado")
          }
          throw updateError
        }

        toast({
          title: "Senha redefinida",
          description: "Sua senha foi redefinida com sucesso.",
        })

        return true
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
    [checkDatabaseInitialized],
  )

  // Verificar permissão
  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false

      // Administradores têm todas as permissões
      if (user.role === "admin") return true

      // Verificar permissões baseadas em função (role)
      const rolePermissions = {
        financial_director: ["approve_payments", "view_reports", "manage_budget"],
        rector: ["final_approve_payments", "view_reports"],
        user: ["view_payments"],
      }

      const userRolePermissions = rolePermissions[user.role as keyof typeof rolePermissions] || []
      if (userRolePermissions.includes(permission)) return true

      // Verificar permissões individuais
      if (user.permissions?.includes(permission)) return true

      // Verificar permissões de grupos
      if (user.permissionGroups) {
        const permissionGroups = {
          finance: ["manage_payments", "view_reports", "manage_budget"],
          reports: ["view_reports"],
          admin_lite: ["manage_users", "view_reports"],
        }

        for (const groupId of user.permissionGroups) {
          const groupPermissions = permissionGroups[groupId as keyof typeof permissionGroups] || []
          if (groupPermissions.includes(permission)) {
            return true
          }
        }
      }

      return false
    },
    [user],
  )

  // Inicializar banco de dados
  const initializeDatabase = useCallback(async () => {
    setIsLoading(true)
    try {
      // Executar o script SQL para criar as tabelas
      const { error } = await supabase.rpc("initialize_database", {
        sql_script: require("@/supabase/schema.sql").default,
      })

      if (error) {
        console.error("Erro ao inicializar banco de dados:", error)
        toast({
          title: "Erro ao inicializar banco de dados",
          description: error.message,
          variant: "destructive",
        })
        throw error
      }

      toast({
        title: "Banco de dados inicializado",
        description: "O banco de dados foi inicializado com sucesso.",
      })

      setDatabaseInitialized(true)
      return true
    } catch (error) {
      console.error("Erro ao inicializar banco de dados:", error)
      toast({
        title: "Erro ao inicializar banco de dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginNew = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await AuthService.login(username, password)
      if (!error && data) {
        setUser(data.user)
      }
      return { data, error }
    } finally {
      setIsLoading(false)
    }
  }

  const logoutNew = async () => {
    setIsLoading(true)
    try {
      await AuthService.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    login,
    logout,
    register,
    hasAdmin,
    isLoading,
    hasPermission,
    resetPassword,
    databaseInitialized,
    initializeDatabase,
    checkDatabaseInitialized,
    loginNew,
    logoutNew,
  }
}

