// In-memory data store to replace Supabase
import { v4 as uuidv4 } from "uuid"

// Type definitions
type Fornecedor = {
  id: string
  nome: string
  pagamentos?: any[]
  created_at: string
}

type Pagamento = {
  id: string
  fornecedor_id: string
  referencia: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  estado: "pendente" | "pago" | "atrasado" | "cancelado"
  metodo: string
  departamento: string | null
  observacoes: string | null
  descricao: string | null
  tipo: string | null
  reconciliado: boolean
  workflow?: any
  fornecedorNome?: string
  created_at: string
}

type Receita = {
  id: string
  descricao: string
  valor: number
  data: string
  categoria: string
  fonte: string
  created_at: string
}

type FundoManeio = {
  id: string
  descricao: string
  valor_inicial: number
  valor_atual: number
  responsavel: string
  data_criacao: string
  created_at: string
}

type User = {
  id: string
  username: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  force_password_change: boolean
  permissions?: string[]
  permission_groups?: string[]
  created_at: string
}

type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  related_id?: string
  action_url?: string
  read: boolean
  created_at: string
}

// In-memory data store
class InMemoryStore {
  private fornecedores: Fornecedor[] = []
  private pagamentos: Pagamento[] = []
  private receitas: Receita[] = []
  private fundosManeio: FundoManeio[] = []
  private users: User[] = []
  private notifications: Notification[] = []
  private currentUser: User | null = null

  constructor() {
    // Initialize with some sample data
    this.initializeSampleData()
  }

  private initializeSampleData() {
    // Add a sample admin user
    const adminUser: User = {
      id: uuidv4(),
      username: "admin",
      full_name: "Administrator",
      email: "admin@example.com",
      role: "admin",
      is_active: true,
      force_password_change: false,
      permissions: ["all"],
      created_at: new Date().toISOString(),
    }
    this.users.push(adminUser)
    this.currentUser = adminUser

    // Add a sample supplier
    const fornecedor: Fornecedor = {
      id: uuidv4(),
      nome: "Fornecedor Exemplo",
      pagamentos: [],
      created_at: new Date().toISOString(),
    }
    this.fornecedores.push(fornecedor)

    // Add a sample payment
    const pagamento: Pagamento = {
      id: uuidv4(),
      fornecedor_id: fornecedor.id,
      referencia: "REF-001",
      valor: 1000,
      data_vencimento: new Date().toISOString().split("T")[0],
      data_pagamento: null,
      estado: "pendente",
      metodo: "transferência",
      departamento: "Financeiro",
      observacoes: "Pagamento de exemplo",
      descricao: "Serviços prestados",
      tipo: "despesa",
      reconciliado: false,
      created_at: new Date().toISOString(),
    }
    this.pagamentos.push(pagamento)

    // Add a sample revenue
    const receita: Receita = {
      id: uuidv4(),
      descricao: "Receita de exemplo",
      valor: 2000,
      data: new Date().toISOString().split("T")[0],
      categoria: "Vendas",
      fonte: "Cliente",
      created_at: new Date().toISOString(),
    }
    this.receitas.push(receita)
  }

  // Fornecedor methods
  getFornecedores(): Fornecedor[] {
    return [...this.fornecedores]
  }

  getFornecedorById(id: string): Fornecedor | undefined {
    console.log(`[InMemoryStore] Buscando fornecedor com ID ${id}...`)
    const fornecedor = this.fornecedores.find((f) => f.id === id)
    console.log(`[InMemoryStore] Fornecedor encontrado:`, fornecedor ? "Sim" : "Não")
    return fornecedor
  }

  addFornecedor(fornecedor: Fornecedor | { nome: string }): Fornecedor {
    console.log("[InMemoryStore] Adicionando fornecedor:", fornecedor)

    // Se já for um objeto Fornecedor completo
    if ("id" in fornecedor) {
      // Verificar se o fornecedor já existe
      const existingFornecedor = this.fornecedores.find((f) => f.id === fornecedor.id)
      if (existingFornecedor) {
        console.log(`[InMemoryStore] Fornecedor com ID ${fornecedor.id} já existe, retornando existente`)
        return existingFornecedor
      }

      // Adicionar o fornecedor completo
      const newFornecedor: Fornecedor = {
        ...fornecedor,
        pagamentos: fornecedor.pagamentos || [],
        created_at: fornecedor.created_at || new Date().toISOString(),
      }

      this.fornecedores.push(newFornecedor)
      console.log("[InMemoryStore] Fornecedor adicionado com sucesso:", newFornecedor)
      return newFornecedor
    }
    // Se for apenas um nome
    else {
      const newFornecedor: Fornecedor = {
        id: uuidv4(),
        nome: fornecedor.nome,
        pagamentos: [],
        created_at: new Date().toISOString(),
      }

      this.fornecedores.push(newFornecedor)
      console.log("[InMemoryStore] Fornecedor adicionado com sucesso:", newFornecedor)
      return newFornecedor
    }
  }

