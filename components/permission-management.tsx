"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useAppContext } from "@/contexts/AppContext"
import type { User, Permission, PermissionGroup, PermissionChangeLog } from "@/types/user"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Filter, Plus, Search, Shield, ShieldAlert, ShieldCheck, UserCog } from "lucide-react"

// Grupos de permissões predefinidos
const DEFAULT_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "basic_user",
    name: "Usuário Básico",
    description: "Permissões básicas para usuários regulares",
    permissions: [
      "view_pagamentos",
      "view_relatorio_divida",
      "view_relatorio_fornecedor",
      "view_controlo_cheques",
      "view_fundo_maneio",
    ],
  },
  {
    id: "financial_analyst",
    name: "Analista Financeiro",
    description: "Permissões para análise financeira e relatórios",
    permissions: [
      "view_pagamentos",
      "view_relatorio_divida",
      "view_relatorio_fornecedor",
      "view_controlo_cheques",
      "view_fundo_maneio",
      "view_reconciliacao_bancaria",
      "view_reconciliacao_interna",
      "view_relatorio_financeiro",
      "view_previsao_orcamento",
    ],
  },
  {
    id: "payment_manager",
    name: "Gestor de Pagamentos",
    description: "Permissões para gerenciar pagamentos",
    permissions: [
      "view_pagamentos",
      "edit_pagamentos",
      "view_relatorio_divida",
      "view_relatorio_fornecedor",
      "view_controlo_cheques",
      "edit_controlo_cheques",
    ],
  },
  {
    id: "supervisor",
    name: "Supervisor",
    description: "Permissões para supervisionar e aprovar operações",
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
    ],
  },
  {
    id: "admin",
    name: "Administrador",
    description: "Todas as permissões do sistema",
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
  },
]

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

