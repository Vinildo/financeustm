export type Pagamento = {
  id: string
  referencia: string
  valor: number
  dataVencimento: Date
  dataPagamento: Date | null
  estado: "pendente" | "pago" | "atrasado" | "cancelado"
  metodo: "transferência" | "cheque" | "débito direto" | "outro"
  departamento: string
  observacoes: string
}

export type Cliente = {
  id: string
  nome: string
  pagamentos: Pagamento[]
}

