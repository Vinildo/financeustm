// Funções utilitárias para gerenciar fundos de maneio

// Tipo para representar um fundo de maneio
export interface FundoManeio {
  id: string
  nome: string
  mes: Date // Mês de referência
  saldoInicial: number
  saldoFinal: number
  movimentos: Movimento[]
}

// Tipo para representar um movimento no fundo de maneio
export interface Movimento {
  id: string
  data: Date
  tipo: "entrada" | "saida"
  valor: number
  descricao: string
  pagamentoId?: string
  pagamentoReferencia?: string
  fornecedorNome?: string
}

// Inicializar o sistema de fundos de maneio
export function inicializarSistemaFundoManeio() {
  // Verificar se já existe a estrutura de fundos de maneio no localStorage
  const fundos = localStorage.getItem("fundosManeio")
  if (!fundos) {
    // Inicializar com um array vazio
    localStorage.setItem("fundosManeio", JSON.stringify([]))
  }
}

// Criar um novo fundo de maneio
export function criarFundoManeio(fundo: Omit<FundoManeio, "id" | "movimentos" | "saldoFinal">) {
  try {
    // Carregar fundos existentes
    const fundosString = localStorage.getItem("fundosManeio")
    const fundos = fundosString
      ? JSON.parse(fundosString, (key, value) => {
          if (key === "mes" || key === "data") {
            return new Date(value)
          }
          return value
        })
      : []

    // Criar o novo fundo
    const novoFundo: FundoManeio = {
      id: `fundo-${Date.now()}`,
      movimentos: [],
      saldoFinal: fundo.saldoInicial,
      ...fundo,
      mes: fundo.mes instanceof Date ? fundo.mes : new Date(fundo.mes),
    }

    // Adicionar à lista
    fundos.push(novoFundo)

    // Salvar no localStorage
    localStorage.setItem("fundosManeio", JSON.stringify(fundos))

    return novoFundo.id
  } catch (error) {
    console.error("Erro ao criar fundo de maneio:", error)
    return null
  }
}

// Adicionar um movimento a um fundo de maneio
export function adicionarMovimento(fundoId: string, movimento: Omit<Movimento, "id">) {
  try {
    // Carregar fundos existentes
    const fundosString = localStorage.getItem("fundosManeio")
    if (!fundosString) return null

    const fundos = JSON.parse(fundosString, (key, value) => {
      if (key === "mes" || key === "data") {
        return new Date(value)
      }
      return value
    })

    // Encontrar o fundo pelo ID
    const fundoIndex = fundos.findIndex((f: FundoManeio) => f.id === fundoId)
    if (fundoIndex === -1) return null

    // Criar o novo movimento
    const novoMovimento: Movimento = {
      id: `movimento-${Date.now()}`,
      ...movimento,
      data: movimento.data instanceof Date ? movimento.data : new Date(movimento.data),
    }

    // Adicionar o movimento ao fundo
    if (!fundos[fundoIndex].movimentos) {
      fundos[fundoIndex].movimentos = []
    }
    fundos[fundoIndex].movimentos.push(novoMovimento)

    // Atualizar o saldo final
    if (movimento.tipo === "entrada") {
      fundos[fundoIndex].saldoFinal += movimento.valor
    } else {
      fundos[fundoIndex].saldoFinal -= movimento.valor
    }

    // Salvar no localStorage
    localStorage.setItem("fundosManeio", JSON.stringify(fundos))

    return novoMovimento.id
  } catch (error) {
    console.error("Erro ao adicionar movimento ao fundo de maneio:", error)
    return null
  }
}

// Obter todos os fundos de maneio
export function obterTodosFundosManeio(): FundoManeio[] {
  try {
    // Carregar fundos existentes
    const fundosString = localStorage.getItem("fundosManeio")
    if (!fundosString) return []

    return JSON.parse(fundosString, (key, value) => {
      if (key === "mes" || key === "data") {
        return new Date(value)
      }
      return value
    })
  } catch (error) {
    console.error("Erro ao obter todos os fundos de maneio:", error)
    return []
  }
}

// Obter um fundo de maneio pelo ID
export function obterFundoManeioPorId(fundoId: string): FundoManeio | null {
  try {
    // Carregar fundos existentes
    const fundosString = localStorage.getItem("fundosManeio")
    if (!fundosString) return null

    const fundos = JSON.parse(fundosString, (key, value) => {
      if (key === "mes" || key === "data") {
        return new Date(value)
      }
      return value
    })

    // Encontrar o fundo pelo ID
    const fundo = fundos.find((f: FundoManeio) => f.id === fundoId)
    return fundo || null
  } catch (error) {
    console.error("Erro ao obter fundo de maneio por ID:", error)
    return null
  }
}

// Remover um movimento de um fundo de maneio
export function removerMovimento(fundoId: string, movimentoId: string): boolean {
  try {
    // Carregar fundos existentes
    const fundosString = localStorage.getItem("fundosManeio")
    if (!fundosString) return false

    const fundos = JSON.parse(fundosString, (key, value) => {
      if (key === "mes" || key === "data") {
        return new Date(value)
      }
      return value
    })

    // Encontrar o fundo pelo ID
    const fundoIndex = fundos.findIndex((f: FundoManeio) => f.id === fundoId)
    if (fundoIndex === -1) return false

    // Encontrar o movimento pelo ID
    const movimentoIndex = fundos[fundoIndex].movimentos.findIndex((m: Movimento) => m.id === movimentoId)
    if (movimentoIndex === -1) return false

    // Obter o movimento antes de removê-lo
    const movimento = fundos[fundoIndex].movimentos[movimentoIndex]

    // Atualizar o saldo final
    if (movimento.tipo === "entrada") {
      fundos[fundoIndex].saldoFinal -= movimento.valor
    } else {
      fundos[fundoIndex].saldoFinal += movimento.valor
    }

    // Remover o movimento
    fundos[fundoIndex].movimentos.splice(movimentoIndex, 1)

    // Salvar no localStorage
    localStorage.setItem("fundosManeio", JSON.stringify(fundos))

    return true
  } catch (error) {
    console.error("Erro ao remover movimento do fundo de maneio:", error)
    return false
  }
}

