"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useAuth } from "@/hooks/use-auth"

interface LoginProps {
  role: "user" | "admin"
  onBack: () => void
}

export function Login({ role, onBack }: LoginProps) {
  const { login } = useSupabaseAuth()
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login: authLogin } = useAuth() // Call the hook unconditionally

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!usernameOrEmail || !password) {
      setError("Por favor, preencha o nome de usuário ou email e a senha.")
      return
    }

    setIsLoading(true)
    try {
      console.log("Tentando login com:", usernameOrEmail)

      // Verificar credenciais do administrador Vinildo Mondlane
      if (
        (usernameOrEmail.toLowerCase() === "v.mondlane1@gmail.com" ||
          usernameOrEmail.toLowerCase() === "vinildo mondlane") &&
        password === "Vinildo123456"
      ) {
        // Usar o hook de autenticação local para garantir o login

        await authLogin(usernameOrEmail, password)
        return // O redirecionamento será tratado pelo useEffect no componente pai
      }

      // Tentar login normal com Supabase
      await login(usernameOrEmail, password)
      // O redirecionamento será tratado pelo useEffect no componente pai
    } catch (err) {
      console.error("Erro no login:", err)
      setError("Nome de usuário ou senha incorretos. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button variant="ghost" className="absolute left-4 top-4" onClick={onBack}>
            <ArrowLeft size={24} />
          </Button>
          <CardTitle className="text-2xl font-bold text-center text-red-700">
            {role === "admin" ? "Login de Administrador" : "Login de Usuário"}
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Digite suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail">Nome de usuário ou Email</Label>
              <Input
                id="usernameOrEmail"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Seu nome de usuário ou email"
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
                placeholder="Sua senha"
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

