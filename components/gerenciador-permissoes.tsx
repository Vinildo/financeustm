"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useAppContext } from "@/contexts/AppContext"
import type { User, Permission } from "@/types/user"

// Lista de todas as permissões disponíveis
const ALL_PERMISSIONS: { id: Permission; category: string; description: string }[] = [
  // Permissões de visualização
  { id: "view_pagamentos", category: "Visualização", description: "Visualizar pagamentos" },
  { id: "view_relatorio_divida", category: "Visualização", description: "Visualizar relatório de dívida" },
  { id: "view_relatorio_fornecedor", category: "Visualização", description: "Visualizar relatório de fornecedor" },
  { id: "view_controlo_cheques", category: "Visualização", description: "Visualizar controlo de cheques" },
  { id: "view_fundo_maneio", category: "Visualização", description: "Visualizar fundo de maneio" },
  { id: "view_reconciliacao_bancaria", category: "Visualização", description: "Visualizar reconciliação bancária" },
  { id: "view_reconciliacao_interna", category: "Visualização", description: "Visualizar reconciliação interna" },
  { id: "view_calendario_fiscal", category: "Visualização", description: "Visualizar calendário fiscal" },
  { id: "view_relatorio_financeiro", category: "Visualização", description: "Visualizar relatório financeiro" },
  { id: "view_previsao_orcamento", category: "Visualização", description: "Visualizar previsão orçamental" },

  // Permissões de edição
  { id: "edit_pagamentos", category: "Edição", description: "Editar pagamentos" },
  { id: "edit_fornecedores", category: "Edição", description: "Editar fornecedores" },
  { id: "edit_fundo_maneio", category: "Edição", description: "Editar fundo de maneio" },
  { id: "edit_controlo_cheques", category: "Edição", description: "Editar controlo de cheques" },

  // Permissões de aprovação
  { id: "approve_pagamentos", category: "Aprovação", description: "Aprovar pagamentos" },
  { id: "approve_fundo_maneio", category: "Aprovação", description: "Aprovar fundo de maneio" },

  // Permissões administrativas
  { id: "manage_users", category: "Administração", description: "Gerenciar usuários" },
  { id: "view_audit_logs", category: "Administração", description: "Visualizar logs de auditoria" },
  { id: "system_settings", category: "Administração", description: "Configurações do sistema" },
]

export function GerenciadorPermissoes() {
  const { users, updateUser, currentUser } = useAppContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Verificar se o usuário atual é administrador
  useEffect(() => {
    if (currentUser?.role === "admin" || currentUser?.email === "v.mondlane1@gmail.com") {
      setIsAdmin(true)
    }
  }, [currentUser])

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase() || ""),
  )

  const handlePermissionChange = (user: User, permission: Permission, checked: boolean) => {
    if (!user.permissions) {
      user.permissions = []
    }

    const updatedPermissions = checked
      ? [...user.permissions, permission]
      : user.permissions.filter((p) => p !== permission)

    const updatedUser = {
      ...user,
      permissions: updatedPermissions,
    }

    updateUser(updatedUser)

    toast({
      title: `Permissão ${checked ? "concedida" : "revogada"}`,
      description: `A permissão "${permission}" foi ${checked ? "concedida a" : "revogada de"} ${user.fullName}.`,
    })
  }

  const hasPermission = (user: User, permission: Permission): boolean => {
    // Administradores têm todas as permissões
    if (user.role === "admin") {
      return true
    }

    // Verificar permissões diretas
    if (user.permissions?.includes(permission)) {
      return true
    }

    return false
  }

  // Se não for administrador, mostrar mensagem de acesso negado
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
          <CardDescription>Apenas administradores podem acessar o gerenciamento de permissões</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <h3 className="mt-2 text-lg font-medium">Permissão negada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Você não tem permissão para acessar esta funcionalidade. Entre em contato com um administrador.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Permissões</CardTitle>
        <CardDescription>Conceda ou revogue permissões de usuários</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Barra de pesquisa */}
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Input
                type="search"
                placeholder="Buscar usuários..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de usuários */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <span className="text-red-600">Administrador</span>
                    ) : user.role === "supervisor" ? (
                      <span className="text-amber-600">Supervisor</span>
                    ) : (
                      <span>Usuário</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user.id === selectedUser?.id ? null : user)}
                    >
                      {user.id === selectedUser?.id ? "Fechar" : "Gerenciar Permissões"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Detalhes de permissões do usuário selecionado */}
          {selectedUser && (
            <Card className="mt-4 border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Permissões de {selectedUser.fullName}</CardTitle>
                <CardDescription>Marque ou desmarque as permissões para este usuário</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ALL_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`perm-${selectedUser.id}-${permission.id}`}
                        checked={hasPermission(selectedUser, permission.id)}
                        onCheckedChange={(checked) => {
                          handlePermissionChange(selectedUser, permission.id, checked as boolean)
                        }}
                        disabled={selectedUser.role === "admin"}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`perm-${selectedUser.id}-${permission.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.description}
                        </Label>
                        <p className="text-xs text-muted-foreground">Categoria: {permission.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

