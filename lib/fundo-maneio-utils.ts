/**
 * Utilitários para o Fundo de Maneio
 * Este arquivo contém funções para manipular dados do fundo de maneio
 */

import { v4 as uuidv4 } from "uuid"
import { carregarDoLocalStorage, salvarNoLocalStorage } from "./storage-utils"

// Tipos
export type Movimento = {
  id: string
  data: Date
  tipo: "entrada" | "saida"
  valor: number
  descricao: string
  pagamentoId?: string
  pagamentoReferencia?: string
  fornecedorNome?: string
  reposicaoId?: string
}

export type FundoManeioMensal = {
  id: string
  mes: Date
  movimentos: Movimento[]
  saldoInicial: number
  saldoFinal: number
}

/**
 * Função para adicionar um movimento ao fundo de maneio
 */
export function adicionarMovimentoFundoManeio(movimento: Partial<Movimento>): string | null {
  try {
    // Validar dados
    if (!movimento.tipo || !movimento.valor || movimento.valor <= 0) {
      console.error("Dados incompletos para adicionar movimento ao fundo de maneio")
      return null
    }

    // Carregar fundos de maneio
    const fundosManeio = carregarDoLocalStorage<FundoManeioMensal[]>("fundosManeio", [])

    // Verificar se há pelo menos um fundo de maneio
    if (fundosManeio.length === 0) {
      // Criar um fundo de maneio inicial
      fundosManeio.push({
        id: uuidv4(),
        mes: new Date(),
        movimentos: [],
        saldoInicial: 0,
        saldoFinal: 0,
      })
    }

    // Usar o primeiro fundo de maneio disponível
    const fundo = fundosManeio[0]

    // Verificar se há saldo suficiente para saídas
    if (movimento.tipo === "saida") {
      const saldoAtual = fundo.saldoFinal || fundo.saldoInicial || 0
      if (saldoAtual < movimento.valor) {
        console.error(`Saldo insuficiente no fundo de maneio. Saldo atual: ${saldoAtual.toFixed(2)} MZN`)
        return null
      }
    }

    // Criar o novo movimento
    const movimentoId = uuidv4()
    const novoMovimento: Movimento = {
      id: movimentoId,
      data: movimento.data || new Date(),
      tipo: movimento.tipo,
      valor: movimento.valor,
      descricao: movimento.descricao || "Movimento sem descrição",
      pagamentoId: movimento.pagamentoId,
      pagamentoReferencia: movimento.pagamentoReferencia,
      fornecedorNome: movimento.fornecedorNome,
      reposicaoId: movimento.reposicaoId,
    }

    // Adicionar o movimento ao fundo
    if (!fundo.movimentos) {
      fundo.movimentos = []
    }

    fundo.movimentos.push(novoMovimento)

    // Atualizar o saldo final
    const saldoAtual = fundo.saldoFinal || fundo.saldoInicial || 0
    fundo.saldoFinal = movimento.tipo === "entrada" ? saldoAtual + movimento.valor : saldoAtual - movimento.valor

    // Salvar os dados atualizados
    salvarNoLocalStorage("fundosManeio", fundosManeio)

    return movimentoId
  } catch (error) {
    console.error("Erro ao adicionar movimento ao fundo de maneio:", error)
    return null
  }
}

/**
 * Função para obter o saldo atual do fundo de maneio
 */
export function getSaldoAtualFundoManeio(): number {
  try {
    const fundosManeio = carregarDoLocalStorage<FundoManeioMensal[]>("fundosManeio", [])
    if (fundosManeio.length === 0) return 0

    const fundo = fundosManeio[0]
    return fundo.saldoFinal || fundo.saldoInicial || 0
  } catch (error) {
    console.error("Erro ao obter saldo do fundo de maneio:", error)
    return 0
  }
}

/**
 * Função para inicializar o fundo de maneio global
 * Esta função deve ser chamada no início da aplicação
 */
export function inicializarFundoManeioGlobal(): void {
  try {
    // @ts-ignore
    window.fundoManeio = {
      adicionarMovimentoFundoManeio,
      getSaldoAtual: getSaldoAtualFundoManeio,
      getFundoManeioAtual: () => {
        const fundosManeio = carregarDoLocalStorage<FundoManeioMensal[]>("fundosManeio", [])
        return fundosManeio.length > 0 ? fundosManeio[0] : null
      },
    }

    console.log("Fundo de Maneio inicializado globalmente")
  } catch (error) {
    console.error("Erro ao inicializar fundo de maneio global:", error)
  }
}

