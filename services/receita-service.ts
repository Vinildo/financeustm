import { supabase } from "@/lib/supabase"
import { inMemoryStore } from "@/lib/in-memory-store"
import { v4 as uuidv4 } from "uuid"

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

      // Use local storage as primary storage method instead of trying Supabase first
      // This ensures we always have a working fallback
      const newReceita = {
        ...receita,
        id: receita.id || uuidv4(),
      }

      // Add to in-memory store first
      const addedReceita = inMemoryStore.addReceita(newReceita)
      console.log(`[ReceitaService] Receita adicionada com sucesso ao InMemoryStore:`, addedReceita)

      // Try to add to Supabase in the background, but don't wait for it
      try {
        // Format dates for Supabase
        const receitaData = {
          id: addedReceita.id,
          descricao: addedReceita.descricao,
          valor: addedReceita.valor,
          dataRecebimento: addedReceita.dataRecebimento ? new Date(addedReceita.dataRecebimento).toISOString() : null,
          dataPrevisao: addedReceita.dataPrevisao ? new Date(addedReceita.dataPrevisao).toISOString() : null,
          estado: addedReceita.estado || "prevista",
          metodo: addedReceita.metodo,
          categoria: addedReceita.categoria,
          observacoes: addedReceita.observacoes,
          documentoFiscal: addedReceita.documentoFiscal,
          cliente: addedReceita.cliente,
          reconciliado: addedReceita.reconciliado,
        }

        supabase
          .from("receitas")
          .insert(receitaData)
          .then(({ data, error }) => {
            if (error) {
              console.error("[ReceitaService] Erro ao sincronizar receita com Supabase:", error)
            } else {
              console.log("[ReceitaService] Receita sincronizada com Supabase:", data)
            }
          })
      } catch (supabaseError) {
        console.error("[ReceitaService] Erro ao tentar sincronizar com Supabase:", supabaseError)
        // Continue with local storage version, don't fail the operation
      }

      return addedReceita
    } catch (error) {
      console.error("[ReceitaService] Erro ao adicionar receita:", error)
      throw error
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

