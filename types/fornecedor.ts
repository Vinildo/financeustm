export type ApprovalStep = {
  step: number
  approver: string
  approved: boolean
  timestamp?: Date
}

export interface Pagamento {
  id: string
  referencia: string
  valor: number
  dataVencimento: Date
  dataPagamento: Date | null
  estado: "pendente" | "pago" | "atrasado" | "cancelado"
  metodo: "transferência" | "cheque" | "débito direto" | "fundo de maneio" | "outro"
  departamento: string
  observacoes?: string
  descricao?: string
  tipo?: "fatura" | "cotacao" | "vd" | string
  facturaRecebida?: boolean
  reciboRecebido?: boolean
  vdRecebido?: boolean
  reconciliado?: boolean
  fundoManeioId?: string
  workflow?: {
    status: "in_progress" | "approved" | "rejected"
    currentStep: number
    steps: WorkflowStep[]
  }
  historico?: HistoryEntry[]
  fornecedorNome?: string
  // Adicionar campos para pagamentos parciais
  valorOriginal?: number
  pagamentosParciais?: PagamentoParcial[]
  valorPendente?: number
}

export type PagamentoParcial = {
  id: string
  dataPagamento: Date
  valor: number
  metodo: string
  referencia?: string
  observacoes?: string
}

export type Fornecedor = {
  id: string
  nome: string
  pagamentos: Pagamento[]
}

export type HistoryEntry = {
  id: string
  timestamp: Date
  username: string
  action: "create" | "update" | "delete"
  details: string
  previousState?: any
  newState?: any
}

export type WorkflowStep = {
  step: number
  description: string
  approver: string
}

