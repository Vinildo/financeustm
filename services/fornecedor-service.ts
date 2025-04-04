import { supabase } from "@/lib/supabase"
import { inMemoryStore } from "@/lib/in-memory-store"
import type { Fornecedor } from "@/types/fornecedor"
import { v4 as uuidv4 } from "uuid"

export class FornecedorService {
  static async getAllFornecedores() {
    try {
      console.log("[FornecedorService] Buscando todos os fornecedores...")

      // Tentar buscar do Supabase primeiro
      const { data, error } = await supabase.from("fornecedores").select(`
          id,
          nome,
          pagamentos (*)
        `)

      if (error) {
        console.error("[FornecedorService] Erro ao buscar fornecedores do Supabase:", error)
        console.log("[FornecedorService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const fornecedores = inMemoryStore.getFornecedores()
        console.log("[FornecedorService] Fornecedores encontrados no InMemoryStore:", fornecedores.length)
        return fornecedores
      }

      console.log("[FornecedorService] Fornecedores encontrados no Supabase:", data.length)
      return data as Fornecedor[]
    } catch (error) {
      console.error("[FornecedorService] Erro ao buscar fornecedores:", error)
      // Fallback para o InMemoryStore em caso de erro
      const fornecedores = inMemoryStore.getFornecedores()
      return fornecedores
    }
  }

  static async getFornecedorById(id: string) {
    try {
      console.log(`[FornecedorService] Buscando fornecedor com ID ${id}...`)

      // Tentar buscar do Supabase primeiro
      const { data, error } = await supabase
        .from("fornecedores")
        .select(`
         id,
         nome,
         pagamentos (*)
       `)
        .eq("id", id)
        .single()

      if (error) {
        console.error(`[FornecedorService] Erro ao buscar fornecedor com ID ${id} do Supabase:`, error)
        console.log("[FornecedorService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const fornecedor = inMemoryStore.getFornecedorById(id)
        console.log(`[FornecedorService] Fornecedor encontrado no InMemoryStore:`, fornecedor ? "Sim" : "Não")
        return fornecedor
      }

      console.log(`[FornecedorService] Fornecedor encontrado no Supabase:`, data ? "Sim" : "Não")
      return data || null // Return null if data is null
    } catch (error) {
      console.error(`[FornecedorService] Erro ao buscar fornecedor com ID ${id}:`, error)
      // Fallback para o InMemoryStore em caso de erro
      const fornecedor = inMemoryStore.getFornecedorById(id)
      return fornecedor
    }
  }

  static async addFornecedor(fornecedor: any) {
    try {
      console.log("[FornecedorService] Adicionando fornecedor:", fornecedor)

      // Verificar se o fornecedor já existe
      if (fornecedor.id) {
        const existingFornecedor = await this.getFornecedorById(fornecedor.id)
        if (existingFornecedor) {
          console.log(`[FornecedorService] Fornecedor com ID ${fornecedor.id} já existe, retornando existente`)
          return existingFornecedor
        }
      }

      // Preparar o fornecedor para inserção no Supabase
      // Verificar se o ID é um UUID válido, caso contrário, gerar um novo
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fornecedor.id || "")

      const fornecedorData = {
        id: isValidUUID ? fornecedor.id : uuidv4(),
        nome: fornecedor.nome || "Fornecedor Sem Nome",
      }

      // Armazenar o ID original para uso no InMemoryStore caso o Supabase falhe
      const originalId = fornecedor.id

      // Tentar adicionar ao Supabase primeiro
      const { data, error } = await supabase.from("fornecedores").insert(fornecedorData).select().single()

      if (error) {
        console.error("[FornecedorService] Erro ao adicionar fornecedor ao Supabase:", error)
        console.log("[FornecedorService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const fornecedorParaMemoria = {
          ...fornecedor,
          id: originalId || fornecedorData.id, // Usar o ID original se disponível, caso contrário usar o UUID gerado
        }
        const newFornecedor = inMemoryStore.addFornecedor(fornecedorParaMemoria)
        console.log("[FornecedorService] Fornecedor adicionado com sucesso ao InMemoryStore:", newFornecedor)
        return newFornecedor
      }

      // Se houver pagamentos, adicioná-los separadamente
      if (fornecedor.pagamentos && fornecedor.pagamentos.length > 0) {
        for (const pagamento of fornecedor.pagamentos) {
          await supabase.from("pagamentos").insert({
            ...pagamento,
            fornecedor_id: data.id,
          })
        }

        // Buscar o fornecedor completo com os pagamentos
        const { data: completeData } = await supabase
          .from("fornecedores")
          .select(`
            id,
            nome,
            pagamentos (*)
          `)
          .eq("id", data.id)
          .single()

        console.log("[FornecedorService] Fornecedor adicionado com sucesso ao Supabase:", completeData)
        return completeData as Fornecedor
      }

      // Retornar o fornecedor sem pagamentos
      const newFornecedor = {
        ...data,
        pagamentos: [],
      }

      console.log("[FornecedorService] Fornecedor adicionado com sucesso ao Supabase:", newFornecedor)
      return newFornecedor as Fornecedor
    } catch (error) {
      console.error("[FornecedorService] Erro ao adicionar fornecedor:", error)
      // Fallback para o InMemoryStore em caso de erro
      const newFornecedor = inMemoryStore.addFornecedor(fornecedor)
      return newFornecedor
    }
  }

  static async updateFornecedor(fornecedor: any) {
    try {
      console.log(`[FornecedorService] Atualizando fornecedor com ID ${fornecedor.id}...`)

      // Tentar atualizar no Supabase primeiro
      const { data, error } = await supabase
        .from("fornecedores")
        .update({ nome: fornecedor.nome })
        .eq("id", fornecedor.id)
        .select(`
          id,
          nome,
          pagamentos (*)
        `)
        .single()

      if (error) {
        console.error(`[FornecedorService] Erro ao atualizar fornecedor com ID ${fornecedor.id} no Supabase:`, error)
        console.log("[FornecedorService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const updatedFornecedor = inMemoryStore.updateFornecedor(fornecedor.id, fornecedor.nome)
        if (!updatedFornecedor) {
          throw new Error(`Fornecedor com ID ${fornecedor.id} não encontrado`)
        }
        console.log("[FornecedorService] Fornecedor atualizado com sucesso no InMemoryStore:", updatedFornecedor)
        return updatedFornecedor
      }

      console.log("[FornecedorService] Fornecedor atualizado com sucesso no Supabase:", data)
      return data as Fornecedor
    } catch (error) {
      console.error(`[FornecedorService] Erro ao atualizar fornecedor com ID ${fornecedor.id}:`, error)
      // Fallback para o InMemoryStore em caso de erro
      const updatedFornecedor = inMemoryStore.updateFornecedor(fornecedor.id, fornecedor.nome)
      if (!updatedFornecedor) {
        throw new Error(`Fornecedor com ID ${fornecedor.id} não encontrado`)
      }
      return updatedFornecedor
    }
  }

  static async deleteFornecedor(id: string) {
    try {
      console.log(`[FornecedorService] Excluindo fornecedor com ID ${id}...`)

      // Tentar excluir do Supabase primeiro
      const { error } = await supabase.from("fornecedores").delete().eq("id", id)

      if (error) {
        console.error(`[FornecedorService] Erro ao excluir fornecedor com ID ${id} do Supabase:`, error)
        console.log("[FornecedorService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const success = inMemoryStore.deleteFornecedor(id)
        if (!success) {
          throw new Error(`Fornecedor com ID ${id} não encontrado`)
        }
        console.log(`[FornecedorService] Fornecedor excluído com sucesso do InMemoryStore`)
        return true
      }

      console.log(`[FornecedorService] Fornecedor excluído com sucesso do Supabase`)
      return true
    } catch (error) {
      console.error(`[FornecedorService] Erro ao excluir fornecedor com ID ${id}:`, error)
      // Fallback para o InMemoryStore em caso de erro
      const success = inMemoryStore.deleteFornecedor(id)
      if (!success) {
        throw new Error(`Fornecedor com ID ${id} não encontrado`)
      }
      return success
    }
  }
}