export function PermissionManagement() {
  const { users, updateUser, currentUser } = useAppContext()

  // Adicionar verificação para garantir que apenas administradores possam gerenciar permissões
  const isCurrentUserAdmin = currentUser?.role === "admin"

  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(DEFAULT_PERMISSION_GROUPS)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [newGroup, setNewGroup] = useState<Omit<PermissionGroup, "id">>({
    name: "",
    description: "",
    permissions: [],
  })
  const [permissionLogs, setPermissionLogs] = useState<PermissionChangeLog[]>([])
  const [activeTab, setActiveTab] = useState("users")
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  // Carregar logs do localStorage
  useEffect(() => {
    const storedLogs = localStorage.getItem("permissionLogs")
    if (storedLogs) {
      setPermissionLogs(
        JSON.parse(storedLogs, (key, value) => {
          if (key === "timestamp") return new Date(value)
          return value
        }),
      )
    }

    const storedGroups = localStorage.getItem("permissionGroups")
    if (storedGroups) {
      setPermissionGroups(JSON.parse(storedGroups))
    }
  }, [])

  // Salvar logs no localStorage quando houver mudanças
  useEffect(() => {
    localStorage.setItem("permissionLogs", JSON.stringify(permissionLogs))
  }, [permissionLogs])

  // Salvar grupos no localStorage quando houver mudanças
  useEffect(() => {
    localStorage.setItem("permissionGroups", JSON.stringify(permissionGroups))
  }, [permissionGroups])

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredPermissions = filterCategory
    ? ALL_PERMISSIONS.filter((p) => p.category === filterCategory)
    : ALL_PERMISSIONS

  const addPermissionLog = (
    userId: string,
    action: "grant" | "revoke",
    permission: Permission | string,
    details?: string,
  ) => {
    if (!currentUser) return

    const newLog: PermissionChangeLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      userId,
      adminId: currentUser.id,
      adminName: currentUser.fullName,
      action,
      permission,
      details,
    }

    setPermissionLogs((prev) => [newLog, ...prev])
  }

  const handleUserPermissionChange = (user: User, permission: Permission, checked: boolean) => {
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
    addPermissionLog(
      user.id,
      checked ? "grant" : "revoke",
      permission,
      `Permissão ${checked ? "concedida" : "revogada"} manualmente`,
    )

    toast({
      title: `Permissão ${checked ? "concedida" : "revogada"}`,
      description: `A permissão "${permission}" foi ${checked ? "concedida a" : "revogada de"} ${user.fullName}.`,
    })
  }

  const handleGroupAssignment = (user: User, groupId: string, checked: boolean) => {
    if (!user.permissionGroups) {
      user.permissionGroups = []
    }

    const updatedGroups = checked
      ? [...user.permissionGroups, groupId]
      : user.permissionGroups.filter((g) => g !== groupId)

    const updatedUser = {
      ...user,
      permissionGroups: updatedGroups,
    }

    updateUser(updatedUser)

    const group = permissionGroups.find((g) => g.id === groupId)
    if (group) {
      addPermissionLog(
        user.id,
        checked ? "grant" : "revoke",
        `grupo:${groupId}`,
        `Grupo de permissões "${group.name}" ${checked ? "atribuído" : "removido"}`,
      )

      toast({
        title: `Grupo ${checked ? "atribuído" : "removido"}`,
        description: `O grupo "${group.name}" foi ${checked ? "atribuído a" : "removido de"} ${user.fullName}.`,
      })
    }
  }

  const createPermissionGroup = () => {
    if (!newGroup.name || newGroup.permissions.length === 0) {
      toast({
        title: "Erro",
        description: "O nome do grupo e pelo menos uma permissão são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const newGroupWithId: PermissionGroup = {
      ...newGroup,
      id: Date.now().toString(),
    }

    setPermissionGroups((prev) => [...prev, newGroupWithId])
    setNewGroup({
      name: "",
      description: "",
      permissions: [],
    })
    setIsGroupDialogOpen(false)

    toast({
      title: "Grupo criado",
      description: `O grupo "${newGroupWithId.name}" foi criado com sucesso.`,
    })
  }

  const deletePermissionGroup = (groupId: string) => {
    const group = permissionGroups.find((g) => g.id === groupId)
    if (!group) return

    // Remover o grupo de todos os usuários que o possuem
    users.forEach((user) => {
      if (user.permissionGroups?.includes(groupId)) {
        const updatedUser = {
          ...user,
          permissionGroups: user.permissionGroups.filter((g) => g !== groupId),
        }
        updateUser(updatedUser)
      }
    })

    setPermissionGroups((prev) => prev.filter((g) => g.id !== groupId))

    toast({
      title: "Grupo excluído",
      description: `O grupo "${group.name}" foi excluído com sucesso.`,
    })
  }

  const hasPermission = (user: User, permission: Permission): boolean => {
    // Verificar permissões diretas
    if (user.permissions?.includes(permission)) {
      return true
    }

    // Verificar permissões de grupos
    if (user.permissionGroups) {
      for (const groupId of user.permissionGroups) {
        const group = permissionGroups.find((g) => g.id === groupId)
        if (group && group.permissions.includes(permission)) {
          return true
        }
      }
    }

    // Administradores têm todas as permissões
    if (user.role === "admin") {
      return true
    }

    return false
  }

  const getPermissionSource = (user: User, permission: Permission): string => {
    if (user.role === "admin") {
      return "Função de Administrador"
    }

    if (user.permissions?.includes(permission)) {
      return "Permissão direta"
    }

    if (user.permissionGroups) {
      for (const groupId of user.permissionGroups) {
        const group = permissionGroups.find((g) => g.id === groupId)
        if (group && group.permissions.includes(permission)) {
          return `Grupo: ${group.name}`
        }
      }
    }

    return "Não tem permissão"
  }

  // Adicionar verificação de permissão no início do return:
  if (!isCurrentUserAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
          <CardDescription>Apenas administradores podem acessar o gerenciamento de permissões</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
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
        <CardDescription>Gerencie permissões de usuários e grupos de permissões</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="users">
              <UserCog className="mr-2 h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Shield className="mr-2 h-4 w-4" />
              Grupos de Permissões
            </TabsTrigger>
            <TabsTrigger value="logs">
              <ShieldAlert className="mr-2 h-4 w-4" />
              Logs de Permissões
            </TabsTrigger>
          </TabsList>

          {/* Aba de Usuários */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar usuários..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

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
                        <span className="flex items-center text-red-600">
                          <ShieldCheck className="mr-1 h-4 w-4" />
                          Administrador
                        </span>
                      ) : user.role === "supervisor" ? (
                        <span className="flex items-center text-amber-600">
                          <Shield className="mr-1 h-4 w-4" />
                          Supervisor
                        </span>
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
                        onClick={() => {
                          setSelectedUser(user)
                          setIsUserDialogOpen(true)
                        }}
                      >
                        Gerenciar Permissões
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Aba de Grupos de Permissões */}
          <TabsContent value="groups" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Grupos de Permissões</h3>
              <Button onClick={() => setIsGroupDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Grupo
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissionGroups.map((group) => (
                <Card key={group.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-red-600" onClick={() => deletePermissionGroup(group.id)}>
                            Excluir Grupo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-2">{group.permissions.length} permissões</div>
                    <div className="space-y-1">
                      {group.permissions.slice(0, 5).map((permission) => {
                        const permInfo = ALL_PERMISSIONS.find((p) => p.id === permission)
                        return (
                          <div key={permission} className="text-sm">
                            • {permInfo?.description || permission}
                          </div>
                        )
                      })}
                      {group.permissions.length > 5 && (
                        <div className="text-sm text-muted-foreground">+ {group.permissions.length - 5} mais...</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Aba de Logs */}
          <TabsContent value="logs" className="space-y-4">
            <h3 className="text-lg font-medium">Logs de Alterações de Permissões</h3>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Administrador</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Permissão/Grupo</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionLogs.map((log) => {
                  const user = users.find((u) => u.id === log.userId)
                  const isGroup = log.permission.startsWith("grupo:")
                  let permissionName = log.permission

                  if (isGroup) {
                    const groupId = log.permission.replace("grupo:", "")
                    const group = permissionGroups.find((g) => g.id === groupId)
                    if (group) {
                      permissionName = `Grupo: ${group.name}`
                    }
                  } else {
                    const permInfo = ALL_PERMISSIONS.find((p) => p.id === log.permission)
                    if (permInfo) {
                      permissionName = permInfo.description
                    }
                  }

                  return (
                    <TableRow key={log.id}>
                      <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                      <TableCell>{log.adminName}</TableCell>
                      <TableCell>{user?.fullName || "Usuário Desconhecido"}</TableCell>
                      <TableCell>
                        {log.action === "grant" ? (
                          <span className="text-green-600">Concedida</span>
                        ) : (
                          <span className="text-red-600">Revogada</span>
                        )}
                      </TableCell>
                      <TableCell>{permissionName}</TableCell>
                      <TableCell>{log.details}</TableCell>
                    </TableRow>
                  )
                })}
                {permissionLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      Nenhum log de permissão encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        {/* Dialog para gerenciar permissões de usuário */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Permissões - {selectedUser?.fullName}</DialogTitle>
              <DialogDescription>Atribua permissões individuais ou grupos de permissões ao usuário</DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <Tabs defaultValue="individual">
                <TabsList className="mb-4">
                  <TabsTrigger value="individual">Permissões Individuais</TabsTrigger>
                  <TabsTrigger value="groups">Grupos de Permissões</TabsTrigger>
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                </TabsList>

                {/* Aba de Permissões Individuais */}
                <TabsContent value="individual" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <Label>Filtrar por categoria:</Label>
                    <Select value={filterCategory || ""} onValueChange={(value) => setFilterCategory(value || null)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        <SelectItem value="Visualização">Visualização</SelectItem>
                        <SelectItem value="Edição">Edição</SelectItem>
                        <SelectItem value="Aprovação">Aprovação</SelectItem>
                        <SelectItem value="Administração">Administração</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    {filteredPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`perm-${permission.id}`}
                          checked={hasPermission(selectedUser, permission.id)}
                          onCheckedChange={(checked) => {
                            handleUserPermissionChange(selectedUser, permission.id, checked as boolean)
                          }}
                          disabled={selectedUser.role === "admin"}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor={`perm-${permission.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.description}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {hasPermission(selectedUser, permission.id) && (
                              <span className="text-xs text-muted-foreground">
                                Via: {getPermissionSource(selectedUser, permission.id)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Aba de Grupos de Permissões */}
                <TabsContent value="groups" className="space-y-4">
                  <div className="space-y-4">
                    {permissionGroups.map((group) => (
                      <div key={group.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={selectedUser.permissionGroups?.includes(group.id) || false}
                          onCheckedChange={(checked) => {
                            handleGroupAssignment(selectedUser, group.id, checked as boolean)
                          }}
                          disabled={selectedUser.role === "admin"}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor={`group-${group.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {group.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                          <div className="mt-1">
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => {
                                // Expandir para mostrar todas as permissões do grupo
                                // Implementação simplificada - poderia ser um modal ou expansão in-line
                                toast({
                                  title: `Permissões do grupo ${group.name}`,
                                  description: (
                                    <ul className="mt-2 list-disc pl-4">
                                      {group.permissions.map((perm) => {
                                        const permInfo = ALL_PERMISSIONS.find((p) => p.id === perm)
                                        return <li key={perm}>{permInfo?.description || perm}</li>
                                      })}
                                    </ul>
                                  ),
                                })
                              }}
                            >
                              Ver {group.permissions.length} permissões
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Aba de Visão Geral */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="rounded-md border p-4">
                    <h4 className="font-medium mb-2">Informações do Usuário</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Nome:</span> {selectedUser.fullName}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {selectedUser.email}
                      </div>
                      <div>
                        <span className="font-medium">Função:</span>{" "}
                        {selectedUser.role === "admin"
                          ? "Administrador"
                          : selectedUser.role === "supervisor"
                            ? "Supervisor"
                            : "Usuário"}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {selectedUser.isActive ? "Ativo" : "Inativo"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border p-4">
                    <h4 className="font-medium mb-2">Grupos de Permissões Atribuídos</h4>
                    {selectedUser.permissionGroups && selectedUser.permissionGroups.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {selectedUser.permissionGroups.map((groupId) => {
                          const group = permissionGroups.find((g) => g.id === groupId)
                          return group ? <li key={groupId}>{group.name}</li> : null
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum grupo de permissões atribuído</p>
                    )}
                  </div>

                  <div className="rounded-md border p-4">
                    <h4 className="font-medium mb-2">Permissões Efetivas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ALL_PERMISSIONS.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          {hasPermission(selectedUser, permission.id) ? (
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <Shield className="h-4 w-4 text-gray-300" />
                          )}
                          <span
                            className={
                              hasPermission(selectedUser, permission.id) ? "text-sm" : "text-sm text-muted-foreground"
                            }
                          >
                            {permission.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter>
              <Button onClick={() => setIsUserDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para criar grupo de permissões */}
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Grupo de Permissões</DialogTitle>
              <DialogDescription>Defina um nome e selecione as permissões para o novo grupo</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Nome do Grupo</Label>
                <Input
                  id="group-name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-description">Descrição</Label>
                <Input
                  id="group-description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Permissões</Label>
                <div className="h-[200px] overflow-y-auto border rounded-md p-4 space-y-2">
                  {ALL_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`new-perm-${permission.id}`}
                        checked={newGroup.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          setNewGroup({
                            ...newGroup,
                            permissions: checked
                              ? [...newGroup.permissions, permission.id]
                              : newGroup.permissions.filter((p) => p !== permission.id),
                          })
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={`new-perm-${permission.id}`} className="text-sm font-medium leading-none">
                          {permission.description}
                        </Label>
                        <p className="text-xs text-muted-foreground">Categoria: {permission.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createPermissionGroup}>Criar Grupo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