  updateFornecedor(id: string, nome: string): Fornecedor | null {
    const index = this.fornecedores.findIndex((f) => f.id === id)
    if (index === -1) return null

    this.fornecedores[index] = {
      ...this.fornecedores[index],
      nome,
    }

    return this.fornecedores[index]
  }

  deleteFornecedor(id: string): boolean {
    const initialLength = this.fornecedores.length
    this.fornecedores = this.fornecedores.filter((f) => f.id !== id)
    // Also delete all payments associated with this supplier
    this.pagamentos = this.pagamentos.filter((p) => p.fornecedor_id !== id)
    return this.fornecedores.length < initialLength
  }

  // Pagamento methods
  getPagamentos(): Pagamento[] {
    return [...this.pagamentos]
  }

  getPagamentosByFornecedor(fornecedorId: string): Pagamento[] {
    return this.pagamentos.filter((p) => p.fornecedor_id === fornecedorId)
  }

  getPagamentoById(id: string): Pagamento | undefined {
    return this.pagamentos.find((p) => p.id === id)
  }

  addPagamento(pagamento: Omit<Pagamento, "id" | "created_at">): Pagamento {
    console.log("[InMemoryStore] Adicionando pagamento:", pagamento)

    // Verificar se o fornecedor_id está presente
    if (!pagamento.fornecedor_id) {
      console.error("[InMemoryStore] fornecedor_id não fornecido no pagamento")
      throw new Error("fornecedor_id é obrigatório")
    }

    // Verificar se o fornecedor existe
    let fornecedor = this.fornecedores.find((f) => f.id === pagamento.fornecedor_id)

    // Se o fornecedor não existir, criar um novo
    if (!fornecedor) {
      console.log(
        `[InMemoryStore] Fornecedor com ID ${pagamento.fornecedor_id} não encontrado, criando novo fornecedor...`,
      )

      fornecedor = {
        id: pagamento.fornecedor_id,
        nome: pagamento.fornecedorNome || "Fornecedor Sem Nome",
        pagamentos: [],
        created_at: new Date().toISOString(),
      }

      this.fornecedores.push(fornecedor)
      console.log("[InMemoryStore] Novo fornecedor criado:", fornecedor)
    }

    // Criar o novo pagamento
    const newPagamento: Pagamento = {
      ...pagamento,
      id: pagamento.id || uuidv4(),
      created_at: new Date().toISOString(),
    }

    // Adicionar o pagamento à lista geral de pagamentos
    this.pagamentos.push(newPagamento)

    // Adicionar o pagamento à lista de pagamentos do fornecedor
    if (!fornecedor.pagamentos) {
      fornecedor.pagamentos = []
    }
    fornecedor.pagamentos.push(newPagamento)

    console.log("[InMemoryStore] Pagamento adicionado com sucesso:", newPagamento)
    return newPagamento
  }

  updatePagamento(id: string, pagamento: Partial<Pagamento>): Pagamento | null {
    console.log(`[InMemoryStore] Atualizando pagamento com ID ${id}...`, pagamento)

    // Primeiro, verificar se o pagamento existe na lista principal
    const pagamentoIndex = this.pagamentos.findIndex((p) => p.id === id)

    if (pagamentoIndex === -1) {
      console.error(`[InMemoryStore] Pagamento com ID ${id} não encontrado na lista principal`)

      // Tentar encontrar o pagamento nas listas de pagamentos dos fornecedores
      for (const fornecedor of this.fornecedores) {
        if (!fornecedor.pagamentos) continue

        const pagamentoFornecedor = fornecedor.pagamentos.find((p) => p.id === id)
        if (pagamentoFornecedor) {
          console.log(`[InMemoryStore] Pagamento encontrado no fornecedor ${fornecedor.id}`)

          // Adicionar o pagamento à lista principal
          this.pagamentos.push(pagamentoFornecedor)

          // Atualizar o pagamento
          const updatedPagamento = {
            ...pagamentoFornecedor,
            ...pagamento,
            id: id, // Garantir que o ID não seja alterado
          }

          // Atualizar na lista do fornecedor
          const pagamentoFornecedorIndex = fornecedor.pagamentos.findIndex((p) => p.id === id)
          fornecedor.pagamentos[pagamentoFornecedorIndex] = updatedPagamento

          // Atualizar na lista principal (agora que foi adicionado)
          const newIndex = this.pagamentos.length - 1
          this.pagamentos[newIndex] = updatedPagamento

          console.log(`[InMemoryStore] Pagamento atualizado com sucesso:`, updatedPagamento)
          return updatedPagamento
        }
      }

      console.error(`[InMemoryStore] Pagamento com ID ${id} não encontrado em nenhum fornecedor`)
      return null
    }

    // Preservar o ID e outros campos obrigatórios
    const updatedPagamento = {
      ...this.pagamentos[pagamentoIndex],
      ...pagamento,
      id: id, // Garantir que o ID não seja alterado
    }

    // Atualizar o pagamento na lista principal
    this.pagamentos[pagamentoIndex] = updatedPagamento

    // Atualizar o pagamento na lista do fornecedor
    const fornecedorId = updatedPagamento.fornecedor_id
    if (fornecedorId) {
      const fornecedor = this.fornecedores.find((f) => f.id === fornecedorId)
      if (fornecedor && fornecedor.pagamentos) {
        const pagamentoIndex = fornecedor.pagamentos.findIndex((p) => p.id === id)
        if (pagamentoIndex !== -1) {
          fornecedor.pagamentos[pagamentoIndex] = updatedPagamento
        } else {
          fornecedor.pagamentos.push(updatedPagamento)
        }
      }
    }

    console.log(`[InMemoryStore] Pagamento atualizado com sucesso:`, updatedPagamento)
    return updatedPagamento
  }

