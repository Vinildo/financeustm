"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useAppContext } from "@/contexts/AppContext"
import type { User } from "@/types/user"
import { Shield, UserCog } from "lucide-react"

export function AdminSetup() {
  const { users, addUser, updateUser } = useAppContext()
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Verificar se o administrador já existe
  useEffect(() => {
    const adminExists = users.some((user) => user.email === "v.mondlane1@gmail.com" && user.role === "admin")

    if (adminExists) {
      setIsComplete(true)
    }
  }, [users])

  // Atualizar a senha no método setupAdministrator
  const setupAdministrator = () => {
    setIsConfiguring(true)

    try {
      // Verificar se o usuário já existe
      const existingUser = users.find((user) => user.email === "v.mondlane1@gmail.com")

      if (existingUser) {
        // Atualizar o usuário existente para administrador se necessário
        if (existingUser.role !== "admin") {
          const updatedUser: User = {
            ...existingUser,
            role: "admin",
            isActive: true,
            password: "Vinildo123456", // Atualizar a senha para a correta
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
            title: "Administrador atualizado",
            description: `${existingUser.fullName} foi atualizado para administrador com todas as permissões.`,
          })
        } else {
          toast({
            title: "Administrador já configurado",
            description: `${existingUser.fullName} já é um administrador.`,
          })
        }
      } else {
        // Criar novo usuário administrador com a senha correta
        const newAdmin: Omit<User, "id"> = {
          username: "vmondlane",
          fullName: "Vinildo Mondlane",
          email: "v.mondlane1@gmail.com",
          role: "admin",
          password: "Vinildo123456", // Atualizar para a senha correta
          isActive: true,
          forcePasswordChange: false, // Não forçar a troca de senha
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
          description: "Vinildo Mondlane foi configurado como administrador com todas as permissões.",
        })
      }

      setIsComplete(true)
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
        <CardTitle>Configuração de Administrador</CardTitle>
        <CardDescription>
          Configure Vinildo Mondlane como administrador do sistema com todas as permissões
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-medium">Vinildo Mondlane</span>
          </div>
          <div className="text-sm text-muted-foreground">Email: v.mondlane1@gmail.com</div>

          {isComplete ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <UserCog className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Administrador configurado</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Vinildo Mondlane já está configurado como administrador com todas as permissões necessárias para
                      gerenciar o sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={setupAdministrator} disabled={isConfiguring} className="w-full">
              {isConfiguring ? "Configurando..." : "Configurar como Administrador"}
            </Button>
          )}

          <div className="text-sm text-muted-foreground mt-4">
            <p>Como administrador, Vinildo Mondlane terá autonomia para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Conceder e revogar permissões de outros usuários</li>
              <li>Criar e gerenciar grupos de permissões</li>
              <li>Visualizar logs de alterações de permissões</li>
              <li>Acessar todas as funcionalidades do sistema</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

