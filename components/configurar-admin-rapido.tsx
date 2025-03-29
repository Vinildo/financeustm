"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function ConfigurarAdminRapido() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullAccess: true,
    financialAccess: true,
    userManagementAccess: true,
    reportsAccess: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validação básica
    if (!formData.name || !formData.email || !formData.password) {
      setError("Todos os campos são obrigatórios")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    setLoading(true)

    try {
      // Simulação de chamada de API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Aqui você implementaria a lógica real para criar o admin
      console.log("Admin configurado:", formData)

      setSuccess(true)
      // Resetar o formulário após sucesso
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        fullAccess: true,
        financialAccess: true,
        userManagementAccess: true,
        reportsAccess: true,
      })
    } catch (err) {
      setError("Erro ao configurar administrador. Tente novamente.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Configuração Rápida de Administrador</CardTitle>
        <CardDescription>Configure um novo administrador com acesso ao sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nome do administrador"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="fullAccess" className="cursor-pointer">
                Acesso Total
              </Label>
              <Switch
                id="fullAccess"
                checked={formData.fullAccess}
                onCheckedChange={(checked) => handleSwitchChange("fullAccess", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="financialAccess" className="cursor-pointer">
                Acesso Financeiro
              </Label>
              <Switch
                id="financialAccess"
                checked={formData.financialAccess}
                onCheckedChange={(checked) => handleSwitchChange("financialAccess", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="userManagementAccess" className="cursor-pointer">
                Gestão de Usuários
              </Label>
              <Switch
                id="userManagementAccess"
                checked={formData.userManagementAccess}
                onCheckedChange={(checked) => handleSwitchChange("userManagementAccess", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="reportsAccess" className="cursor-pointer">
                Acesso a Relatórios
              </Label>
              <Switch
                id="reportsAccess"
                checked={formData.reportsAccess}
                onCheckedChange={(checked) => handleSwitchChange("reportsAccess", checked)}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

          {success && <div className="text-green-500 text-sm mt-2">Administrador configurado com sucesso!</div>}

          <Button type="submit" className="w-full bg-red-700 hover:bg-red-800" disabled={loading}>
            {loading ? "Configurando..." : "Configurar Administrador"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

