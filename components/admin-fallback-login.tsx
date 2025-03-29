"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function AdminFallbackLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
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
        (email.toLowerCase() === "v.mondlane1@gmail.com" || email.toLowerCase() === "vinildo mondlane") &&
        password === "Vinildo123456"
      ) {
        console.log("Login de fallback bem-sucedido")

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

        // Redirecionar para o dashboard
        console.log("Redirecionando para /dashboard")
        window.location.href = "/dashboard"
      } else {
        setError("Credenciais inválidas. No modo offline, apenas o administrador pode fazer login.")
      }
    } catch (err) {
      console.error("Erro no login:", err)
      setError("Ocorreu um erro durante o login. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Modo Offline</CardTitle>
          <CardDescription className="text-center">
            O sistema está operando em modo offline. Apenas o administrador pode fazer login.
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
              <Label htmlFor="email">Email ou Nome de Usuário</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="v.mondlane1@gmail.com"
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
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          <p>Este é um modo de acesso de emergência quando o banco de dados não está disponível.</p>
        </CardFooter>
      </Card>
    </div>
  )
}

