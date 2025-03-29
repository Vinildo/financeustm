"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCircle, ShieldCheck, Key } from "lucide-react"
import { Login } from "@/components/login"
import { AdminRegister } from "@/components/admin-register"
import { ResetPassword } from "@/components/reset-password"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useRouter } from "next/navigation"
import { ConnectionError } from "@/components/connection-error"

export function InitialAccessPage() {
  const [selectedRole, setSelectedRole] = useState<"user" | "admin" | "reset" | null>(null)
  const { user, hasAdmin, isLoading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (user) {
    return null
  }

  if (selectedRole === "admin" && !hasAdmin) {
    return <AdminRegister />
  }

  if (selectedRole === "user" || selectedRole === "admin") {
    return <Login role={selectedRole} onBack={() => setSelectedRole(null)} />
  }

  if (selectedRole === "reset") {
    return <ResetPassword onBack={() => setSelectedRole(null)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <ConnectionError />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-red-700">Bem-vindo à FINANCE-VM</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Escolha seu tipo de acesso para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full h-16 text-lg justify-start space-x-4"
            variant="outline"
            onClick={() => setSelectedRole("user")}
          >
            <UserCircle size={24} />
            <span>Acesso de Usuário Padrão</span>
          </Button>
          <Button
            className="w-full h-16 text-lg justify-start space-x-4"
            variant="outline"
            onClick={() => setSelectedRole("admin")}
          >
            <ShieldCheck size={24} />
            <span>{hasAdmin ? "Acesso de Administrador" : "Registrar Administrador"}</span>
          </Button>
          <Button
            className="w-full h-16 text-lg justify-start space-x-4"
            variant="outline"
            onClick={() => setSelectedRole("reset")}
          >
            <Key size={24} />
            <span>Redefinir Senha</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

