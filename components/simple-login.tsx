"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function SimpleLogin() {
  const router = useRouter()
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Verificar se as credenciais correspondem ao administrador
      if (
        (usernameOrEmail.toLowerCase() === "v.mondlane1@gmail.com" ||
          usernameOrEmail.toLowerCase() === "vinildo mondlane") &&
        password === "Vinildo123456"
      ) {
        console.log("Login bem-sucedido")

        // Criar objeto de usuário para armazenar no localStorage
        const adminUser = {
          id: "admin-fallback",
          username: "Vinildo Mondlane",
          fullName: "Vinildo Mondlane",
          email: "v.mondlane1@gmail.com",
          role: "admin",
          isActive: true,
          forcePasswordChange: false,
        }

        // Armazenar no localStorage
        localStorage.setItem("currentUser", JSON.stringify(adminUser))

        // Mostrar toast de sucesso
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo, Vinildo Mondlane!",
        })

        // Redirecionar para o dashboard usando window.location para garantir o redirecionamento
        console.log("Redirecionando para /dashboard")
        window.location.href = "/dashboard"
        return
      }

      // Se não for o admin, verificar outras credenciais (não implementado aqui)
      setError("Credenciais inválidas. Por favor, tente novamente.")
    } catch (err) {
      console.error("Erro no login:", err)
      setError("Ocorreu um erro durante o login. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-red-700">FINANCE-VM</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail">Email ou Nome de Usuário</Label>
              <Input
                id="usernameOrEmail"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Digite seu email ou nome de usuário"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

