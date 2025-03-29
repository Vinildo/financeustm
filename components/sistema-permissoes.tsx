"use client"

import { useState, useEffect } from "react"
import { useAppContext } from "@/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { DEFAULT_ROLE_PERMISSIONS, PREDEFINED_PERMISSION_GROUPS, type PermissionType } from "@/types/permission"
import type { User } from "@/types/user"

interface PermissionLog {
  id: string
  userId: string
  username: string
  action: "add" | "remove"
  permissionType: "individual" | "group"
  permissionName: string
  timestamp: Date
  adminUsername: string
}

export function SistemaPermissoes() {
  const { users, updateUser, currentUser } = useAppContext()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [permissionLogs, setPermissionLogs] = useState<PermissionLog[]>([])
  const [activeTab, setActiveTab] = useState("individual")

  // Carregar logs do localStorage
  useEffect(() => {
    const storedLogs = localStorage.getItem("permissionLogs")
    if (storedLogs) {
      try {
        const parsedLogs = JSON.parse(storedLogs)
        // Converter strings de data para objetos Date
        const formattedLogs = parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }))
        setPermissionLogs(formattedLogs)
      } catch (error) {
        console.error("Erro ao carregar logs de permissões:", error)
      }
    }
  }, [])

  // Salvar logs no localStorage quando mudar
  useEffect(() => {
    if (permissionLogs.length > 0) {
      localStorage.setItem("permissionLogs", JSON.stringify(permissionLogs))
    }
  }, [permissionLogs])

  // Filtrar usuários com base no termo de pesquisa
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Adicionar log de alteração de permissão
  const addPermissionLog = (
    userId: string,
    username: string,
    action: "add" | "remove",
    permissionType: "individual" | "group",
    permissionName: string,
  ) => {
    const newLog: PermissionLog = {
      id: `log-${Date.now()}`,
      userId,
      username,
      action,
      permissionType,
      permissionName,
      timestamp: new Date(),
      adminUsername: currentUser?.username || "sistema",
    }
    setPermissionLogs([newLog, ...permissionLogs])
  }

  // Verificar se uma permissão está incluída nas permissões padrão da função
  const isPermissionInRole = (permission: PermissionType) => {
    if (!selectedUser) return false
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[selectedUser.role] || []
    return rolePermissions.includes(permission)
  }

  // Verificar se uma permissão individual está atribuída ao usuário
  const hasIndividualPermission = (permission: PermissionType) => {
    if (!selectedUser) return false
    return selectedUser.permissions?.includes(permission) || false
  }

  // Verificar se um grupo de permissões está atribuído ao usuário
  const hasPermissionGroup = (groupId: string) => {
    if (!selectedUser) return false
    return selectedUser.permissionGroups?.includes(groupId) || false
  }

  // Alternar permissão individual
  const toggleIndividualPermission = (permission: PermissionType) => {
    if (!selectedUser) return

    const updatedUser = { ...selectedUser }

    // Inicializar o array de permissões se não existir
    if (!updatedUser.permissions) {
      updatedUser.permissions = []
    }

    // Verificar se a permissão já existe
    const hasPermission = updatedUser.permissions.includes(permission)

    if (hasPermission) {
      // Remover a permissão
      updatedUser.permissions = updatedUser.permissions.filter((p) => p !== permission)
      addPermissionLog(selectedUser.id, selectedUser.username, "remove", "individual", permission)
    } else {
      // Adicionar a permissão
      updatedUser.permissions = [...updatedUser.permissions, permission]
      addPermissionLog(selectedUser.id, selectedUser.username, "add", "individual", permission)
    }

    // Atualizar o usuário
    updateUser(updatedUser)
    setSelectedUser(updatedUser)

    toast({
      title: hasPermission ? "Permissão removida" : "Permissão adicionada",
      description: `A permissão ${permission} foi ${hasPermission ? "removida de" : "adicionada a"} ${selectedUser.username}`,
    })
  }

  // Alternar grupo de permissões
  const togglePermissionGroup = (groupId: string) => {
    if (!selectedUser) return

    const updatedUser = { ...selectedUser }

    // Inicializar o array de grupos de permissões se não existir
    if (!updatedUser.permissionGroups) {
      updatedUser.permissionGroups = []
    }

    // Verificar se o grupo já existe
    const hasGroup = updatedUser.permissionGroups.includes(groupId)

    // Encontrar o nome do grupo para o log
    const groupName = PREDEFINED_PERMISSION_GROUPS.find((g) => g.id === groupId)?.name || groupId

    if (hasGroup) {
      // Remover o grupo
      updatedUser.permissionGroups = updatedUser.permissionGroups.filter((g) => g !== groupId)
      addPermissionLog(selectedUser.id, selectedUser.username, "remove", "group", groupName)
    } else {
      // Adicionar o grupo
      updatedUser.permissionGroups = [...updatedUser.permissionGroups, groupId]
      addPermissionLog(selectedUser.id, selectedUser.username, "add", "group", groupName)
    }

    // Atualizar o usuário
    updateUser(updatedUser)
    setSelectedUser(updatedUser)

    toast({
      title: hasGroup ? "Grupo removido" : "Grupo adicionado",
      description: `O grupo ${groupName} foi ${hasGroup ? "removido de" : "adicionado a"} ${selectedUser.username}`,
    })
  }

  // Agrupar permissões por categoria
  const permissionCategories = {
    view: DEFAULT_ROLE_PERMISSIONS.admin.filter((p) => p.startsWith("view_")),
    edit: DEFAULT_ROLE_PERMISSIONS.admin.filter((p) => p.startsWith("edit_")),
    approve: DEFAULT_ROLE_PERMISSIONS.admin.filter((p) => p.startsWith("approve_")),
    manage: DEFAULT_ROLE_PERMISSIONS.admin.filter((p) => p.startsWith("manage_")),
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Sistema de Permissões</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Usuários */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>Selecione um usuário para gerenciar suas permissões</CardDescription>
            <Input
              placeholder="Pesquisar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant={selectedUser?.id === user.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex flex-col items-start">
                      <span>{user.fullName}</span>
                      <span className="text-xs text-muted-foreground">{user.role}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Gerenciamento de Permissões */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{selectedUser ? `Permissões de ${selectedUser.fullName}` : "Selecione um usuário"}</CardTitle>
            <CardDescription>
              {selectedUser
                ? `Gerencie as permissões para ${selectedUser.username} (${selectedUser.role})`
                : "Selecione um usuário da lista para gerenciar suas permissões"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="individual">Permissões Individuais</TabsTrigger>
                  <TabsTrigger value="groups">Grupos de Permissões</TabsTrigger>
                  <TabsTrigger value="logs">Logs de Alterações</TabsTrigger>
                </TabsList>

                <TabsContent value="individual">
                  <div className="space-y-6">
                    {/* Permissões de Visualização */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">Permissões de Visualização</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissionCategories.view.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={hasIndividualPermission(permission as PermissionType)}
                              disabled={isPermissionInRole(permission as PermissionType)}
                              onCheckedChange={() => toggleIndividualPermission(permission as PermissionType)}
                            />
                            <Label
                              htmlFor={permission}
                              className={
                                isPermissionInRole(permission as PermissionType) ? "text-muted-foreground" : ""
                              }
                            >
                              {permission.replace("view_", "").replace(/_/g, " ")}
                              {isPermissionInRole(permission as PermissionType) && " (pela função)"}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Permissões de Edição */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">Permissões de Edição</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissionCategories.edit.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={hasIndividualPermission(permission as PermissionType)}
                              disabled={isPermissionInRole(permission as PermissionType)}
                              onCheckedChange={() => toggleIndividualPermission(permission as PermissionType)}
                            />
                            <Label
                              htmlFor={permission}
                              className={
                                isPermissionInRole(permission as PermissionType) ? "text-muted-foreground" : ""
                              }
                            >
                              {permission.replace("edit_", "").replace(/_/g, " ")}
                              {isPermissionInRole(permission as PermissionType) && " (pela função)"}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Permissões de Aprovação */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">Permissões de Aprovação</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissionCategories.approve.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={hasIndividualPermission(permission as PermissionType)}
                              disabled={isPermissionInRole(permission as PermissionType)}
                              onCheckedChange={() => toggleIndividualPermission(permission as PermissionType)}
                            />
                            <Label
                              htmlFor={permission}
                              className={
                                isPermissionInRole(permission as PermissionType) ? "text-muted-foreground" : ""
                              }
                            >
                              {permission.replace("approve_", "").replace(/_/g, " ")}
                              {isPermissionInRole(permission as PermissionType) && " (pela função)"}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Permissões de Administração */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">Permissões de Administração</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissionCategories.manage.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={hasIndividualPermission(permission as PermissionType)}
                              disabled={isPermissionInRole(permission as PermissionType)}
                              onCheckedChange={() => toggleIndividualPermission(permission as PermissionType)}
                            />
                            <Label
                              htmlFor={permission}
                              className={
                                isPermissionInRole(permission as PermissionType) ? "text-muted-foreground" : ""
                              }
                            >
                              {permission.replace("manage_", "").replace(/_/g, " ")}
                              {isPermissionInRole(permission as PermissionType) && " (pela função)"}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="groups">
                  <div className="space-y-4">
                    {PREDEFINED_PERMISSION_GROUPS.map((group) => (
                      <Card key={group.id}>
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{group.name}</CardTitle>
                            <Checkbox
                              id={`group-${group.id}`}
                              checked={hasPermissionGroup(group.id)}
                              onCheckedChange={() => togglePermissionGroup(group.id)}
                            />
                          </div>
                          <CardDescription>{group.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Permissões incluídas: </span>
                            {group.permissions.map((p) => p.replace(/_/g, " ")).join(", ")}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="logs">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {permissionLogs
                        .filter((log) => log.userId === selectedUser.id)
                        .map((log) => (
                          <Card key={log.id}>
                            <CardContent className="py-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    {log.action === "add" ? "Adicionado" : "Removido"}:{" "}
                                    <span className="text-blue-600">
                                      {log.permissionType === "group" ? "Grupo " : ""}
                                      {log.permissionName}
                                    </span>
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Por: {log.adminUsername} em {log.timestamp.toLocaleString()}
                                  </p>
                                </div>
                                <div
                                  className={`px-2 py-1 rounded text-xs ${
                                    log.action === "add" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {log.action === "add" ? "Adicionado" : "Removido"}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                      {permissionLogs.filter((log) => log.userId === selectedUser.id).length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhuma alteração de permissão registrada para este usuário.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                Selecione um usuário para gerenciar suas permissões
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

