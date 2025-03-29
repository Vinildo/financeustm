"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useAppContext } from "@/contexts/AppContext"

interface SwitchUserDialogProps {
  userId: string
  onClose: () => void
  onSwitchUser: (userId: string) => void
}

export function SwitchUserDialog({ userId, onClose, onSwitchUser }: SwitchUserDialogProps) {
  const { users } = useAppContext()
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const user = users.find((u) => u.id === userId)
    if (user && user.password === password) {
      onSwitchUser(userId)
      onClose()
    } else {
      toast({
        title: "Erro de autenticação",
        description: "Senha incorreta.",
        variant: "destructive",
      })
    }
  }

  const user = users.find((u) => u.id === userId)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Autenticar como {user?.fullName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha do usuário"
              />
            </div>
            <Button type="submit" className="w-full">
              Autenticar e Trocar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

