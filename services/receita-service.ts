import { inMemoryStore } from "@/lib/in-memory-store"

export class ReceitaService {
  static async getReceitas() {
    try {
      const receitas = inMemoryStore.getReceitas()
      return { data: receitas, error: null }
    } catch (error) {
      console.error("Erro ao buscar receitas:", error)
      return { data: null, error }
    }
  }

  static async getReceitaById(id: string) {
    try {
      const receita = inMemoryStore.getReceitaById(id)
      return { data: receita || null, error: null }
    } catch (error) {
      console.error(`Erro ao buscar receita com ID ${id}:`, error)
      return { data: null, error }
    }
  }

  static async addReceita(receita: any) {
    try {
      const newReceita = inMemoryStore.addReceita(receita)
      return { data: newReceita, error: null }
    } catch (error) {
      console.error("Erro ao adicionar receita:", error)
      return { data: null, error }
    }
  }

  static async updateReceita(id: string, receita: any) {
    try {
      const updatedReceita = inMemoryStore.updateReceita(id, receita)
      if (!updatedReceita) {
        throw new Error(`Receita com ID ${id} não encontrada`)
      }
      return { data: updatedReceita, error: null }
    } catch (error) {
      console.error(`Erro ao atualizar receita com ID ${id}:`, error)
      return { data: null, error }
    }
  }

  static async deleteReceita(id: string) {
    try {
      const success = inMemoryStore.deleteReceita(id)
      if (!success) {
        throw new Error(`Receita com ID ${id} não encontrada`)
      }
      return { error: null }
    } catch (error) {
      console.error(`Erro ao excluir receita com ID ${id}:`, error)
      return { error }
    }
  }
}

