"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useAppContext } from "@/contexts/AppContext"
import type { User, Permission } from "@/types/user"
import { Search, Shield } from "lucide-react"

// Lista de permissões agrupadas por categoria
const PERMISSOES_POR_CATEGORIA = {
  Visualização: [
    { id: "view_pagamentos", descricao: "Visualizar pagamentos" },
    { id: "view_relatorio_divida", descricao: "Visualizar relatório de dívida" },
    { id: "view_relatorio_fornecedor", descricao: "Visualizar relatório de fornecedor" },
    { id: "view_controlo_cheques", descricao: "Visualizar controlo de cheques" },
    { id: "view_fundo_maneio", descricao: "Visualizar fundo de maneio" },
    { id: "view_reconciliacao_bancaria", descricao: "Visualizar reconciliação bancária" },
    { id: "view_reconciliacao_interna", descricao: "Visualizar reconciliação interna" },
    { id: "view_calendario_fiscal", descricao: "Visualizar calendário fiscal" },
    { id: "view_relatorio_financeiro", descricao: "Visualizar relatório financeiro" },
    { id: "view_previsao_orcamento", descricao: "Visualizar previsão orçamental" },
  ],
  Edição: [
    { id: "edit_pagamentos", descricao: "Editar pagamentos" },
    { id: "edit_fornecedores", descricao: "Editar fornecedores" },
    { id: "edit_fundo_maneio", descricao: "Editar fundo de maneio" },
    { id: "edit_controlo_cheques", descricao: "Editar controlo de cheques" },
  ],
  Aprovação: [
    { id: "approve_pagamentos", descricao: "Aprovar pagamentos" },
    { id: "approve_fundo_maneio", descricao: "Aprovar fundo de maneio" },
  ],
  Administração: [
    { id: "manage_users", descricao: "Gerenciar usuários" },
    { id: "view_audit_logs", descricao: "Visualizar logs de auditoria" },
    { id: "system_settings", descricao: "Configurações do sistema" },
  ],
}

export function GerenciadorPermissoesSimples() {
  const { users, updateUser, currentUser } = useAppContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Verificar se o usuário atual é administrador
  const isAdmin = currentUser?.role === "admin" || currentUser?.email === "v.mondlane1@gmail.com"

  // Filtrar usuários com base na pesquisa
  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase() || ""),
  )

  // Função para alterar permissão
  const togglePermission = (user: User, permissionId: string) => {
    if (!user.permissions) {
      user.permissions = []
    }

    const hasPermission = user.permissions.includes(permissionId as Permission)

    const updatedPermissions = hasPermission
      ? user.permissions.filter((p) => p !== permissionId)
      : [...user.permissions, permissionId as Permission]

    const updatedUser = {
      ...user,
      permissions: updatedPermissions,
    }

    updateUser(updatedUser)

    // Mostrar mensagem de confirmação
    alert(`Permissão ${hasPermission ? "revogada" : "concedida"} com sucesso!`)
  }

  // Verificar se o usuário tem uma permissão específica
  const hasPermission = (user: User, permissionId: string): boolean => {
    if (user.role === "admin") return true
    return user.permissions?.includes(permissionId as Permission) || false
  }

  // Se não for administrador, mostrar mensagem de acesso negado
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">Permissão negada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Você não tem permissão para acessar esta funcionalidade.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de pesquisa */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Lista de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
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
        </CardContent>
      </Card>

      {/* Permissões do usuário selecionado */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Permissões de {selectedUser.fullName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(PERMISSOES_POR_CATEGORIA).map(([categoria, permissoes]) => (
                <div key={categoria}>
                  <h3 className="text-lg font-medium mb-2">{categoria}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {permissoes.map((permissao) => (
                      <div key={permissao.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`perm-${selectedUser.id}-${permissao.id}`}
                          checked={hasPermission(selectedUser, permissao.id)}
                          onCheckedChange={() => togglePermission(selectedUser, permissao.id)}
                          disabled={selectedUser.role === "admin"}
                        />
                        <label htmlFor={`perm-${selectedUser.id}-${permissao.id}`} className="text-sm cursor-pointer">
                          {permissao.descricao}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

