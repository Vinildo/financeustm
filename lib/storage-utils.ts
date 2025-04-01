/**
 * Utilitários para manipulação segura de localStorage
 * Este arquivo contém funções para ler e escrever dados no localStorage
 * com tratamento de erros e validação de dados
 */

import { isValid } from "date-fns"

/**
 * Função para validar e corrigir datas
 */
export const validarData = (data: any): Date => {
  if (!data) return new Date()

  try {
    const dataObj = data instanceof Date ? data : new Date(data)
    return isValid(dataObj) ? dataObj : new Date()
  } catch (error) {
    console.error("Erro ao validar data:", error)
    return new Date()
  }
}

/**
 * Função para carregar dados do localStorage com tratamento de erros
 */
export function carregarDoLocalStorage<T>(chave: string, valorPadrao: T): T {
  try {
    const dadosArmazenados = localStorage.getItem(chave)
    if (!dadosArmazenados) return valorPadrao

    const dados = JSON.parse(dadosArmazenados, (key, value) => {
      if (
        key === "mes" ||
        key === "data" ||
        key === "dataVencimento" ||
        key === "dataPagamento" ||
        key === "dataEmissao" ||
        key === "dataCompensacao"
      ) {
        return validarData(value)
      }
      return value
    })

    return dados
  } catch (error) {
    console.error(`Erro ao carregar ${chave} do localStorage:`, error)
    // Fazer backup dos dados corrompidos
    if (localStorage.getItem(chave)) {
      localStorage.setItem(`${chave}_backup`, localStorage.getItem(chave) || "")
    }
    return valorPadrao
  }
}

/**
 * Função para salvar dados no localStorage com tratamento de erros
 */
export function salvarNoLocalStorage(chave: string, valor: any): boolean {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
    return true
  } catch (error) {
    console.error(`Erro ao salvar ${chave} no localStorage:`, error)
    return false
  }
}

/**
 * Função para limpar dados do localStorage com tratamento de erros
 */
export function limparDadosLocalStorage(chave: string): boolean {
  try {
    // Fazer backup antes de limpar
    const dadosAtuais = localStorage.getItem(chave)
    if (dadosAtuais) {
      localStorage.setItem(`${chave}_backup`, dadosAtuais)
    }

    // Limpar os dados
    localStorage.removeItem(chave)
    return true
  } catch (error) {
    console.error(`Erro ao limpar ${chave} do localStorage:`, error)
    return false
  }
}

