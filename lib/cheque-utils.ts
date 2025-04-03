// Funções utilitárias para gerenciar cheques

// Tipo para representar um cheque
export interface Cheque {
  id: string
  numero: string
  valor: number
  beneficiario: string
  dataEmissao: Date
  dataPagamento?: Date
  estado: "emitido" | "compensado" | "cancelado"
  pagamentoId?: string
  pagamentoReferencia?: string
  fornecedorNome?: string
  observacoes?: string
  banco?: string
}

// Inicializar o sistema de cheques
export function inicializarSistemaCheques() {
  // Verificar se já existe a estrutura de cheques no localStorage
  const cheques = localStorage.getItem("cheques")
  if (!cheques) {
    // Inicializar com um array vazio
    localStorage.setItem("cheques", JSON.stringify([]))
  }
}

// Adicionar um novo cheque
export function adicionarCheque(cheque: Omit<Cheque, "id" | "estado">) {
  try {
    // Carregar cheques existentes
    const chequesString = localStorage.getItem("cheques")
    const cheques = chequesString
      ? JSON.parse(chequesString, (key, value) => {
          if (key === "dataEmissao" || key === "dataPagamento") {
            return new Date(value)
          }
          return value
        })
      : []

    // Verificar se já existe um cheque com o mesmo número
    const chequeExistente = cheques.find((c: Cheque) => c.numero === cheque.numero)
    if (chequeExistente) {
      console.warn("Já existe um cheque com este número:", cheque.numero)
      return chequeExistente
    }

    // Criar o novo cheque
    const novoCheque: Cheque = {
      id: `cheque-${Date.now()}`,
      estado: "emitido",
      ...cheque,
      dataEmissao: cheque.dataEmissao instanceof Date ? cheque.dataEmissao : new Date(cheque.dataEmissao),
    }

    // Adicionar à lista
    cheques.push(novoCheque)

    // Salvar no localStorage
    localStorage.setItem("cheques", JSON.stringify(cheques))

    return novoCheque
  } catch (error) {
    console.error("Erro ao adicionar cheque:", error)
    return null
  }
}

// Verificar se existe um cheque para um pagamento específico
export function verificarChequeExistente(pagamentoId: string) {
  try {
    // Carregar cheques existentes
    const chequesString = localStorage.getItem("cheques")
    if (!chequesString) return false

    const cheques = JSON.parse(chequesString, (key, value) => {
      if (key === "dataEmissao" || key === "dataPagamento") {
        return new Date(value)
      }
      return value
    })

    // Verificar se existe um cheque para este pagamento
    return cheques.some((c: Cheque) => c.pagamentoId === pagamentoId)
  } catch (error) {
    console.error("Erro ao verificar cheque existente:", error)
    return false
  }
}

// Remover a referência a um pagamento em um cheque
export function removerReferenciaChequePagamento(pagamentoId: string) {
  try {
    // Carregar cheques existentes
    const chequesString = localStorage.getItem("cheques")
    if (!chequesString) return false

    const cheques = JSON.parse(chequesString, (key, value) => {
      if (key === "dataEmissao" || key === "dataPagamento") {
        return new Date(value)
      }
      return value
    })

    // Encontrar o cheque associado a este pagamento
    const chequeIndex = cheques.findIndex((c: Cheque) => c.pagamentoId === pagamentoId)
    if (chequeIndex === -1) return false

    // Remover a referência ao pagamento
    cheques[chequeIndex].pagamentoId = undefined
    cheques[chequeIndex].pagamentoReferencia = undefined

    // Salvar no localStorage
    localStorage.setItem("cheques", JSON.stringify(cheques))

    return true
  } catch (error) {
    console.error("Erro ao remover referência de cheque a pagamento:", error)
    return false
  }
}

// Obter um cheque pelo ID
export function obterChequePorId(chequeId: string): Cheque | null {
  try {
    // Carregar cheques existentes
    const chequesString = localStorage.getItem("cheques")
    if (!chequesString) return null

    const cheques = JSON.parse(chequesString, (key, value) => {
      if (key === "dataEmissao" || key === "dataPagamento") {
        return new Date(value)
      }
      return value
    })

    // Encontrar o cheque pelo ID
    const cheque = cheques.find((c: Cheque) => c.id === chequeId)
    return cheque || null
  } catch (error) {
    console.error("Erro ao obter cheque por ID:", error)
    return null
  }
}

// Obter todos os cheques
export function obterTodosCheques(): Cheque[] {
  try {
    // Carregar cheques existentes
    const chequesString = localStorage.getItem("cheques")
    if (!chequesString) return []

    return JSON.parse(chequesString, (key, value) => {
      if (key === "dataEmissao" || key === "dataPagamento") {
        return new Date(value)
      }
      return value
    })
  } catch (error) {
    console.error("Erro ao obter todos os cheques:", error)
    return []
  }
}

// Atualizar o estado de um cheque
export function atualizarEstadoCheque(chequeId: string, novoEstado: "emitido" | "compensado" | "cancelado"): boolean {
  try {
    // Carregar cheques existentes
    const chequesString = localStorage.getItem("cheques")
    if (!chequesString) return false

    const cheques = JSON.parse(chequesString, (key, value) => {
      if (key === "dataEmissao" || key === "dataPagamento") {
        return new Date(value)
      }
      return value
    })

    // Encontrar o cheque pelo ID
    const chequeIndex = cheques.findIndex((c: Cheque) => c.id === chequeId)
    if (chequeIndex === -1) return false

    // Atualizar o estado
    cheques[chequeIndex].estado = novoEstado
    if (novoEstado === "compensado" && !cheques[chequeIndex].dataPagamento) {
      cheques[chequeIndex].dataPagamento = new Date()
    }

    // Salvar no localStorage
    localStorage.setItem("cheques", JSON.stringify(cheques))

    return true
  } catch (error) {
    console.error("Erro ao atualizar estado do cheque:", error)
    return false
  }
}

