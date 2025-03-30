import { supabase } from "@/lib/supabase"
import { inMemoryStore } from "@/lib/in-memory-store"

export class ReceitaService {
  static async getReceitas() {
    try {
      console.log("[ReceitaService] Buscando todas as receitas...")

      // Tentar buscar do Supabase primeiro
      const { data, error } = await supabase.from("receitas").select("*")

      if (error) {
        console.error("[ReceitaService] Erro ao buscar receitas do Supabase:", error)
        console.log("[ReceitaService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const receitas = inMemoryStore.getReceitas()
        console.log("[ReceitaService] Receitas encontradas no InMemoryStore:", receitas.length)
        return { data: receitas, error: null }
      }

      console.log("[ReceitaService] Receitas encontradas no Supabase:", data.length)
      return { data, error: null }
    } catch (error) {
      console.error("[ReceitaService] Erro ao buscar receitas:", error)
      // Fallback para o InMemoryStore em caso de erro
      const receitas = inMemoryStore.getReceitas()
      return { data: receitas, error: null }
    }
  }

  static async getReceitaById(id: string) {
    try {
      console.log(`[ReceitaService] Buscando receita com ID ${id}...`)

      // Tentar buscar do Supabase primeiro
      const { data, error } = await supabase.from("receitas").select("*").eq("id", id).single()

      if (error) {
        console.error(`[ReceitaService] Erro ao buscar receita com ID ${id} do Supabase:`, error)
        console.log("[ReceitaService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const receita = inMemoryStore.getReceitaById(id)
        console.log(`[ReceitaService] Receita encontrada no InMemoryStore:`, receita ? "Sim" : "Não")
        return { data: receita || null, error: null }
      }

      console.log(`[ReceitaService] Receita encontrada no Supabase:`, data ? "Sim" : "Não")
      return { data, error: null }
    } catch (error) {
      console.error(`[ReceitaService] Erro ao buscar receita com ID ${id}:`, error)
      // Fallback para o InMemoryStore em caso de erro
      const receita = inMemoryStore.getReceitaById(id)
      return { data: receita || null, error: null }
    }
  }

  static async addReceita(receita: any) {
    try {
      console.log(`[ReceitaService] Adicionando receita...`)
      console.log(`[ReceitaService] Dados da receita:`, receita)

      // Garantir que a data está no formato correto para o Supabase
      let dataFormatada = receita.data
      if (typeof dataFormatada === "string" && !dataFormatada.includes("T")) {
        // Se for uma string de data sem hora, adicionar a parte da hora
        dataFormatada = new Date(dataFormatada).toISOString()
      }

      // Preparar a receita para inserção no Supabase
      const receitaData = {
        id: receita.id,
        referencia: receita.referencia,
        valor: receita.valor,
        data: dataFormatada,
        cliente: receita.cliente,
        observacoes: receita.observacoes,
        estado: receita.estado || "pendente",
      }

      // Tentar adicionar ao Supabase primeiro
      const { data, error } = await supabase.from("receitas").insert(receitaData).select().single()

      if (error) {
        console.error("[ReceitaService] Erro ao adicionar receita ao Supabase:", error)
        console.log("[ReceitaService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const newReceita = inMemoryStore.addReceita(receita)
        console.log(`[ReceitaService] Receita adicionada com sucesso ao InMemoryStore:`, newReceita)
        return { data: newReceita, error: null }
      }

      console.log("[ReceitaService] Receita adicionada com sucesso ao Supabase:", data)
      return { data, error: null }
    } catch (error) {
      console.error("[ReceitaService] Erro ao adicionar receita:", error)
      // Fallback para o InMemoryStore em caso de erro
      try {
        const newReceita = inMemoryStore.addReceita(receita)
        return { data: newReceita, error: null }
      } catch (fallbackError) {
        console.error("[ReceitaService] Erro no fallback para InMemoryStore:", fallbackError)
        return { data: null, error: fallbackError }
      }
    }
  }

  static async updateReceita(id: string, receita: any) {
    try {
      console.log(`[ReceitaService] Atualizando receita com ID ${id}...`)
      console.log(`[ReceitaService] Dados da receita:`, receita)

      // Preparar a receita para atualização no Supabase
      const receitaData = {
        referencia: receita.referencia,
        valor: receita.valor,
        data: receita.data,
        cliente: receita.cliente,
        observacoes: receita.observacoes,
      }

      // Tentar atualizar no Supabase primeiro
      const { data, error } = await supabase.from("receitas").update(receitaData).match({ id: id }).select().single()

      if (error) {
        console.error(`[ReceitaService] Erro ao atualizar receita com ID ${id} no Supabase:`, error)
        console.log("[ReceitaService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const updatedReceita = inMemoryStore.updateReceita(id, receita)

        if (!updatedReceita) {
          throw new Error(`Receita com ID ${id} não encontrada`)
        }

        console.log(`[ReceitaService] Receita atualizada com sucesso no InMemoryStore:`, updatedReceita)
        return { data: updatedReceita, error: null }
      }

      console.log(`[ReceitaService] Receita atualizada com sucesso no Supabase:`, data)
      return { data, error: null }
    } catch (error) {
      console.error(`[ReceitaService] Erro ao atualizar receita:`, error)
      // Fallback para o InMemoryStore em caso de erro
      try {
        const updatedReceita = inMemoryStore.updateReceita(id, receita)

        if (!updatedReceita) {
          throw new Error(`Receita com ID ${id} não encontrada`)
        }

        return { data: updatedReceita, error: null }
      } catch (fallbackError) {
        console.error(`[ReceitaService] Erro no fallback para InMemoryStore:`, fallbackError)
        return { data: null, error: fallbackError }
      }
    }
  }

  static async deleteReceita(id: string) {
    try {
      console.log(`[ReceitaService] Excluindo receita com ID ${id}...`)

      // Tentar excluir do Supabase primeiro
      const { error } = await supabase.from("receitas").delete().eq("id", id)

      if (error) {
        console.error(`[ReceitaService] Erro ao excluir receita com ID ${id} do Supabase:`, error)
        console.log("[ReceitaService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const success = inMemoryStore.deleteReceita(id)
        if (!success) {
          throw new Error(`Receita com ID ${id} não encontrada`)
        }
        console.log(`[ReceitaService] Receita excluída com sucesso do InMemoryStore`)
        return { error: null }
      }

      console.log(`[ReceitaService] Receita excluída com sucesso do Supabase`)
      return { error: null }
    } catch (error) {
      console.error(`[ReceitaService] Erro ao excluir receita com ID ${id}:`, error)
      // Fallback para o InMemoryStore em caso de erro
      try {
        const success = inMemoryStore.deleteReceita(id)
        if (!success) {
          throw new Error(`Receita com ID ${id} não encontrada`)
        }
        return { error: null }
      } catch (fallbackError) {
        console.error(`[ReceitaService] Erro no fallback para InMemoryStore:`, fallbackError)
        return { error: fallbackError }
      }
    }
  }
}

