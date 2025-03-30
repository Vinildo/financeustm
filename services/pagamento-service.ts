import { supabase } from "@/lib/supabase"
import { inMemoryStore } from "@/lib/in-memory-store"
import { FornecedorService } from "./fornecedor-service"
import { v4 as uuidv4 } from "uuid"

export class PagamentoService {
  static async getPagamentos() {
    try {
      console.log("[PagamentoService] Buscando todos os pagamentos...")

      // Tentar buscar do Supabase primeiro
      const { data, error } = await supabase.from("pagamentos").select("*")

      if (error) {
        console.error("[PagamentoService] Erro ao buscar pagamentos do Supabase:", error)
        console.log("[PagamentoService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const pagamentos = inMemoryStore.getPagamentos()
        console.log("[PagamentoService] Pagamentos encontrados no InMemoryStore:", pagamentos.length)
        return { data: pagamentos, error: null }
      }

      console.log("[PagamentoService] Pagamentos encontrados no Supabase:", data.length)
      return { data, error: null }
    } catch (error) {
      console.error("[PagamentoService] Erro ao buscar pagamentos:", error)
      // Fallback para o InMemoryStore em caso de erro
      const pagamentos = inMemoryStore.getPagamentos()
      return { data: pagamentos, error: null }
    }
  }

  static async getPagamentosByFornecedor(fornecedorId: string) {
    try {
      console.log(`[PagamentoService] Buscando pagamentos do fornecedor ${fornecedorId}...`)

      // Tentar buscar do Supabase primeiro
      const { data, error } = await supabase.from("pagamentos").select("*").eq("fornecedor_id", fornecedorId)

      if (error) {
        console.error(`[PagamentoService] Erro ao buscar pagamentos do fornecedor ${fornecedorId} do Supabase:`, error)
        console.log("[PagamentoService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const pagamentos = inMemoryStore.getPagamentosByFornecedor(fornecedorId)
        console.log(
          `[PagamentoService] Pagamentos encontrados para o fornecedor ${fornecedorId} no InMemoryStore:`,
          pagamentos.length,
        )
        return { data: pagamentos, error: null }
      }

      console.log(
        `[PagamentoService] Pagamentos encontrados para o fornecedor ${fornecedorId} no Supabase:`,
        data.length,
      )
      return { data, error: null }
    } catch (error) {
      console.error(`[PagamentoService] Erro ao buscar pagamentos do fornecedor ${fornecedorId}:`, error)
      // Fallback para o InMemoryStore em caso de erro
      const pagamentos = inMemoryStore.getPagamentosByFornecedor(fornecedorId)
      return { data: pagamentos, error: null }
    }
  }

  static async getPagamentoById(id: string) {
    try {
      console.log(`[PagamentoService] Buscando pagamento com ID ${id}...`)

      // Tentar buscar do Supabase primeiro
      const { data, error } = await supabase.from("pagamentos").select("*").eq("id", id).single()

      if (error) {
        console.error(`[PagamentoService] Erro ao buscar pagamento com ID ${id} do Supabase:`, error)
        console.log("[PagamentoService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const pagamento = inMemoryStore.getPagamentoById(id)
        console.log(`[PagamentoService] Pagamento encontrado no InMemoryStore:`, pagamento ? "Sim" : "Não")
        return { data: pagamento || null, error: null }
      }

      console.log(`[PagamentoService] Pagamento encontrado no Supabase:`, data ? "Sim" : "Não")
      return { data, error: null }
    } catch (error) {
      console.error(`[PagamentoService] Erro ao buscar pagamento com ID ${id}:`, error)
      // Fallback para o InMemoryStore em caso de erro
      const pagamento = inMemoryStore.getPagamentoById(id)
      return { data: pagamento || null, error: null }
    }
  }

  static async addPagamento(fornecedorId: string, pagamento: any) {
    try {
      console.log(`[PagamentoService] Adicionando pagamento para o fornecedor ${fornecedorId}...`)
      console.log(`[PagamentoService] Dados do pagamento:`, pagamento)

      // Verificar se o fornecedorId está presente
      if (!fornecedorId) {
        console.error("[PagamentoService] fornecedorId não fornecido")
        throw new Error("fornecedorId é obrigatório")
      }

      // Verificar se o pagamento está presente
      if (!pagamento) {
        console.error("[PagamentoService] pagamento não fornecido")
        throw new Error("pagamento é obrigatório")
      }

      // Verificar se o fornecedor existe, se não existir, criar um novo
      let fornecedor = await FornecedorService.getFornecedorById(fornecedorId)
      if (!fornecedor) {
        console.log(`[PagamentoService] Fornecedor com ID ${fornecedorId} não encontrado, criando novo fornecedor...`)
        fornecedor = await FornecedorService.addFornecedor({
          id: fornecedorId,
          nome: pagamento.fornecedorNome || "Fornecedor Sem Nome",
          pagamentos: [],
        })
        console.log(`[PagamentoService] Novo fornecedor criado:`, fornecedor)
      }

      // Preparar o pagamento para inserção no Supabase
      const pagamentoData = {
        id: pagamento.id || `pagamento-${Date.now()}`,
        fornecedor_id: fornecedorId,
        descricao: pagamento.descricao,
        valor: pagamento.valor,
        data: pagamento.data,
        metodo: pagamento.metodo || "transferência",
        status: pagamento.status || "pendente",
        comprovante_url: pagamento.comprovante_url,
        notas: pagamento.notas,
      }

      // Tentar adicionar ao Supabase primeiro
      const { data, error } = await supabase.from("pagamentos").insert(pagamentoData).select().single()

      if (error) {
        console.error("[PagamentoService] Erro ao adicionar pagamento ao Supabase:", error)
        console.log("[PagamentoService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const newPagamento = inMemoryStore.addPagamento({
          ...pagamento,
          fornecedor_id: fornecedorId,
        })
        console.log(`[PagamentoService] Pagamento adicionado com sucesso ao InMemoryStore:`, newPagamento)
        return { data: newPagamento, error: null }
      }

      // Se o pagamento tiver workflow, adicionar ao Supabase
      if (pagamento.workflow) {
        const workflowData = {
          id: uuidv4(),
          pagamento_id: data.id,
          status: pagamento.workflow.status || "in_progress",
          current_step: pagamento.workflow.currentStep || 0,
        }

        const { data: workflowResult, error: workflowError } = await supabase
          .from("workflow")
          .insert(workflowData)
          .select()
          .single()

        if (!workflowError && workflowResult && pagamento.workflow.steps) {
          // Adicionar os passos do workflow
          for (let i = 0; i < pagamento.workflow.steps.length; i++) {
            const step = pagamento.workflow.steps[i]
            await supabase.from("workflow_steps").insert({
              id: step.id || uuidv4(),
              workflow_id: workflowResult.id,
              step_number: i,
              role: step.role,
              username: step.username,
              status: step.status || "pending",
            })
          }
        }
      }

      console.log("[PagamentoService] Pagamento adicionado com sucesso ao Supabase:", data)
      return { data, error: null }
    } catch (error) {
      console.error("[PagamentoService] Erro ao adicionar pagamento:", error)
      // Fallback para o InMemoryStore em caso de erro
      try {
        const newPagamento = inMemoryStore.addPagamento({
          ...pagamento,
          fornecedor_id: fornecedorId,
        })
        return { data: newPagamento, error: null }
      } catch (fallbackError) {
        console.error("[PagamentoService] Erro no fallback para InMemoryStore:", fallbackError)
        return { data: null, error: fallbackError }
      }
    }
  }

  static async updatePagamento(fornecedorId: string, pagamento: any) {
    try {
      console.log(`[PagamentoService] Atualizando pagamento com ID ${pagamento.id}...`)
      console.log(`[PagamentoService] Fornecedor ID: ${fornecedorId}`)
      console.log(`[PagamentoService] Dados do pagamento:`, pagamento)

      // Verificar se o pagamento tem um ID
      if (!pagamento.id) {
        console.error("[PagamentoService] ID do pagamento não fornecido")
        throw new Error("ID do pagamento é obrigatório")
      }

      // Verificar se o método de pagamento está definido
      if (!pagamento.metodo) {
        console.warn("[PagamentoService] Método de pagamento não definido, usando valor padrão")
        pagamento.metodo = "transferência"
      }

      // Preparar o pagamento para atualização no Supabase
      const pagamentoData = {
        fornecedor_id: fornecedorId,
        descricao: pagamento.descricao,
        valor: pagamento.valor,
        data: pagamento.data,
        metodo: pagamento.metodo,
        status: pagamento.status,
        comprovante_url: pagamento.comprovante_url,
        notas: pagamento.notas,
      }

      // Tentar atualizar no Supabase primeiro
      const { data, error } = await supabase
        .from("pagamentos")
        .update(pagamentoData)
        .match({ id: pagamento.id })
        .select()
        .single()

      if (error) {
        console.error(`[PagamentoService] Erro ao atualizar pagamento com ID ${pagamento.id} no Supabase:`, error)
        console.log("[PagamentoService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const updatedPagamento = inMemoryStore.updatePagamento(pagamento.id, {
          ...pagamento,
          fornecedor_id: fornecedorId,
        })

        if (!updatedPagamento) {
          throw new Error(`Pagamento com ID ${pagamento.id} não encontrado`)
        }

        console.log(`[PagamentoService] Pagamento atualizado com sucesso no InMemoryStore:`, updatedPagamento)
        return { data: updatedPagamento, error: null }
      }

      // Se o pagamento tiver workflow, atualizar no Supabase
      if (pagamento.workflow) {
        // Verificar se o workflow já existe
        const { data: existingWorkflow, error: workflowQueryError } = await supabase
          .from("workflow")
          .select("id")
          .eq("pagamento_id", pagamento.id)
          .single()

        if (workflowQueryError && !workflowQueryError.message.includes("No rows found")) {
          console.error(`[PagamentoService] Erro ao verificar workflow existente:`, workflowQueryError)
        }

        if (existingWorkflow) {
          // Atualizar workflow existente
          await supabase
            .from("workflow")
            .update({
              status: pagamento.workflow.status,
              current_step: pagamento.workflow.currentStep,
            })
            .eq("id", existingWorkflow.id)

          // Atualizar os passos do workflow
          if (pagamento.workflow.steps) {
            for (const step of pagamento.workflow.steps) {
              // Verificar se o passo já existe
              const { data: existingStep } = await supabase
                .from("workflow_steps")
                .select("id")
                .eq("workflow_id", existingWorkflow.id)
                .eq("step_number", step.stepNumber || 0)
                .single()

              if (existingStep) {
                // Atualizar passo existente
                await supabase
                  .from("workflow_steps")
                  .update({
                    role: step.role,
                    username: step.username,
                    status: step.status,
                  })
                  .eq("id", existingStep.id)
              } else {
                // Adicionar novo passo
                await supabase.from("workflow_steps").insert({
                  id: step.id || uuidv4(),
                  workflow_id: existingWorkflow.id,
                  step_number: step.stepNumber || 0,
                  role: step.role,
                  username: step.username,
                  status: step.status || "pending",
                })
              }
            }
          }
        } else {
          // Criar novo workflow
          const workflowData = {
            id: uuidv4(),
            pagamento_id: pagamento.id,
            status: pagamento.workflow.status || "in_progress",
            current_step: pagamento.workflow.currentStep || 0,
          }

          const { data: newWorkflow, error: workflowError } = await supabase
            .from("workflow")
            .insert(workflowData)
            .select()
            .single()

          if (!workflowError && newWorkflow && pagamento.workflow.steps) {
            // Adicionar os passos do workflow
            for (let i = 0; i < pagamento.workflow.steps.length; i++) {
              const step = pagamento.workflow.steps[i]
              await supabase.from("workflow_steps").insert({
                id: step.id || uuidv4(),
                workflow_id: newWorkflow.id,
                step_number: i,
                role: step.role,
                username: step.username,
                status: step.status || "pending",
              })
            }
          }
        }
      }

      console.log(`[PagamentoService] Pagamento atualizado com sucesso no Supabase:`, data)
      return { data, error: null }
    } catch (error) {
      console.error(`[PagamentoService] Erro ao atualizar pagamento:`, error)
      // Fallback para o InMemoryStore em caso de erro
      try {
        const updatedPagamento = inMemoryStore.updatePagamento(pagamento.id, {
          ...pagamento,
          fornecedor_id: fornecedorId,
        })

        if (!updatedPagamento) {
          throw new Error(`Pagamento com ID ${pagamento.id} não encontrado`)
        }

        return { data: updatedPagamento, error: null }
      } catch (fallbackError) {
        console.error(`[PagamentoService] Erro no fallback para InMemoryStore:`, fallbackError)
        return { data: null, error: fallbackError }
      }
    }
  }

  static async deletePagamento(id: string) {
    try {
      console.log(`[PagamentoService] Excluindo pagamento com ID ${id}...`)

      // Tentar excluir do Supabase primeiro
      const { error } = await supabase.from("pagamentos").delete().eq("id", id)

      if (error) {
        console.error(`[PagamentoService] Erro ao excluir pagamento com ID ${id} do Supabase:`, error)
        console.log("[PagamentoService] Usando fallback para InMemoryStore...")
        // Fallback para o InMemoryStore
        const success = inMemoryStore.deletePagamento(id)
        if (!success) {
          throw new Error(`Pagamento com ID ${id} não encontrado`)
        }
        console.log(`[PagamentoService] Pagamento excluído com sucesso do InMemoryStore`)
        return { error: null }
      }

      console.log(`[PagamentoService] Pagamento excluído com sucesso do Supabase`)
      return { error: null }
    } catch (error) {
      console.error(`[PagamentoService] Erro ao excluir pagamento com ID ${id}:`, error)
      // Fallback para o InMemoryStore em caso de erro
      try {
        const success = inMemoryStore.deletePagamento(id)
        if (!success) {
          throw new Error(`Pagamento com ID ${id} não encontrado`)
        }
        return { error: null }
      } catch (fallbackError) {
        console.error(`[PagamentoService] Erro no fallback para InMemoryStore:`, fallbackError)
        return { error: fallbackError }
      }
    }
  }
}

