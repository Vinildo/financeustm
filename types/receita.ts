export type Receita = {
  id: string
  descricao: string
  valor: number
  dataRecebimento: Date | null
  dataPrevisao: Date
  estado: "prevista" | "recebida" | "atrasada" | "cancelada"
  metodo: "transferência" | "depósito" | "cheque" | "dinheiro" | "outro"
  categoria: string
  observacoes: string
  documentoFiscal: boolean
  cliente: string
  reconciliado: boolean
  historico?: HistoryEntry[]
}

export type CategoriaReceita = {
  id: string
  nome: string
  descricao?: string
}

export type Cliente = {
  id: string
  nome: string
  email?: string
  telefone?: string
  observacoes?: string
  receitas: Receita[]
}

export type HistoryEntry = {
  date: Date
  description: string
}

