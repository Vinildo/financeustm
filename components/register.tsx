"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"

interface RegisterProps {
  onRegisterComplete: () => void
}

type UserRole = "user" | "admin" | "financial_director" | "rector"

export function Register({ onRegisterComplete }: RegisterProps) {
  const { register } = useSupabaseAuth()
  // Adicionar estado para o email
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("") // Adicionado estado para email
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formData, setFormData] = useState({ role: "user" as UserRole })
  const [isLoading, setIsLoading] = useState(false)

  // Update the handleRegister function to validate email
  const handleRegister = async () => {
    // Modificar a validação para incluir o email
    if (!username || !fullName || !email || !password || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Registrar usuário usando o hook useSupabaseAuth
      await register(username, password, email, fullName)

      toast({
        title: "Sucesso",
        description: "Administrador registrado com sucesso. Você pode fazer login agora.",
      })

      onRegisterComplete()
    } catch (error) {
      console.error("Erro no registro:", error)
      toast({
        title: "Erro no registro",
        description: "Não foi possível criar a conta. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Registro do Administrador</CardTitle>
        <CardDescription>Crie a conta de administrador para acessar o sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nome de usuário</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu nome de usuário"
            />
          </div>
          {/* Adicionar o campo de email no formulário (após o campo de nome completo) */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu email"
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua senha"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="role">Função</Label>
            <select
              id="role"
              className="w-full p-2 border rounded"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              required
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
              <option value="financial_director">Diretora Financeira</option>
              <option value="rector">Reitor</option>
            </select>
          </div>
          <Button className="w-full" onClick={handleRegister} disabled={isLoading}>
            {isLoading ? "Registrando..." : "Registrar Administrador"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

