"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useAppContext } from "@/contexts/AppContext"
import type { User } from "@/types/user"
import { Shield } from "lucide-react"

export function ConfigurarAdmin() {
  const { users, addUser, updateUser } = useAppContext()
  const [isConfiguring, setIsConfiguring] = useState(false)

  const configurarVinildoComoAdmin = () => {
    setIsConfiguring(true)

    try {
      // Verificar se o usuário já existe
      const existingUser = users.find((user) => user.email === "v.mondlane1@gmail.com")

      if (existingUser) {
        // Atualizar o usuário existente para administrador
        const updatedUser: User = {
          ...existingUser,
          username: "Vinildo Mondlane", // Garantir que o username seja exatamente este
          fullName: "Vinildo Mondlane", // Garantir que o nome completo seja exatamente este
          email: "v.mondlane1@gmail.com", // Garantir que o email seja exatamente este
          role: "admin",
          isActive: true,
          permissions: [
            "view_pagamentos",
            "edit_pagamentos",
            "approve_pagamentos",
            "view_relatorio_divida",
            "view_relatorio_fornecedor",
            "view_controlo_cheques",
            "edit_controlo_cheques",
            "view_fundo_maneio",
            "edit_fundo_maneio",
            "approve_fundo_maneio",
            "view_reconciliacao_bancaria",
            "view_reconciliacao_interna",
            "view_calendario_fiscal",
            "view_relatorio_financeiro",
            "view_previsao_orcamento",
            "edit_fornecedores",
            "manage_users",
            "view_audit_logs",
            "system_settings",
          ],
        }

        updateUser(updatedUser)

        toast({
          title: "Administrador configurado",
          description: `${updatedUser.fullName} foi configurado como administrador com todas as permissões.`,
        })
      } else {
        // Criar novo usuário administrador
        const newAdmin: Omit<User, "id"> = {
          username: "Vinildo Mondlane", // Garantir que o username seja exatamente este
          fullName: "Vinildo Mondlane", // Garantir que o nome completo seja exatamente este
          email: "v.mondlane1@gmail.com", // Garantir que o email seja exatamente este
          role: "admin",
          password: "admin123", // Senha temporária
          isActive: true,
          forcePasswordChange: true,
          permissions: [
            "view_pagamentos",
            "edit_pagamentos",
            "approve_pagamentos",
            "view_relatorio_divida",
            "view_relatorio_fornecedor",
            "view_controlo_cheques",
            "edit_controlo_cheques",
            "view_fundo_maneio",
            "edit_fundo_maneio",
            "approve_fundo_maneio",
            "view_reconciliacao_bancaria",
            "view_reconciliacao_interna",
            "view_calendario_fiscal",
            "view_relatorio_financeiro",
            "view_previsao_orcamento",
            "edit_fornecedores",
            "manage_users",
            "view_audit_logs",
            "system_settings",
          ],
        }

        addUser(newAdmin)

        toast({
          title: "Administrador criado",
          description: "Vinildo Mondlane foi criado como administrador com todas as permissões.",
        })
      }
    } catch (error) {
      console.error("Erro ao configurar administrador:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao configurar o administrador.",
        variant: "destructive",
      })
    } finally {
      setIsConfiguring(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Administrador</CardTitle>
        <CardDescription>Configure Vinildo Mondlane como administrador do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-medium">Vinildo Mondlane</span>
          </div>
          <div className="text-sm text-muted-foreground">Email: v.mondlane1@gmail.com</div>

          <Button onClick={configurarVinildoComoAdmin} disabled={isConfiguring} className="w-full">
            {isConfiguring ? "Configurando..." : "Configurar como Administrador"}
          </Button>

          <div className="text-sm text-muted-foreground mt-4">
            <p>Como administrador, Vinildo Mondlane terá autonomia para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Conceder e revogar permissões de outros usuários</li>
              <li>Acessar todas as funcionalidades do sistema</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

