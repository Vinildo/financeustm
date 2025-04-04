"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { PrintLayout } from "@/components/print-layout"
import {
  Printer,
  Upload,
  FileDown,
  Search,
  X,
  RefreshCw,
  Plus,
  Edit,
  Save,
  Trash2,
  Info,
  HelpCircle,
  Filter,
  ArrowUpDown,
  Calendar,
} from "lucide-react"
import { format, isValid } from "date-fns"
import { pt } from "date-fns/locale"
import * as XLSX from "xlsx"
import { useAppContext } from "@/contexts/AppContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
// Removida a importação: import { useSupabase } from "@/contexts/SupabaseContext"

// Modificar o tipo TransacaoBancaria para incluir informações de cheque e transferência
type TransacaoBancaria = {
  id: string
  data: Date
  descricao: string
  valor: number
  tipo: "credito" | "debito"
  reconciliado: boolean
  pagamentoId?: string
  chequeId?: string
  chequeNumero?: string
  metodo?: "cheque" | "transferencia" | "deposito" | "outro"
  observacoes?: string
  referencia?: string
  origem?: "manual" | "importado" | "cheque"
}

type SortConfig = {
  key: keyof TransacaoBancaria | null
  direction: "asc" | "desc"
}

export function ReconciliacaoBancaria() {
  // Removida a linha: const { isAvailable, isConnected, connectionError } = useSupabase()
  const { fornecedores, updatePagamento } = useAppContext()
  const [transacoes, setTransacoes] = useState<TransacaoBancaria[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [mesSelecionado, setMesSelecionado] = useState<Date>(startOfMonth(new Date()))
  const [bancoSelecionado, setBancoSelecionado] = useState<string>("bci")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [matchAutomatico, setMatchAutomatico] = useState(true)
  const [activeTab, setActiveTab] = useState("automatica")
  const [transacaoParaExcluir, setTransacaoParaExcluir] = useState<string | null>(null)
  const [filtroMetodo, setFiltroMetodo] = useState<string>("todos")
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" })
  const [mostrarAjuda, setMostrarAjuda] = useState(false)
  const [mostrarAvancado, setMostrarAvancado] = useState(false)

  // Estado para o formulário de transação manual
  const [novaTransacao, setNovaTransacao] = useState<Partial<TransacaoBancaria>>({
    data: new Date(),
    descricao: "",
    valor: 0,
    tipo: "debito",
    metodo: "outro",
    reconciliado: false,
    observacoes: "",
    referencia: "",
    origem: "manual",
  })
  const [editandoTransacao, setEditandoTransacao] = useState<string | null>(null)
  const [errosValidacao, setErrosValidacao] = useState<Record<string, string>>({})

  // Adicionar um useEffect para carregar cheques e sincronizar com transações
  useEffect(() => {
    // Carregar cheques do localStorage
    const chequesArmazenados = localStorage.getItem("cheques")
    if (chequesArmazenados) {
      try {
        const chequesParsed = JSON.parse(chequesArmazenados)
        // Converter as datas de string para objeto Date
        const chequesFormatados = chequesParsed.map((cheque: any) => ({
          ...cheque,
          dataEmissao: new Date(cheque.dataEmissao),
          dataCompensacao: cheque.dataCompensacao ? new Date(cheque.dataCompensacao) : null,
        }))

        // Sincronizar cheques compensados com transações
        const chequesCompensados = chequesFormatados.filter(
          (cheque: any) => cheque.estado === "compensado" && cheque.dataCompensacao,
        )

        // Adicionar cheques compensados como transações se ainda não existirem
        if (chequesCompensados.length > 0) {
          setTransacoes((prevTransacoes) => {
            const transacoesExistentes = new Set(
              prevTransacoes.map((t) => (t.chequeId ? t.chequeId : null)).filter(Boolean),
            )

            const novasTransacoesCheques = chequesCompensados
              .filter((cheque: any) => !transacoesExistentes.has(cheque.id))
              .map((cheque: any) => ({
                id: `cheque-${cheque.id}`,
                data: cheque.dataCompensacao,
                descricao: `Cheque nº ${cheque.numero} - ${cheque.beneficiario}`,
                valor: cheque.valor,
                tipo: "debito",
                reconciliado: Boolean(cheque.pagamentoId),
                pagamentoId: cheque.pagamentoId,
                chequeId: cheque.id,
                chequeNumero: cheque.numero,
                metodo: "cheque" as const,
                origem: "cheque" as const,
                observacoes: cheque.observacoes || "",
                referencia: cheque.numero || "",
              }))

            return [...prevTransacoes, ...novasTransacoesCheques]
          })
        }
      } catch (error) {
        console.error("Erro ao carregar cheques:", error)
      }
    }
  }, [])

  // Adicionar useEffect para carregar transações bancárias do localStorage
  useEffect(() => {
    // Carregar transações do localStorage
    const transacoesArmazenadas = localStorage.getItem("transacoesBancarias")
    if (transacoesArmazenadas) {
      try {
        const transacoesParsed = JSON.parse(transacoesArmazenadas)
        // Converter as datas de string para objeto Date
        const transacoesFormatadas = transacoesParsed.map((transacao: any) => ({
          ...transacao,
          data: new Date(transacao.data),
        }))
        setTransacoes(transacoesFormatadas)
      } catch (error) {
        console.error("Erro ao carregar transações bancárias:", error)
      }
    }
  }, [])

  // Modificar o useEffect para salvar transações no localStorage quando houver mudanças
  useEffect(() => {
    // Salvar transações no localStorage
    if (transacoes.length > 0) {
      localStorage.setItem("transacoesBancarias", JSON.stringify(transacoes))
    }
  }, [transacoes])

  // Obter todos os pagamentos de todos os fornecedores
  const todosPagamentos = fornecedores.flatMap((fornecedor) =>
    fornecedor.pagamentos.map((pagamento) => ({
      ...pagamento,
      fornecedorId: fornecedor.id,
      fornecedorNome: fornecedor.nome,
    })),
  )

  // Função para ordenar transações
  const sortTransacoes = (transacoes: TransacaoBancaria[]) => {
    if (!sortConfig.key) return transacoes

    return [...transacoes].sort((a, b) => {
      if (a[sortConfig.key!] === undefined || b[sortConfig.key!] === undefined) return 0

      let comparison = 0
      if (sortConfig.key === "data") {
        comparison = new Date(a.data).getTime() - new Date(b.data).getTime()
      } else if (sortConfig.key === "valor") {
        comparison = a.valor - b.valor
      } else if (typeof a[sortConfig.key!] === "string" && typeof b[sortConfig.key!] === "string") {
        comparison = (a[sortConfig.key!] as string).localeCompare(b[sortConfig.key!] as string)
      }

      return sortConfig.direction === "asc" ? comparison : -comparison
    })
  }

  // Função para alternar a ordenação
  const requestSort = (key: keyof TransacaoBancaria) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Filtrar transações com base na pesquisa, intervalo de datas e filtros
  const transacoesFiltradas = sortTransacoes(
    transacoes.filter((transacao) => {
      const matchesSearch =
        transacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transacao.referencia && transacao.referencia.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesMonth =
        transacao.data >= startOfMonth(mesSelecionado) && transacao.data <= endOfMonth(mesSelecionado)
      const matchesMetodo = filtroMetodo === "todos" || transacao.metodo === filtroMetodo
      const matchesStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "reconciliado" && transacao.reconciliado) ||
        (filtroStatus === "pendente" && !transacao.reconciliado)

      return matchesSearch && matchesMonth && matchesMetodo && matchesStatus
    }),
  )

  // Estatísticas para o dashboard
  const estatisticas = {
    total: transacoes.length,
    reconciliadas: transacoes.filter((t) => t.reconciliado).length,
    pendentes: transacoes.filter((t) => !t.reconciliado).length,
    creditos: transacoes.filter((t) => t.tipo === "credito").length,
    debitos: transacoes.filter((t) => t.tipo === "debito").length,
    valorTotal: transacoes.reduce((sum, t) => sum + t.valor, 0),
    valorReconciliado: transacoes.filter((t) => t.reconciliado).reduce((sum, t) => sum + t.valor, 0),
    valorPendente: transacoes.filter((t) => !t.reconciliado).reduce((sum, t) => sum + t.valor, 0),
  }

  // Percentual de reconciliação
  const percentualReconciliado =
    estatisticas.total > 0 ? Math.round((estatisticas.reconciliadas / estatisticas.total) * 100) : 0

  // Modificar a função reconciliarAutomaticamente para considerar cheques e transferências
  const reconciliarAutomaticamente = (transacoesParaReconciliar: TransacaoBancaria[]) => {
    const pagamentosNaoReconciliados = todosPagamentos.filter((p) => p.estado !== "pago" && p.tipo === "fatura")

    const transacoesAtualizadas = [...transacoesParaReconciliar]

    // Para cada transação de débito, tente encontrar um pagamento correspondente
    transacoesAtualizadas.forEach((transacao, index) => {
      if (transacao.tipo === "debito" && !transacao.reconciliado) {
        let pagamentoCorrespondente

        // Se for um cheque, procurar pelo número do cheque nas observações
        if (transacao.metodo === "cheque" && transacao.chequeNumero) {
          pagamentoCorrespondente = pagamentosNaoReconciliados.find(
            (pagamento) =>
              pagamento.metodo === "cheque" && pagamento.observacoes?.includes(`Cheque nº ${transacao.chequeNumero}`),
          )
        }

        // Se for uma transferência, procurar por referências na descrição
        else if (
          transacao.descricao.toLowerCase().includes("transf") ||
          transacao.descricao.toLowerCase().includes("transfer")
        ) {
          // Procurar pagamentos por transferência com valor correspondente
          pagamentoCorrespondente = pagamentosNaoReconciliados.find(
            (pagamento) => pagamento.metodo === "transferencia" && Math.abs(pagamento.valor - transacao.valor) < 0.01,
          )
        }

        // Se não encontrou por método específico, procurar por valor
        if (!pagamentoCorrespondente) {
          pagamentoCorrespondente = pagamentosNaoReconciliados.find(
            (pagamento) =>
              Math.abs(pagamento.valor - transacao.valor) < 0.01 &&
              !pagamentosNaoReconciliados.some((p) => transacoesAtualizadas.some((t) => t.pagamentoId === p.id)),
          )
        }

        if (pagamentoCorrespondente) {
          transacoesAtualizadas[index] = {
            ...transacao,
            reconciliado: true,
            pagamentoId: pagamentoCorrespondente.id,
            metodo: (pagamentoCorrespondente.metodo as any) || transacao.metodo,
          }

          // Atualizar o pagamento como pago
          updatePagamento(pagamentoCorrespondente.fornecedorId, {
            ...pagamentoCorrespondente,
            estado: "pago",
            dataPagamento: transacao.data,
            observacoes: transacao.chequeNumero
              ? `${pagamentoCorrespondente.observacoes || ""} | Reconciliado com cheque nº ${transacao.chequeNumero}`
              : `${pagamentoCorrespondente.observacoes || ""} | Reconciliado com extrato bancário`,
          })

          // Se for um cheque, atualizar o estado do cheque no localStorage
          if (transacao.chequeId) {
            atualizarEstadoCheque(transacao.chequeId, "compensado", transacao.data)
          }
        }
      }
    })

    setTransacoes(transacoesAtualizadas)

    // Mostrar resumo da reconciliação
    const reconciliacoesRealizadas = transacoesAtualizadas.filter(
      (t) => t.reconciliado && !transacoesParaReconciliar.find((tr) => tr.id === t.id)?.reconciliado,
    ).length

    if (reconciliacoesRealizadas > 0) {
      toast({
        title: "Reconciliação automática",
        description: `${reconciliacoesRealizadas} transações foram reconciliadas automaticamente.`,
      })
    } else {
      toast({
        title: "Reconciliação automática",
        description: "Nenhuma transação foi reconciliada automaticamente.",
        variant: "destructive",
      })
    }
  }

  // Adicionar função para atualizar o estado de um cheque
  const atualizarEstadoCheque = (
    chequeId: string,
    estado: "pendente" | "compensado" | "cancelado",
    dataCompensacao?: Date,
  ) => {
    const chequesArmazenados = localStorage.getItem("cheques")
    if (chequesArmazenados) {
      try {
        const chequesParsed = JSON.parse(chequesArmazenados)
        const chequesAtualizados = chequesParsed.map((cheque: any) => {
          if (cheque.id === chequeId) {
            return {
              ...cheque,
              estado: estado,
              dataCompensacao: dataCompensacao ? dataCompensacao : cheque.dataCompensacao,
            }
          }
          return cheque
        })

        localStorage.setItem("cheques", JSON.stringify(chequesAtualizados))

        toast({
          title: "Cheque atualizado",
          description: `O estado do cheque foi atualizado para ${estado}.`,
        })
      } catch (error) {
        console.error("Erro ao atualizar cheque:", error)
      }
    }
  }

  // Reconciliar manualmente uma transação com um pagamento
  const reconciliarManualmente = (transacaoId: string, pagamentoId: string, fornecedorId: string) => {
    const transacao = transacoes.find((t) => t.id === transacaoId)
    if (!transacao) return

    const transacoesAtualizadas = transacoes.map((t) =>
      t.id === transacaoId
        ? {
            ...t,
            reconciliado: true,
            pagamentoId,
          }
        : t,
    )

    setTransacoes(transacoesAtualizadas)

    // Encontrar o pagamento e atualizá-lo
    const pagamento = todosPagamentos.find((p) => p.id === pagamentoId)
    if (pagamento) {
      // Determinar o método de pagamento com base na transação
      let metodo = pagamento.metodo
      let observacoes = pagamento.observacoes || ""

      if (transacao.metodo === "cheque" && transacao.chequeNumero) {
        metodo = "cheque"
        observacoes = `${observacoes ? observacoes + " | " : ""}Reconciliado com cheque nº ${transacao.chequeNumero}`

        // Se for um cheque, atualizar o estado do cheque
        if (transacao.chequeId) {
          atualizarEstadoCheque(transacao.chequeId, "compensado", transacao.data)
        }
      } else if (transacao.metodo === "transferencia") {
        metodo = "transferencia"
        observacoes = `${observacoes ? observacoes + " | " : ""}Reconciliado com transferência bancária`
      } else {
        observacoes = `${observacoes ? observacoes + " | " : ""}Reconciliado com extrato bancário`
      }

      updatePagamento(fornecedorId, {
        ...pagamento,
        estado: "pago",
        dataPagamento: transacao.data,
        metodo,
        observacoes,
      })

      toast({
        title: "Reconciliação realizada",
        description: `Transação reconciliada com o pagamento ${pagamento.referencia}.`,
      })
    }
  }

  // Remover reconciliação
  const removerReconciliacao = (transacaoId: string) => {
    const transacao = transacoes.find((t) => t.id === transacaoId)
    if (!transacao || !transacao.pagamentoId) return

    // Encontrar o pagamento e fornecedor
    const pagamento = todosPagamentos.find((p) => p.id === transacao.pagamentoId)
    if (!pagamento) return

    const fornecedorId = pagamento.fornecedorId

    // Atualizar a transação
    const transacoesAtualizadas = transacoes.map((t) =>
      t.id === transacaoId
        ? {
            ...t,
            reconciliado: false,
            pagamentoId: undefined,
          }
        : t,
    )

    setTransacoes(transacoesAtualizadas)

    // Atualizar o pagamento de volta para pendente
    updatePagamento(fornecedorId, {
      ...pagamento,
      estado: "pendente",
      dataPagamento: null,
    })

    toast({
      title: "Reconciliação removida",
      description: `A reconciliação da transação foi removida.`,
    })
  }

  // Processar o arquivo Excel
  const processarArquivoExcel = async (file: File) => {
    setIsProcessing(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Mapear os dados do Excel para o formato de transações
      const novasTransacoes: TransacaoBancaria[] = jsonData
        .map((row: any, index) => {
          // Adaptar para diferentes formatos de bancos
          let data,
            descricao,
            valor,
            tipo,
            metodo,
            referencia = ""

          if (bancoSelecionado === "bci") {
            data = new Date(row["Data"] || row["DATA"] || row["data"])
            descricao = row["Descrição"] || row["DESCRIÇÃO"] || row["descricao"] || ""
            valor = Number.parseFloat(row["Valor"] || row["VALOR"] || row["valor"] || 0)
            tipo = valor >= 0 ? "credito" : "debito"
            valor = Math.abs(valor)
            referencia = row["Referência"] || row["REFERÊNCIA"] || row["referencia"] || ""
          } else if (bancoSelecionado === "bim") {
            data = new Date(row["Data Mov."] || row["DATA"] || row["Data"])
            descricao = row["Descrição"] || row["Descricao"] || ""
            const credito = Number.parseFloat(row["Crédito"] || row["Credito"] || 0)
            const debito = Number.parseFloat(row["Débito"] || row["Debito"] || 0)
            tipo = credito > 0 ? "credito" : "debito"
            valor = credito > 0 ? credito : debito
            referencia = row["Referência"] || row["Referencia"] || ""
          } else {
            // Formato genérico
            data = new Date(row["Data"] || row["Date"] || "")
            descricao = row["Descrição"] || row["Description"] || ""
            valor = Number.parseFloat(row["Valor"] || row["Amount"] || 0)
            tipo = valor >= 0 ? "credito" : "debito"
            valor = Math.abs(valor)
            referencia = row["Referência"] || row["Reference"] || ""
          }

          // Detectar o método de pagamento com base na descrição
          if (descricao.toLowerCase().includes("cheque") || descricao.toLowerCase().includes("ch ")) {
            metodo = "cheque"

            // Tentar extrair o número do cheque da descrição
            const chequeMatch =
              descricao.match(/cheque\s+n[º°]?\s*(\d+)/i) ||
              descricao.match(/ch\s+n[º°]?\s*(\d+)/i) ||
              descricao.match(/ch\s*(\d+)/i)

            if (chequeMatch && chequeMatch[1]) {
              const chequeNumero = chequeMatch[1]
              referencia = chequeNumero

              // Verificar se existe um cheque com este número
              const chequesArmazenados = localStorage.getItem("cheques")
              if (chequesArmazenados) {
                try {
                  const chequesParsed = JSON.parse(chequesArmazenados)
                  const chequeEncontrado = chequesParsed.find((c: any) => c.numero === chequeNumero)

                  if (chequeEncontrado) {
                    return {
                      id: `trans-${index}-${Date.now()}`,
                      data: data,
                      descricao: descricao,
                      valor: valor,
                      tipo: tipo,
                      reconciliado: Boolean(chequeEncontrado.pagamentoId),
                      pagamentoId: chequeEncontrado.pagamentoId,
                      chequeId: chequeEncontrado.id,
                      chequeNumero: chequeNumero,
                      metodo: "cheque" as const,
                      origem: "importado" as const,
                      referencia: chequeNumero,
                      observacoes: `Importado do extrato bancário ${bancoSelecionado.toUpperCase()}`,
                    }
                  }
                } catch (error) {
                  console.error("Erro ao processar cheques:", error)
                }
              }
            }
          } else if (
            descricao.toLowerCase().includes("transf") ||
            descricao.toLowerCase().includes("transfer") ||
            descricao.toLowerCase().includes("trf")
          ) {
            metodo = "transferencia"
          } else if (descricao.toLowerCase().includes("depósito") || descricao.toLowerCase().includes("deposito")) {
            metodo = "deposito"
          } else {
            metodo = "outro"
          }

          return {
            id: `trans-${index}-${Date.now()}`,
            data: data,
            descricao: descricao,
            valor: valor,
            tipo: tipo,
            reconciliado: false,
            metodo: metodo as any,
            origem: "importado" as const,
            referencia: referencia,
            observacoes: `Importado do extrato bancário ${bancoSelecionado.toUpperCase()}`,
          }
        })
        .filter((t: TransacaoBancaria) => !isNaN(t.data.getTime()) && t.valor > 0)

      setTransacoes(novasTransacoes)

      if (matchAutomatico) {
        reconciliarAutomaticamente(novasTransacoes)
      }

      toast({
        title: "Extrato carregado",
        description: `${novasTransacoes.length} transações foram importadas com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao processar o arquivo:", error)
      toast({
        title: "Erro",
        description: "Não foi possível processar o arquivo. Verifique o formato e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Validar formulário de transação manual
  const validarFormulario = () => {
    const erros: Record<string, string> = {}

    if (!novaTransacao.descricao) {
      erros.descricao = "A descrição é obrigatória"
    }

    if (!novaTransacao.valor || novaTransacao.valor <= 0) {
      erros.valor = "O valor deve ser maior que zero"
    }

    if (!novaTransacao.data || !isValid(novaTransacao.data)) {
      erros.data = "Data inválida"
    }

    setErrosValidacao(erros)
    return Object.keys(erros).length === 0
  }

  // Adicionar função para adicionar transação manual
  const adicionarTransacaoManual = () => {
    if (!validarFormulario()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário.",
        variant: "destructive",
      })
      return
    }

    const novaTransacaoCompleta: TransacaoBancaria = {
      id: `manual-${Date.now()}`,
      data: novaTransacao.data || new Date(),
      descricao: novaTransacao.descricao || "",
      valor: novaTransacao.valor || 0,
      tipo: novaTransacao.tipo || "debito",
      reconciliado: false,
      metodo: novaTransacao.metodo || "outro",
      origem: "manual",
      observacoes: novaTransacao.observacoes || "Transação adicionada manualmente",
      referencia: novaTransacao.referencia || "",
    }

    setTransacoes((prev) => [...prev, novaTransacaoCompleta])

    // Limpar o formulário
    setNovaTransacao({
      data: new Date(),
      descricao: "",
      valor: 0,
      tipo: "debito",
      metodo: "outro",
      reconciliado: false,
      observacoes: "",
      referencia: "",
      origem: "manual",
    })

    toast({
      title: "Transação adicionada",
      description: "A transação manual foi adicionada com sucesso.",
    })
  }

  // Adicionar função para editar transação
  const iniciarEdicaoTransacao = (transacao: TransacaoBancaria) => {
    setNovaTransacao({
      data: transacao.data,
      descricao: transacao.descricao,
      valor: transacao.valor,
      tipo: transacao.tipo,
      metodo: transacao.metodo || "outro",
      observacoes: transacao.observacoes || "",
      referencia: transacao.referencia || "",
      origem: transacao.origem || "manual",
    })
    setEditandoTransacao(transacao.id)
    setErrosValidacao({})
  }

  // Adicionar função para salvar edição de transação
  const salvarEdicaoTransacao = () => {
    if (!editandoTransacao) return

    if (!validarFormulario()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário.",
        variant: "destructive",
      })
      return
    }

    setTransacoes((prev) =>
      prev.map((t) =>
        t.id === editandoTransacao
          ? {
              ...t,
              data: novaTransacao.data || t.data,
              descricao: novaTransacao.descricao || t.descricao,
              valor: novaTransacao.valor || t.valor,
              tipo: novaTransacao.tipo || t.tipo,
              metodo: novaTransacao.metodo || t.metodo,
              observacoes: novaTransacao.observacoes || t.observacoes,
              referencia: novaTransacao.referencia || t.referencia,
            }
          : t,
      ),
    )

    // Limpar o formulário e sair do modo de edição
    setNovaTransacao({
      data: new Date(),
      descricao: "",
      valor: 0,
      tipo: "debito",
      metodo: "outro",
      reconciliado: false,
      observacoes: "",
      referencia: "",
      origem: "manual",
    })
    setEditandoTransacao(null)

    toast({
      title: "Transação atualizada",
      description: "A transação foi atualizada com sucesso.",
    })
  }

  // Adicionar função para excluir transação
  const excluirTransacao = (id: string) => {
    setTransacoes((prev) => prev.filter((t) => t.id !== id))
    setTransacaoParaExcluir(null)

    toast({
      title: "Transação excluída",
      description: "A transação foi excluída com sucesso.",
    })
  }

  // Cancelar edição
  const cancelarEdicao = () => {
    setNovaTransacao({
      data: new Date(),
      descricao: "",
      valor: 0,
      tipo: "debito",
      metodo: "outro",
      reconciliado: false,
      observacoes: "",
      referencia: "",
      origem: "manual",
    })
    setEditandoTransacao(null)
    setErrosValidacao({})
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processarArquivoExcel(file)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      transacoesFiltradas.map((transacao) => {
        const pagamentoCorrespondente = todosPagamentos.find((p) => p.id === transacao.pagamentoId)
        return {
          Data: format(transacao.data, "dd/MM/yyyy", { locale: pt }),
          Descrição: transacao.descricao,
          Referência: transacao.referencia || "",
          Valor: transacao.valor.toFixed(2),
          Tipo: transacao.tipo === "credito" ? "Crédito" : "Débito",
          Método: transacao.metodo ? transacao.metodo.charAt(0).toUpperCase() + transacao.metodo.slice(1) : "",
          Reconciliado: transacao.reconciliado ? "Sim" : "Não",
          "Pagamento Ref.": pagamentoCorrespondente?.referencia || "",
          Fornecedor: pagamentoCorrespondente
            ? fornecedores.find((f) => f.id === pagamentoCorrespondente.fornecedorId)?.nome || ""
            : "",
          Observações: transacao.observacoes || "",
          Origem: transacao.origem ? transacao.origem.charAt(0).toUpperCase() + transacao.origem.slice(1) : "",
        }
      }),
    )

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reconciliação")

    // Gerar arquivo Excel e iniciar download
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.download = "reconciliacao-bancaria.xlsx"
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const handleMesAnterior = () => {
    setMesSelecionado((mesAtual) => subMonths(mesAtual, 1))
  }

  const handleProximoMes = () => {
    setMesSelecionado((mesAtual) => addMonths(mesAtual, 1))
  }

  return (
    <PrintLayout title="Reconciliação Bancária">
      {/* Removido o bloco de verificação do Supabase */}
      <Card className="w-full">
        <CardHeader className="bg-red-600">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="text-white">Reconciliação Bancária</CardTitle>
              <CardDescription className="text-white/80">
                Reconcilie os pagamentos com o extrato bancário
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setMostrarAjuda(!mostrarAjuda)}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mostrar/ocultar ajuda</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button onClick={handlePrint} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleExportExcel} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        {mostrarAjuda && (
          <div className="bg-blue-50 p-4 mx-6 my-2 rounded-md border border-blue-200">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">Ajuda da Reconciliação Bancária</h3>
                <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
                  <li>
                    <strong>Reconciliação Automática:</strong> Importe um extrato bancário em formato Excel e o sistema
                    tentará reconciliar automaticamente com os pagamentos pendentes.
                  </li>
                  <li>
                    <strong>Reconciliação Manual:</strong> Adicione transações manualmente quando não tiver um extrato
                    para importar ou quando precisar ajustar informações.
                  </li>
                  <li>
                    <strong>Filtros:</strong> Use os filtros para encontrar transações específicas por método de
                    pagamento, status ou texto.
                  </li>
                  <li>
                    <strong>Ordenação:</strong> Clique nos cabeçalhos da tabela para ordenar as transações.
                  </li>
                  <li>
                    <strong>Ações:</strong> Reconcilie manualmente, edite ou exclua transações usando os botões de ação
                    na tabela.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="automatica">Reconciliação Automática</TabsTrigger>
              <TabsTrigger value="manual">Reconciliação Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="automatica" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Importar Extrato Bancário</CardTitle>
                  <CardDescription>
                    Carregue um arquivo Excel com o extrato bancário para reconciliar automaticamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-auto">
                      <Label htmlFor="banco" className="mb-2 block">
                        Banco
                      </Label>
                      <Select value={bancoSelecionado} onValueChange={setBancoSelecionado}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Selecionar banco" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bci">BCI</SelectItem>
                          <SelectItem value="bim">BIM</SelectItem>
                          <SelectItem value="standard">Standard Bank</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:w-auto">
                      <Label htmlFor="match-automatico" className="mb-2 block">
                        Match Automático
                      </Label>
                      <Select
                        value={matchAutomatico ? "sim" : "nao"}
                        onValueChange={(v) => setMatchAutomatico(v === "sim")}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Match automático" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:w-auto">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {isProcessing ? "Processando..." : "Carregar Extrato"}
                      </Button>
                    </div>
                    <Button
                      onClick={() => reconciliarAutomaticamente(transacoes)}
                      disabled={transacoes.length === 0}
                      className="w-full sm:w-auto"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reconciliar Automaticamente
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t">
                  <div className="text-sm text-gray-500">
                    <p>Formatos suportados: Excel (.xlsx, .xls)</p>
                    <p>
                      O sistema tentará identificar automaticamente o formato do extrato com base no banco selecionado.
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Transação Manual</CardTitle>
                  <CardDescription>
                    Adicione transações bancárias manualmente quando não tiver um extrato para importar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data-transacao" className="flex items-center">
                        Data <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="data-transacao"
                          type="date"
                          value={novaTransacao.data ? format(novaTransacao.data, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : new Date()
                            setNovaTransacao({ ...novaTransacao, data: date })
                          }}
                          className="pl-8"
                        />
                        {errosValidacao.data && <p className="text-red-500 text-xs mt-1">{errosValidacao.data}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricao-transacao" className="flex items-center">
                        Descrição <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="descricao-transacao"
                        value={novaTransacao.descricao}
                        onChange={(e) => setNovaTransacao({ ...novaTransacao, descricao: e.target.value })}
                        placeholder="Descrição da transação"
                        className={errosValidacao.descricao ? "border-red-500" : ""}
                      />
                      {errosValidacao.descricao && (
                        <p className="text-red-500 text-xs mt-1">{errosValidacao.descricao}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referencia-transacao">Referência</Label>
                      <Input
                        id="referencia-transacao"
                        value={novaTransacao.referencia}
                        onChange={(e) => setNovaTransacao({ ...novaTransacao, referencia: e.target.value })}
                        placeholder="Número de referência (opcional)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor-transacao" className="flex items-center">
                        Valor <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="valor-transacao"
                        type="number"
                        value={novaTransacao.valor || ""}
                        onChange={(e) =>
                          setNovaTransacao({ ...novaTransacao, valor: Number.parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0.00"
                        className={errosValidacao.valor ? "border-red-500" : ""}
                      />
                      {errosValidacao.valor && <p className="text-red-500 text-xs mt-1">{errosValidacao.valor}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo-transacao">Tipo</Label>
                      <Select
                        value={novaTransacao.tipo}
                        onValueChange={(value: "credito" | "debito") =>
                          setNovaTransacao({ ...novaTransacao, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credito">Crédito</SelectItem>
                          <SelectItem value="debito">Débito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metodo-transacao">Método</Label>
                      <Select
                        value={novaTransacao.metodo}
                        onValueChange={(value: any) => setNovaTransacao({ ...novaTransacao, metodo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="deposito">Depósito</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {mostrarAvancado && (
                      <div className="space-y-2 col-span-full">
                        <Label htmlFor="observacoes-transacao">Observações</Label>
                        <Input
                          id="observacoes-transacao"
                          value={novaTransacao.observacoes}
                          onChange={(e) => setNovaTransacao({ ...novaTransacao, observacoes: e.target.value })}
                          placeholder="Observações adicionais"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center mt-4">
                    <Switch id="mostrar-avancado" checked={mostrarAvancado} onCheckedChange={setMostrarAvancado} />
                    <Label htmlFor="mostrar-avancado" className="ml-2">
                      Mostrar campos avançados
                    </Label>
                  </div>

                  <div className="flex justify-end mt-4 space-x-2">
                    {editandoTransacao ? (
                      <>
                        <Button variant="outline" onClick={cancelarEdicao}>
                          Cancelar
                        </Button>
                        <Button onClick={salvarEdicaoTransacao}>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Alterações
                        </Button>
                      </>
                    ) : (
                      <Button onClick={adicionarTransacaoManual}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Transação
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total de Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <p className="text-2xl font-bold">{estatisticas.total}</p>
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>Créditos: {estatisticas.creditos}</span>
                    <span>Débitos: {estatisticas.debitos}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Valor total: {estatisticas.valorTotal.toFixed(2)} MT</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Reconciliadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <p className="text-2xl font-bold">{estatisticas.reconciliadas}</p>
                  <Progress value={percentualReconciliado} className="h-2 mt-2" />
                  <p className="text-sm text-gray-500 mt-1">{percentualReconciliado}% do total</p>
                  <p className="text-sm text-gray-500 mt-1">Valor: {estatisticas.valorReconciliado.toFixed(2)} MT</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <p className="text-2xl font-bold">{estatisticas.pendentes}</p>
                  <p className="text-sm text-gray-500 mt-1">{100 - percentualReconciliado}% do total</p>
                  <p className="text-sm text-gray-500 mt-1">Valor: {estatisticas.valorPendente.toFixed(2)} MT</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar transações..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Filtrar transações</h4>

                    <div className="space-y-2">
                      <Label htmlFor="filtro-metodo">Método de pagamento</Label>
                      <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
                        <SelectTrigger id="filtro-metodo">
                          <SelectValue placeholder="Todos os métodos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os métodos</SelectItem>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="deposito">Depósito</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filtro-status">Status</Label>
                      <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                        <SelectTrigger id="filtro-status">
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os status</SelectItem>
                          <SelectItem value="reconciliado">Reconciliado</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2">
              <Button onClick={handleMesAnterior} variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold">{format(mesSelecionado, "MMMM yyyy", { locale: pt })}</span>
              <Button onClick={handleProximoMes} variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border mt-4">
            <Table>
              <TableHeader className="bg-red-600">
                <TableRow>
                  <TableHead className="font-semibold cursor-pointer text-white" onClick={() => requestSort("data")}>
                    <div className="flex items-center">
                      Data
                      {sortConfig.key === "data" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-semibold cursor-pointer text-white"
                    onClick={() => requestSort("descricao")}
                  >
                    <div className="flex items-center">
                      Descrição
                      {sortConfig.key === "descricao" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-semibold text-right cursor-pointer text-white"
                    onClick={() => requestSort("valor")}
                  >
                    <div className="flex items-center justify-end">
                      Valor
                      {sortConfig.key === "valor" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-white">Tipo</TableHead>
                  <TableHead className="font-semibold text-white">Status</TableHead>
                  <TableHead className="font-semibold text-white">Pagamento Correspondente</TableHead>
                  <TableHead className="font-semibold text-right text-white">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacoesFiltradas.length > 0 ? (
                  transacoesFiltradas.map((transacao, index) => {
                    const pagamentoCorrespondente = todosPagamentos.find((p) => p.id === transacao.pagamentoId)
                    return (
                      <TableRow key={transacao.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <TableCell>{format(transacao.data, "dd/MM/yyyy", { locale: pt })}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-xs truncate">
                                  {transacao.descricao}
                                  {transacao.referencia && (
                                    <span className="text-gray-500 ml-1">(Ref: {transacao.referencia})</span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{transacao.descricao}</p>
                                {transacao.referencia && <p>Referência: {transacao.referencia}</p>}
                                {transacao.observacoes && <p>Obs: {transacao.observacoes}</p>}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right">{transacao.valor.toFixed(2)} MT</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transacao.tipo === "credito"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {transacao.tipo === "credito" ? "Crédito" : "Débito"}
                          </Badge>
                          {transacao.metodo && (
                            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                              {transacao.metodo.charAt(0).toUpperCase() + transacao.metodo.slice(1)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transacao.reconciliado
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }
                          >
                            {transacao.reconciliado ? "Reconciliado" : "Pendente"}
                          </Badge>
                          {transacao.origem && (
                            <Badge variant="outline" className="ml-2 bg-gray-100 text-gray-700 border-gray-200">
                              {transacao.origem === "manual"
                                ? "Manual"
                                : transacao.origem === "importado"
                                  ? "Importado"
                                  : "Cheque"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {pagamentoCorrespondente ? (
                            <div>
                              <div className="font-medium">{pagamentoCorrespondente.referencia}</div>
                              <div className="text-sm text-gray-500">
                                {fornecedores.find((f) => f.id === pagamentoCorrespondente.fornecedorId)?.nome}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {transacao.reconciliado ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removerReconciliacao(transacao.id)}
                                      className="text-red-600"
                                    >
                                      <X className="mr-1 h-4 w-4" />
                                      Remover
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remover reconciliação desta transação</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <>
                                <Select
                                  onValueChange={(value) => {
                                    const [pagamentoId, fornecedorId] = value.split("|")
                                    reconciliarManualmente(transacao.id, pagamentoId, fornecedorId)
                                  }}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Reconciliar com..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {todosPagamentos
                                      .filter((p) => p.estado !== "pago" && p.tipo === "fatura")
                                      .map((pagamento) => (
                                        <SelectItem
                                          key={pagamento.id}
                                          value={`${pagamento.id}|${pagamento.fornecedorId}`}
                                        >
                                          {pagamento.referencia} - {pagamento.valor.toFixed(2)} MT
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                {(activeTab === "manual" || transacao.origem === "manual") && (
                                  <>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => iniciarEdicaoTransacao(transacao)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Editar transação</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setTransacaoParaExcluir(transacao.id)}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Excluir transação</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      {transacoes.length === 0
                        ? "Nenhum extrato bancário carregado. Carregue um arquivo Excel ou adicione transações manualmente para começar."
                        : "Nenhuma transação encontrada com os filtros atuais."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação para excluir transação */}
      <Dialog open={!!transacaoParaExcluir} onOpenChange={(open) => !open && setTransacaoParaExcluir(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setTransacaoParaExcluir(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => transacaoParaExcluir && excluirTransacao(transacaoParaExcluir)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PrintLayout>
  )
}