  deletePagamento(id: string): boolean {
    const initialLength = this.pagamentos.length
    this.pagamentos = this.pagamentos.filter((p) => p.id !== id)

    // Também remover o pagamento da lista de pagamentos do fornecedor
    for (const fornecedor of this.fornecedores) {
      if (fornecedor.pagamentos) {
        const initialFornecedorPagamentosLength = fornecedor.pagamentos.length
        fornecedor.pagamentos = fornecedor.pagamentos.filter((p) => p.id !== id)
        if (fornecedor.pagamentos.length < initialFornecedorPagamentosLength) {
          console.log(`[InMemoryStore] Pagamento removido do fornecedor ${fornecedor.id}`)
        }
      }
    }

    return this.pagamentos.length < initialLength
  }

  // Receita methods
  getReceitas(): Receita[] {
    try {
      const storedReceitas = localStorage.getItem("receitas")
      return storedReceitas ? JSON.parse(storedReceitas) : []
    } catch (error) {
      console.error("Erro ao carregar receitas do localStorage:", error)
      return []
    }
  }

  getReceitaById(id: string): Receita | undefined {
    try {
      const receitas = this.getReceitas()
      const receita = (receitas as Receita[]).find((r: Receita) => r.id === id)
      return receita || undefined
    } catch (error) {
      console.error(`Erro ao buscar receita com ID ${id}:`, error)
      return undefined
    }
  }

  addReceita(receita: Omit<Receita, "id" | "created_at">): Receita {
    try {
      const receitas = this.getReceitas()
      const newReceita = { ...receita, id: uuidv4(), created_at: new Date().toISOString() }

      // Add to the list
      const updatedReceitas = [...(receitas as Receita[]), newReceita]

      // Save to localStorage
      localStorage.setItem("receitas", JSON.stringify(updatedReceitas))

      return newReceita
    } catch (error) {
      console.error("Erro ao adicionar receita ao localStorage:", error)
      throw error
    }
  }

  updateReceita(id: string, receita: Partial<Receita>): Receita | null {
    try {
      const receitas = this.getReceitas()
      const index = (receitas as Receita[]).findIndex((r: Receita) => r.id === id)

      if (index === -1) return null

      const updatedReceita = ({ ...(receitas as Receita[])[index], ...receita }(receitas as Receita[])[index] =
        updatedReceita)

      localStorage.setItem("receitas", JSON.stringify(receitas))

      return updatedReceita
    } catch (error) {
      console.error(`Erro ao atualizar receita com ID ${id}:`, error)
      throw error
    }
  }

  deleteReceita(id: string): boolean {
    try {
      const receitas = this.getReceitas()
      const updatedReceitas = (receitas as Receita[]).filter((r: Receita) => r.id !== id)

      if (updatedReceitas.length === (receitas as Receita[]).length) {
        return false // Nothing was deleted
      }

      localStorage.setItem("receitas", JSON.stringify(updatedReceitas))

      return true
    } catch (error) {
      console.error(`Erro ao excluir receita com ID ${id}:`, error)
      throw error
    }
  }

  // User methods
  getUsers(): User[] {
    return [...this.users]
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id)
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username === username)
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  login(username: string, password: string): User | null {
    // Simple mock login - in a real app, you'd verify the password
    const user = this.getUserByUsername(username)
    if (user) {
      this.currentUser = user
      return user
    }
    return null
  }

  logout(): void {
    this.currentUser = null
  }

  // Notification methods
  getNotifications(userId: string): Notification[] {
    return this.notifications.filter((n) => n.user_id === userId)
  }

  addNotification(notification: Omit<Notification, "id" | "created_at">): Notification {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    }
    this.notifications.push(newNotification)
    return newNotification
  }

  markNotificationAsRead(id: string): boolean {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      return true
    }
    return false
  }
}

// Create and export a singleton instance
export const inMemoryStore = new InMemoryStore()

