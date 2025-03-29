"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { useAppContext } from "@/contexts/AppContext"
import type { User, UserRole } from "@/types/user"

export function UserManagement() {
  const { users, addUser, updateUser, deleteUser, currentUser, workflowConfig } = useAppContext()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "user" as UserRole,
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar usuários quando a lista de usuários ou o termo de pesquisa mudar
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username.toLowerCase().includes(lowerSearchTerm) ||
            user.fullName.toLowerCase().includes(lowerSearchTerm) ||
            (user.email && user.email.toLowerCase().includes(lowerSearchTerm)),
        ),
      )
    }
  }, [users, searchTerm])

  // Função para abrir o diálogo de adição de usuário
  const handleAddUser = () => {
    setNewUser({
      username: "",
      fullName: "",
      email: "",
      password: "",
      role: "user",
    })
    setIsAddDialogOpen(true)
  }

  // Função para abrir o diálogo de edição de usuário
  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setIsEditDialogOpen(true)
  }

  // Função para abrir o diálogo de exclusão de usuário
  const handleDeleteClick = (userId: string) => {
    setDeletingUserId(userId)
    setIsDeleteDialogOpen(true)
  }

  // Função para adicionar um novo usuário
  const handleAddUserSubmit = () => {
    // Validar campos obrigatórios
    if (!newUser.username || !newUser.fullName || !newUser.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Verificar se o nome de usuário já existe
    if (users.some((user) => user.username.toLowerCase() === newUser.username.toLowerCase())) {
      toast({
        title: "Nome de usuário já existe",
        description: "Por favor, escolha outro nome de usuário.",
        variant: "destructive",
      })
      return
    }

    // Verificar se o email já existe (se fornecido)
    if (newUser.email && users.some((user) => user.email && user.email.toLowerCase() === newUser.email.toLowerCase())) {
      toast({
        title: "Email já existe",
        description: "Este email já está associado a outro usuário.",
        variant: "destructive",
      })
      return
    }

    try {
      // Adicionar o novo usuário
      addUser({
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email || "",
        password: newUser.password,
        role: newUser.role,
      })

      // Fechar o diálogo
      setIsAddDialogOpen(false)

      // Mostrar mensagem de sucesso
      toast({
        title: "Usuário adicionado",
        description: `O usuário ${newUser.username} foi adicionado com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error)
      toast({
        title: "Erro ao adicionar usuário",
        description: "Ocorreu um erro ao adicionar o usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Função para editar um usuário existente
  const handleEditUser = () => {
    if (!editingUser) return

    // Validar campos obrigatórios
    if (!editingUser.username || !editingUser.fullName) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Verificar se o nome de usuário já existe (exceto para o usuário atual)
    if (
      users.some(
        (user) => user.id !== editingUser.id && user.username.toLowerCase() === editingUser.username.toLowerCase(),
      )
    ) {
      toast({
        title: "Nome de usuário já existe",
        description: "Por favor, escolha outro nome de usuário.",
        variant: "destructive",
      })
      return
    }

    // Verificar se o email já existe (exceto para o usuário atual)
    if (
      editingUser.email &&
      users.some(
        (user) =>
          user.id !== editingUser.id && user.email && user.email.toLowerCase() === editingUser.email.toLowerCase(),
      )
    ) {
      toast({
        title: "Email já existe",
        description: "Este email já está associado a outro usuário.",
        variant: "destructive",
      })
      return
    }

    try {
      // Atualizar o usuário
      updateUser(editingUser)

      // Fechar o diálogo
      setIsEditDialogOpen(false)

      // Mostrar mensagem de sucesso
      toast({
        title: "Usuário atualizado",
        description: `O usuário ${editingUser.username} foi atualizado com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast({
        title: "Erro ao atualizar usuário",
        description: "Ocorreu um erro ao atualizar o usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Função para excluir um usuário
  const handleDeleteUser = () => {
    if (!deletingUserId) return

    // Verificar se o usuário a ser excluído é o usuário atual
    if (currentUser && currentUser.id === deletingUserId) {
      toast({
        title: "Operação não permitida",
        description: "Você não pode excluir seu próprio usuário.",
        variant: "destructive",
      })
      setIsDeleteDialogOpen(false)
      return
    }

    // Verificar se o usuário está sendo usado no workflow
    const isUserInWorkflow = workflowConfig.steps.some((step) => {
      const userToDelete = users.find((u) => u.id === deletingUserId)
      return userToDelete && step.username === userToDelete.username
    })

    if (isUserInWorkflow) {
      toast({
        title: "Usuário em uso",
        description: "Este usuário está sendo usado no fluxo de aprovação. Remova-o do fluxo antes de excluí-lo.",
        variant: "destructive",
      })
      setIsDeleteDialogOpen(false)
      return
    }

    try {
      // Excluir o usuário
      deleteUser(deletingUserId)

      // Fechar o diálogo
      setIsDeleteDialogOpen(false)

      // Mostrar mensagem de sucesso
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
      toast({
        title: "Erro ao excluir usuário",
        description: "Ocorreu um erro ao excluir o usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
        <Button onClick={handleAddUser}>Adicionar Usuário</Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Pesquisar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-red-600">
            <tr>
              <th className="px-4 py-2 text-left text-white">Nome de Usuário</th>
              <th className="px-4 py-2 text-left text-white">Nome Completo</th>
              <th className="px-4 py-2 text-left text-white">Email</th>
              <th className="px-4 py-2 text-left text-white">Função</th>
              <th className="px-4 py-2 text-left text-white">Status</th>
              <th className="px-4 py-2 text-center text-white">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-2">{user.username}</td>
                <td className="px-4 py-2">{user.fullName}</td>
                <td className="px-4 py-2">{user.email || "-"}</td>
                <td className="px-4 py-2">
                  {user.role === "admin"
                    ? "Administrador"
                    : user.role === "financial_director"
                      ? "Diretor Financeiro"
                      : user.role === "rector"
                        ? "Reitor"
                        : "Usuário"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${
                      user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteClick(user.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-2 text-center text-gray-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Diálogo para adicionar usuário */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Usuário</DialogTitle>
            <DialogDescription>Preencha os campos abaixo para adicionar um novo usuário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário *</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função *</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="financial_director">Diretor Financeiro</SelectItem>
                  <SelectItem value="rector">Reitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUserSubmit}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Edite as informações do usuário abaixo.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Nome de Usuário *</Label>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Nome Completo *</Label>
                <Input
                  id="edit-fullName"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nova Senha (deixe em branco para manter a atual)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editingUser.password || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      password: e.target.value || editingUser.password,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Função *</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value as UserRole })}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="financial_director">Diretor Financeiro</SelectItem>
                    <SelectItem value="rector">Reitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={editingUser.isActive}
                  onCheckedChange={(checked) => setEditingUser({ ...editingUser, isActive: checked })}
                />
                <Label htmlFor="edit-isActive">Usuário Ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para excluir usuário */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

