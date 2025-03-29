"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"

interface ResetPasswordProps {
  onBack: () => void
}

export function ResetPassword({ onBack }: ResetPasswordProps) {
  const { resetPassword } = useSupabaseAuth()
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!usernameOrEmail || !newPassword || !confirmPassword) {
      setError("Por favor, preencha todos os campos.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(usernameOrEmail, newPassword)
      setSuccess(true)
      // Limpar os campos após o sucesso
      setUsernameOrEmail("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      console.error("Erro ao redefinir senha:", err)
      setError("Não foi possível redefinir a senha. Verifique se o nome de usuário ou email está correto.")
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
          <CardTitle className="text-2xl font-bold text-center text-red-700">Redefinir Senha</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Digite seu nome de usuário ou email e a nova senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                Senha redefinida com sucesso. Você pode fazer login agora.
              </div>
            )}
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
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

