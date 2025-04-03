// Funções utilitárias para gerenciar transações bancárias

// Inicializar o sistema bancário
export function inicializarSistemaBanco() {
  // Verificar se já existe a estrutura de transações bancárias no localStorage
  const transacoes = localStorage.getItem("transacoesBancarias")
  if (!transacoes) {
    // Inicializar com um array vazio
    localStorage.setItem("transacoesBancarias", JSON.stringify([]))
  }
}

// Tipo para representar uma transação bancária
export interface TransacaoBancaria {
  id: string
  data: Date
  descricao: string
  valor: number
  tipo: "credito" | "debito"
  reconciliado: boolean
  pagamentoId?: string
  chequeId?: string
  chequeNumero?: string
  metodo?: string
  origem?: string
  observacoes?: string
  referencia?: string
}

// Adicionar uma nova transação bancária
export function adicionarTransacaoBancaria(transacao: Omit<TransacaoBancaria, "id">) {
  try {
    // Carregar transações existentes
    const transacoesString = localStorage.getItem("transacoesBancarias")
    const transacoes = transacoesString
      ? JSON.parse(transacoesString, (key, value) => {
          if (key === "data") {
            return new Date(value)
          }
          return value
        })
      : []

    // Criar a nova transação
    const novaTransacao: TransacaoBancaria = {
      id: `trans-${Date.now()}`,
      ...transacao,
      data: transacao.data instanceof Date ? transacao.data : new Date(transacao.data),
    }

    // Adicionar à lista
    transacoes.push(novaTransacao)

    // Salvar no localStorage
    localStorage.setItem("transacoesBancarias", JSON.stringify(transacoes))

    return true
  } catch (error) {
    console.error("Erro ao adicionar transação bancária:", error)
    return false
  }
}

// Obter todas as transações bancárias
export function obterTodasTransacoesBancarias(): TransacaoBancaria[] {
  try {
    // Carregar transações existentes
    const transacoesString = localStorage.getItem("transacoesBancarias")
    if (!transacoesString) return []

    return JSON.parse(transacoesString, (key, value) => {
      if (key === "data") {
        return new Date(value)
      }
      return value
    })
  } catch (error) {
    console.error("Erro ao obter todas as transações bancárias:", error)
    return []
  }
}

// Marcar uma transação como reconciliada
export function marcarTransacaoComoReconciliada(transacaoId: string, reconciliada = true): boolean {
  try {
    // Carregar transações existentes
    const transacoesString = localStorage.getItem("transacoesBancarias")
    if (!transacoesString) return false

    const transacoes = JSON.parse(transacoesString, (key, value) => {
      if (key === "data") {
        return new Date(value)
      }
      return value
    })

    // Encontrar a transação pelo ID
    const transacaoIndex = transacoes.findIndex((t: TransacaoBancaria) => t.id === transacaoId)
    if (transacaoIndex === -1) return false

    // Atualizar o estado de reconciliação
    transacoes[transacaoIndex].reconciliado = reconciliada

    // Salvar no localStorage
    localStorage.setItem("transacoesBancarias", JSON.stringify(transacoes))

    return true
  } catch (error) {
    console.error("Erro ao marcar transação como reconciliada:", error)
    return false
  }
}

// Remover uma transação bancária
export function removerTransacaoBancaria(transacaoId: string): boolean {
  try {
    // Carregar transações existentes
    const transacoesString = localStorage.getItem("transacoesBancarias")
    if (!transacoesString) return false

    const transacoes = JSON.parse(transacoesString, (key, value) => {
      if (key === "data") {
        return new Date(value)
      }
      return value
    })

    // Filtrar a transação a ser removida
    const novasTransacoes = transacoes.filter((t: TransacaoBancaria) => t.id !== transacaoId)

    // Verificar se alguma transação foi removida
    if (novasTransacoes.length === transacoes.length) return false

    // Salvar no localStorage
    localStorage.setItem("transacoesBancarias", JSON.stringify(novasTransacoes))

    return true
  } catch (error) {
    console.error("Erro ao remover transação bancária:", error)
    return false
  }
}

