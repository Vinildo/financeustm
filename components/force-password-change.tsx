"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useAppContext } from "@/contexts/AppContext"

interface ForcePasswordChangeProps {
  userId: string
  onPasswordChanged: () => void
}

export function ForcePasswordChange({ userId, onPasswordChanged }: ForcePasswordChangeProps) {
  const { users, updateUser } = useAppContext()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    const user = users.find((u) => u.id === userId)
    if (user) {
      const updatedUser = { ...user, password: newPassword, forcePasswordChange: false }
      updateUser(updatedUser)
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      })
      onPasswordChanged()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Alterar Senha</CardTitle>
        <CardDescription>Por favor, altere sua senha para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite sua nova senha"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua nova senha"
            />
          </div>
          <Button className="w-full" onClick={handlePasswordChange}>
            Alterar Senha
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

