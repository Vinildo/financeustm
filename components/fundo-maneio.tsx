"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, addMonths, subMonths, isValid } from "date-fns"
import { pt } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { PrintLayout } from "@/components/print-layout"
import { Trash2, Printer, FileDown, ChevronLeft, ChevronRight, FileText, Plus, RefreshCw } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { v4 as uuidv4 } from "uuid"

export type Movimento = {
  id: string
  data: Date
  tipo: "entrada" | "saida"
  valor: number
  descricao: string
  pagamentoId?: string // Referência ao pagamento, se aplicável
  pagamentoReferencia?: string // Referência do pagamento, se aplicável
  fornecedorNome?: string // Nome do fornecedor, se aplicável
  reposicaoId?: string // ID da reposição, se for uma entrada de reposição
}

type FundoManeioMensal = {
  id: string
  mes: Date
  movimentos: Movimento[]
  saldoInicial: number
  saldoFinal: number
}

export function FundoManeio() {
  const { user } = useAuth()
  const [fundosManeio, setFundosManeio] = useState<FundoManeioMensal[]>([])
  const [mesSelecionado, setMesSelecionado] = useState<Date>(startOfMonth(new Date()))
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetalhesDialogOpen, setIsDetalhesDialogOpen] = useState(false)
  const [isReposicaoDialogOpen, setIsReposicaoDialogOpen] = useState(false)
  const [movimentoSelecionado, setMovimentoSelecionado] = useState<Movimento | null>(null)
  const [novoMovimento, setNovoMovimento] = useState<Partial<Movimento>>({
    tipo: "entrada",
  })
  const [reposicao, setReposicao] = useState({
    valor: 0,
    descricao: "Reposição de Fundo de Maneio",
    data: new Date(),
  })
  const [saldoInicial, setSaldoInicial] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Função para validar e corrigir datas
  const validarData = (data: any): Date => {
    if (!data) return new Date()

    try {
      const dataObj = data instanceof Date ? data : new Date(data)
      return isValid(dataObj) ? dataObj : new Date()
    } catch (error) {
      console.error("Erro ao validar data:", error)
      return new Date()
    }
  }

  // Função para carregar dados do localStorage com tratamento de erros
  const carregarDadosLocalStorage = () => {
    setIsLoading(true)
    try {
      const dadosSalvos = localStorage.getItem("fundosManeio")
      if (dadosSalvos) {
        try {
          const dados = JSON.parse(dadosSalvos, (key, value) => {
            if (key === "mes" || key === "data") {
              return validarData(value)
            }
            return value
          })

          // Validar estrutura dos dados
          const dadosValidados = Array.isArray(dados)
            ? dados.map((fundo) => ({
                id: fundo.id || uuidv4(),
                mes: validarData(fundo.mes),
                movimentos: Array.isArray(fundo.movimentos)
                  ? fundo.movimentos.map((m: any) => ({
                      id: m.id || uuidv4(),
                      data: validarData(m.data),
                      tipo: m.tipo === "entrada" || m.tipo === "saida" ? m.tipo : "entrada",
                      valor: typeof m.valor === "number" ? m.valor : Number.parseFloat(m.valor) || 0,
                      descricao: m.descricao || "Movimento sem descrição",
                      pagamentoId: m.pagamentoId,
                      pagamentoReferencia: m.pagamentoReferencia,
                      fornecedorNome: m.fornecedorNome,
                      reposicaoId: m.reposicaoId,
                    }))
                  : [],
                saldoInicial:
                  typeof fundo.saldoInicial === "number"
                    ? fundo.saldoInicial
                    : Number.parseFloat(fundo.saldoInicial) || 0,
                saldoFinal:
                  typeof fundo.saldoFinal === "number" ? fundo.saldoFinal : Number.parseFloat(fundo.saldoFinal) || 0,
              }))
            : []

          setFundosManeio(dadosValidados)
        } catch (error) {
          console.error("Erro ao processar dados do fundo de maneio:", error)
          setFundosManeio([])
          // Fazer backup dos dados corrompidos
          localStorage.setItem("fundosManeio_backup", dadosSalvos)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do fundo de maneio:", error)
      setFundosManeio([])
    } finally {
      setIsLoading(false)
    }
  }

  // Função para salvar dados no localStorage com tratamento de erros
  const salvarDadosLocalStorage = (dados: FundoManeioMensal[]) => {
    try {
      localStorage.setItem("fundosManeio", JSON.stringify(dados))
    } catch (error) {
      console.error("Erro ao salvar dados do fundo de maneio:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dados. Verifique o espaço disponível no navegador.",
        variant: "destructive",
      })
    }
  }

  // Carregar dados ao iniciar
  useEffect(() => {
    carregarDadosLocalStorage()
  }, [])

  // Salvar dados quando fundosManeio for atualizado
  useEffect(() => {
    if (!isLoading) {
      salvarDadosLocalStorage(fundosManeio)
    }
  }, [fundosManeio, isLoading])

  const fundoManeioAtual = fundosManeio.find(
    (fundo) => format(fundo.mes, "yyyy-MM") === format(mesSelecionado, "yyyy-MM"),
  )

  const handleAddMovimento = () => {
    if (!novoMovimento.tipo || !novoMovimento.valor) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o tipo e o valor do movimento.",
        variant: "destructive",
      })
      return
    }

    // Usar valores padrão para campos não preenchidos
    const data = novoMovimento.data || new Date()
    const descricao = novoMovimento.descricao || "Movimento manual"

    const novoId = uuidv4()
    const novoMovimentoCompleto: Movimento = {
      id: novoId,
      data: data,
      tipo: novoMovimento.tipo,
      valor: novoMovimento.valor,
      descricao: descricao,
    }

    setFundosManeio((fundosAnteriores) => {
      const fundoExistente = fundosAnteriores.find(
        (fundo) => format(fundo.mes, "yyyy-MM") === format(mesSelecionado, "yyyy-MM"),
      )

      if (fundoExistente) {
        // Calcular o saldo atual corretamente
        const totalEntradas = fundoExistente.movimentos
          .filter((m) => m.tipo === "entrada")
          .reduce((sum, m) => sum + m.valor, 0)

        const totalSaidas = fundoExistente.movimentos
          .filter((m) => m.tipo === "saida")
          .reduce((sum, m) => sum + m.valor, 0)

        const saldoAtual = fundoExistente.saldoInicial + totalEntradas - totalSaidas

        // Calcular novo saldo final
        const novoSaldoFinal =
          novoMovimento.tipo === "entrada" ? saldoAtual + novoMovimento.valor : saldoAtual - novoMovimento.valor

        return fundosAnteriores.map((fundo) =>
          fundo.id === fundoExistente.id
            ? {
                ...fundo,
                movimentos: [...fundo.movimentos, novoMovimentoCompleto],
                saldoFinal: novoSaldoFinal,
              }
            : fundo,
        )
      } else {
        // Criar novo fundo para o mês
        const novoSaldoFinal =
          novoMovimento.tipo === "entrada" ? saldoInicial + novoMovimento.valor : saldoInicial - novoMovimento.valor

        const novoFundo: FundoManeioMensal = {
          id: uuidv4(),
          mes: startOfMonth(mesSelecionado),
          movimentos: [novoMovimentoCompleto],
          saldoInicial: saldoInicial,
          saldoFinal: novoSaldoFinal,
        }
        return [...fundosAnteriores, novoFundo]
      }
    })

    setIsAddDialogOpen(false)
    setNovoMovimento({ tipo: "entrada" })
    setSaldoInicial(0)
    toast({
      title: "Movimento adicionado",
      description: "O novo movimento foi adicionado com sucesso.",
    })

    return novoId
  }

  // Função para criar uma reposição de fundo de maneio
  const handleReposicaoFundoManeio = () => {
    if (!reposicao.valor || reposicao.valor <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe um valor válido para a reposição.",
        variant: "destructive",
      })
      return
    }

    try {
      // Criar um ID para a reposição
      const reposicaoId = `reposicao-${Date.now()}`

      // Criar um pagamento para a reposição
      const pagamento = {
        id: `pagamento-${Date.now()}`,
        referencia: `REP-${format(reposicao.data, "yyyyMMdd")}`,
        valor: reposicao.valor,
        dataVencimento: reposicao.data,
        dataPagamento: reposicao.data,
        estado: "pago",
        metodo: "transferência",
        departamento: "Tesouraria",
        descricao: reposicao.descricao,
        observacoes: "Reposição de Fundo de Maneio",
        tipo: "fatura",
        fornecedorNome: "Fundo de Maneio",
        reposicaoId: reposicaoId,
      }

      // Adicionar o pagamento ao sistema
      const pagamentoAdicionado = adicionarPagamentoReposicao(pagamento)

      if (!pagamentoAdicionado) {
        throw new Error("Falha ao adicionar pagamento de reposição")
      }

      // Adicionar o movimento de entrada no fundo de maneio
      const novoMovimento: Movimento = {
        id: uuidv4(),
        data: reposicao.data,
        tipo: "entrada",
        valor: reposicao.valor,
        descricao: reposicao.descricao,
        pagamentoId: pagamento.id,
        pagamentoReferencia: pagamento.referencia,
        reposicaoId: reposicaoId,
      }

      setFundosManeio((fundosAnteriores) => {
        const fundoExistente = fundosAnteriores.find(
          (fundo) => format(fundo.mes, "yyyy-MM") === format(reposicao.data, "yyyy-MM"),
        )

        if (fundoExistente) {
          // Calcular o saldo atual
          const totalEntradas = fundoExistente.movimentos
            .filter((m) => m.tipo === "entrada")
            .reduce((sum, m) => sum + m.valor, 0)

          const totalSaidas = fundoExistente.movimentos
            .filter((m) => m.tipo === "saida")
            .reduce((sum, m) => sum + m.valor, 0)

          const saldoAtual = fundoExistente.saldoInicial + totalEntradas - totalSaidas

          // Calcular novo saldo final
          const novoSaldoFinal = saldoAtual + reposicao.valor

          return fundosAnteriores.map((fundo) =>
            fundo.id === fundoExistente.id
              ? {
                  ...fundo,
                  movimentos: [...fundo.movimentos, novoMovimento],
                  saldoFinal: novoSaldoFinal,
                }
              : fundo,
          )
        } else {
          // Criar novo fundo para o mês
          const novoFundo: FundoManeioMensal = {
            id: uuidv4(),
            mes: startOfMonth(reposicao.data),
            movimentos: [novoMovimento],
            saldoInicial: 0,
            saldoFinal: reposicao.valor,
          }
          return [...fundosAnteriores, novoFundo]
        }
      })

      // Adicionar transação bancária para a reposição
      adicionarTransacaoBancariaReposicao(pagamento)

      setIsReposicaoDialogOpen(false)
      setReposicao({
        valor: 0,
        descricao: "Reposição de Fundo de Maneio",
        data: new Date(),
      })

      toast({
        title: "Reposição realizada",
        description: "A reposição do fundo de maneio foi registrada com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao processar reposição:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a reposição. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Função para adicionar um pagamento de reposição
  const adicionarPagamentoReposicao = (pagamento: any) => {
    try {
      // Carregar fornecedores existentes
      const fornecedoresString = localStorage.getItem("fornecedores")
      let fornecedores = []

      if (fornecedoresString) {
        try {
          fornecedores = JSON.parse(fornecedoresString)
        } catch (error) {
          console.error("Erro ao processar fornecedores:", error)
          fornecedores = []
          // Fazer backup dos dados corrompidos
          localStorage.setItem("fornecedores_backup", fornecedoresString)
        }
      }

      // Verificar se já existe um fornecedor para o fundo de maneio
      let fundoManeioFornecedor = fornecedores.find((f: any) => f.nome === "Fundo de Maneio")

      if (!fundoManeioFornecedor) {
        // Criar um fornecedor para o fundo de maneio
        fundoManeioFornecedor = {
          id: `fornecedor-fundoManeio-${Date.now()}`,
          nome: "Fundo de Maneio",
          pagamentos: [],
        }
        fornecedores.push(fundoManeioFornecedor)
      }

      // Garantir que o fornecedor tenha um array de pagamentos
      if (!fundoManeioFornecedor.pagamentos) {
        fundoManeioFornecedor.pagamentos = []
      }

      // Adicionar o pagamento ao fornecedor
      fundoManeioFornecedor.pagamentos.push({
        ...pagamento,
        fornecedorId: fundoManeioFornecedor.id,
        historico: [
          {
            id: uuidv4(),
            timestamp: new Date(),
            username: user?.username || "sistema",
            action: "create",
            details: "Reposição de Fundo de Maneio criada",
          },
        ],
      })

      // Salvar fornecedores atualizados
      localStorage.setItem("fornecedores", JSON.stringify(fornecedores))

      return pagamento.id
    } catch (error) {
      console.error("Erro ao adicionar pagamento de reposição:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar o pagamento de reposição.",
        variant: "destructive",
      })
      return null
    }
  }

  // Função para adicionar transação bancária para a reposição
  const adicionarTransacaoBancariaReposicao = (pagamento: any) => {
    try {
      // Criar uma transação bancária para a reposição
      const transacao = {
        id: `trans-${Date.now()}`,
        data: pagamento.dataPagamento,
        descricao: `Reposição de Fundo de Maneio - ${pagamento.referencia}`,
        valor: pagamento.valor,
        tipo: "debito",
        reconciliado: false,
        pagamentoId: pagamento.id,
        metodo: "transferencia",
        origem: "reposicao",
        observacoes: "Reposição de Fundo de Maneio",
        referencia: pagamento.referencia,
        reposicaoId: pagamento.reposicaoId,
      }

      // Carregar transações existentes
      const transacoesArmazenadas = localStorage.getItem("transacoesBancarias")
      let transacoes = []

      if (transacoesArmazenadas) {
        try {
          transacoes = JSON.parse(transacoesArmazenadas)
        } catch (error) {
          console.error("Erro ao carregar transações bancárias:", error)
          transacoes = []
          // Fazer backup dos dados corrompidos
          localStorage.setItem("transacoesBancarias_backup", transacoesArmazenadas)
        }
      }

      // Adicionar a nova transação
      transacoes.push(transacao)

      // Salvar no localStorage
      localStorage.setItem("transacoesBancarias", JSON.stringify(transacoes))

      return true
    } catch (error) {
      console.error("Erro ao adicionar transação bancária para reposição:", error)
      return false
    }
  }

  const adicionarMovimentoFundoManeio = (movimento: Partial<Movimento>): string | null => {
    if (!movimento.data || !movimento.tipo || !movimento.valor || !movimento.descricao) {
      toast({
        title: "Erro",
        description: "Dados incompletos para adicionar movimento ao fundo de maneio.",
        variant: "destructive",
      })
      return null
    }

    const novoId = uuidv4()
    const novoMovimentoCompleto: Movimento = {
      id: novoId,
      data: movimento.data,
      tipo: movimento.tipo,
      valor: movimento.valor,
      descricao: movimento.descricao,
      pagamentoId: movimento.pagamentoId,
      pagamentoReferencia: movimento.pagamentoReferencia,
      fornecedorNome: movimento.fornecedorNome,
    }

    let fundoAtualizado = false

    setFundosManeio((fundosAnteriores) => {
      const fundoExistente = fundosAnteriores.find(
        (fundo) => format(fundo.mes, "yyyy-MM") === format(movimento.data, "yyyy-MM"),
      )

      if (fundoExistente) {
        // Calcular o saldo atual corretamente
        const totalEntradas = fundoExistente.movimentos
          .filter((m) => m.tipo === "entrada")
          .reduce((sum, m) => sum + m.valor, 0)

        const totalSaidas = fundoExistente.movimentos
          .filter((m) => m.tipo === "saida")
          .reduce((sum, m) => sum + m.valor, 0)

        const saldoAtual = fundoExistente.saldoInicial + totalEntradas - totalSaidas

        // Verificar se há saldo suficiente para saídas
        if (movimento.tipo === "saida" && saldoAtual < movimento.valor) {
          toast({
            title: "Erro",
            description: "Saldo insuficiente no fundo de maneio para realizar este pagamento.",
            variant: "destructive",
          })
          fundoAtualizado = false
          return fundosAnteriores
        }

        // Atualizar fundo existente
        fundoAtualizado = true

        // Calcular novo saldo final
        const novoSaldoFinal =
          movimento.tipo === "entrada" ? saldoAtual + movimento.valor : saldoAtual - movimento.valor

        return fundosAnteriores.map((fundo) =>
          fundo.id === fundoExistente.id
            ? {
                ...fundo,
                movimentos: [...fundo.movimentos, novoMovimentoCompleto],
                saldoFinal: novoSaldoFinal,
              }
            : fundo,
        )
      } else {
        // Criar novo fundo para o mês
        // Para saídas, verificar se há saldo inicial
        if (movimento.tipo === "saida" && saldoInicial < movimento.valor) {
          toast({
            title: "Erro",
            description: "Saldo inicial insuficiente para realizar este pagamento.",
            variant: "destructive",
          })
          fundoAtualizado = false
          return fundosAnteriores
        }

        fundoAtualizado = true

        // Calcular saldo final para novo fundo
        const novoSaldoFinal =
          movimento.tipo === "entrada" ? saldoInicial + movimento.valor : saldoInicial - movimento.valor

        const novoFundo: FundoManeioMensal = {
          id: uuidv4(),
          mes: startOfMonth(movimento.data),
          movimentos: [novoMovimentoCompleto],
          saldoInicial: saldoInicial,
          saldoFinal: novoSaldoFinal,
        }
        return [...fundosAnteriores, novoFundo]
      }
    })

    if (fundoAtualizado) {
      toast({
        title: "Movimento adicionado",
        description: "O movimento foi adicionado ao fundo de maneio com sucesso.",
      })
      return novoId
    }

    return null
  }

  const handleDeleteMovimento = (movimentoId: string) => {
    setFundosManeio((fundosAnteriores) =>
      fundosAnteriores.map((fundo) => {
        if (format(fundo.mes, "yyyy-MM") === format(mesSelecionado, "yyyy-MM")) {
          const movimentoRemovido = fundo.movimentos.find((m) => m.id === movimentoId)
          const novosMovimentos = fundo.movimentos.filter((m) => m.id !== movimentoId)
          const novoSaldoFinal = movimentoRemovido
            ? fundo.saldoFinal -
              (movimentoRemovido.tipo === "entrada" ? movimentoRemovido.valor : -movimentoRemovido.valor)
            : fundo.saldoFinal

          return {
            ...fundo,
            movimentos: novosMovimentos,
            saldoFinal: novoSaldoFinal,
          }
        }
        return fundo
      }),
    )

    toast({
      title: "Movimento eliminado",
      description: "O movimento foi removido com sucesso.",
    })
  }

  const calcularSaldo = () => {
    if (!fundoManeioAtual) return 0

    // Calcular o saldo com base no saldo inicial e todos os movimentos
    const totalEntradas = fundoManeioAtual.movimentos
      .filter((m) => m.tipo === "entrada")
      .reduce((sum, m) => sum + m.valor, 0)

    const totalSaidas = fundoManeioAtual.movimentos
      .filter((m) => m.tipo === "saida")
      .reduce((sum, m) => sum + m.valor, 0)

    return fundoManeioAtual.saldoInicial + totalEntradas - totalSaidas
  }

  // Função para reparar dados corrompidos
  const repararDados = () => {
    try {
      // Limpar dados do fundo de maneio
      localStorage.removeItem("fundosManeio")

      // Recarregar a página para inicializar com dados limpos
      window.location.reload()

      toast({
        title: "Dados reparados",
        description: "Os dados do fundo de maneio foram reparados. A página será recarregada.",
      })
    } catch (error) {
      console.error("Erro ao reparar dados:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar reparar os dados.",
        variant: "destructive",
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text(`Fundo de Maneio - ${format(mesSelecionado, "MMMM yyyy", { locale: pt })}`, 14, 15)

    // @ts-ignore
    doc.autoTable({
      head: [["Data", "Tipo", "Valor", "Descrição"]],
      body:
        fundoManeioAtual?.movimentos.map((movimento) => [
          format(movimento.data, "dd/MM/yyyy", { locale: pt }),
          movimento.tipo === "entrada" ? "Entrada" : "Saída",
          `${movimento.valor.toFixed(2)} MZN`,
          movimento.descricao,
        ]) || [],
    })

    // Adicionar informações do usuário e espaço para assinatura
    const pageHeight = doc.internal.pageSize.height
    doc.text(`Preparado por: ${user?.fullName || "N/A"}`, 14, pageHeight - 50)
    doc.text("Assinatura: ____________________", 14, pageHeight - 40)
    doc.text(`Data: ${format(new Date(), "dd/MM/yyyy", { locale: pt })}`, 14, pageHeight - 30)

    doc.save(`fundo-maneio-${format(mesSelecionado, "yyyy-MM")}.pdf`)
  }

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      fundoManeioAtual?.movimentos.map((movimento) => ({
        Data: format(movimento.data, "dd/MM/yyyy", { locale: pt }),
        Tipo: movimento.tipo === "entrada" ? "Entrada" : "Saída",
        Valor: movimento.valor,
        Descrição: movimento.descricao,
      })) || [],
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Movimentos")

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.download = `fundo-maneio-${format(mesSelecionado, "yyyy-MM")}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const handleMesAnterior = () => {
    setMesSelecionado((mesAtual) => subMonths(mesAtual, 1))
  }

  const handleProximoMes = () => {
    setMesSelecionado((mesAtual) => addMonths(mesAtual, 1))
  }

  const handleTransportarSaldo = () => {
    const mesAtual = fundoManeioAtual
    if (!mesAtual) {
      toast({
        title: "Erro",
        description: "Não há fundo de maneio para o mês atual.",
        variant: "destructive",
      })
      return
    }

    const proximoMes = addMonths(mesSelecionado, 1)
    const fundoProximoMes = fundosManeio.find((fundo) => format(fundo.mes, "yyyy-MM") === format(proximoMes, "yyyy-MM"))

    if (fundoProximoMes) {
      toast({
        title: "Erro",
        description: "Já existe um fundo de maneio para o próximo mês.",
        variant: "destructive",
      })
      return
    }

    const novoFundoProximoMes: FundoManeioMensal = {
      id: uuidv4(),
      mes: startOfMonth(proximoMes),
      movimentos: [],
      saldoInicial: mesAtual.saldoFinal,
      saldoFinal: mesAtual.saldoFinal,
    }

    setFundosManeio((fundosAnteriores) => [...fundosAnteriores, novoFundoProximoMes])
    setMesSelecionado(proximoMes)

    toast({
      title: "Saldo transportado",
      description: `O saldo de ${mesAtual.saldoFinal.toFixed(2)} MZN foi transportado para ${format(
        proximoMes,
        "MMMM yyyy",
        {
          locale: pt,
        },
      )}.`,
    })
  }

  const handleVerDetalhes = (movimento: Movimento) => {
    setMovimentoSelecionado(movimento)
    setIsDetalhesDialogOpen(true)
  }

  // Expor a função adicionarMovimentoFundoManeio para o componente pai
  useEffect(() => {
    // Expor as funções para o objeto global window para permitir comunicação entre componentes
    // @ts-ignore
    window.fundoManeio = {
      adicionarMovimentoFundoManeio: (movimento: any) => {
        try {
          // Verificar se os dados necessários estão presentes
          if (!movimento.valor || movimento.valor <= 0 || !movimento.tipo) {
            toast({
              title: "Erro",
              description: "Dados incompletos para adicionar movimento ao fundo de maneio.",
              variant: "destructive",
            })
            return null
          }

          // Carregar fundos de maneio existentes
          const fundosManeioString = localStorage.getItem("fundosManeio")
          let fundosManeio = []

          if (fundosManeioString) {
            try {
              fundosManeio = JSON.parse(fundosManeioString, (key, value) => {
                if (key === "mes" || key === "data") {
                  return validarData(value)
                }
                return value
              })
            } catch (error) {
              console.error("Erro ao processar fundos de maneio:", error)
              fundosManeio = []
              // Fazer backup dos dados corrompidos
              localStorage.setItem("fundosManeio_backup", fundosManeioString)
            }
          }

          // Verificar se há pelo menos um fundo de maneio
          if (fundosManeio.length === 0) {
            // Criar um fundo de maneio inicial se não existir
            const novoFundo = {
              id: uuidv4(),
              mes: startOfMonth(new Date()),
              movimentos: [],
              saldoInicial: 0,
              saldoFinal: 0,
            }
            fundosManeio.push(novoFundo)
          }

          // Usar o primeiro fundo de maneio disponível
          const fundo = fundosManeio[0]

          // Verificar se há saldo suficiente para saídas
          if (movimento.tipo === "saida") {
            const saldoAtual = fundo.saldoFinal || fundo.saldoInicial || 0
            if (saldoAtual < movimento.valor) {
              toast({
                title: "Erro",
                description: `Saldo insuficiente no fundo de maneio. Saldo atual: ${saldoAtual.toFixed(2)} MZN`,
                variant: "destructive",
              })
              return null
            }
          }

          // Criar ID para o novo movimento
          const movimentoId = uuidv4()

          // Adicionar o movimento ao fundo
          const novoMovimento = {
            ...movimento,
            id: movimentoId,
            data: validarData(movimento.data) || new Date(),
          }

          if (!fundo.movimentos) {
            fundo.movimentos = []
          }

          fundo.movimentos.push(novoMovimento)

          // Atualizar o saldo final
          const saldoAtual = fundo.saldoFinal || fundo.saldoInicial || 0
          fundo.saldoFinal = movimento.tipo === "entrada" ? saldoAtual + movimento.valor : saldoAtual - movimento.valor

          // Salvar fundos atualizados
          localStorage.setItem("fundosManeio", JSON.stringify(fundosManeio))

          // Atualizar o estado local para refletir as mudanças
          setFundosManeio(fundosManeio)

          toast({
            title: "Movimento adicionado",
            description: "O movimento foi adicionado ao fundo de maneio com sucesso.",
          })

          return movimentoId
        } catch (error) {
          console.error("Erro ao adicionar movimento ao fundo de maneio:", error)
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao adicionar o movimento ao fundo de maneio.",
            variant: "destructive",
          })
          return null
        }
      },
      getFundoManeioAtual: () => {
        return fundoManeioAtual
      },
      getSaldoAtual: () => {
        return calcularSaldo()
      },
    }
  }, [fundosManeio, fundoManeioAtual])

  if (isLoading) {
    return (
      <PrintLayout title="Fundo de Maneio">
        <Card>
          <CardHeader className="bg-red-700 text-white">
            <CardTitle>Fundo de Maneio</CardTitle>
            <CardDescription className="text-red-100">Carregando dados...</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex justify-center items-center h-64">
            <p>Carregando dados do fundo de maneio...</p>
          </CardContent>
        </Card>
      </PrintLayout>
    )
  }

  return (
    <PrintLayout title="Fundo de Maneio">
      <Card>
        <CardHeader className="bg-red-700 text-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Fundo de Maneio</CardTitle>
              <CardDescription className="text-red-100">Gerencie os movimentos do fundo de maneio</CardDescription>
            </div>
            <div className="space-x-2">
              <Button onClick={handlePrint} className="print:hidden bg-red-600 text-white hover:bg-red-500">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleExportPDF} className="print:hidden bg-red-600 text-white hover:bg-red-500">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button onClick={handleExportExcel} className="print:hidden bg-red-600 text-white hover:bg-red-500">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button onClick={handleMesAnterior}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold">{format(mesSelecionado, "MMMM yyyy", { locale: pt })}</span>
              <Button onClick={handleProximoMes}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-x-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Adicionar Movimento</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Adicionar Novo Movimento</DialogTitle>
                    <DialogDescription>Preencha os detalhes do novo movimento</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="data" className="text-sm font-medium mb-2 block">
                          Data (opcional)
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                              {novoMovimento.data ? (
                                format(novoMovimento.data, "dd/MM/yyyy", { locale: pt })
                              ) : (
                                <span>Data atual</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={novoMovimento.data}
                              onSelect={(date) => setNovoMovimento({ ...novoMovimento, data: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="tipo" className="text-sm font-medium mb-2 block">
                          Tipo <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={novoMovimento.tipo}
                          onValueChange={(value) =>
                            setNovoMovimento({ ...novoMovimento, tipo: value as "entrada" | "saida" })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entrada">Entrada</SelectItem>
                            <SelectItem value="saida">Saída</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="valor" className="text-sm font-medium mb-2 block">
                          Valor <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="valor"
                          type="number"
                          value={novoMovimento.valor || ""}
                          onChange={(e) => setNovoMovimento({ ...novoMovimento, valor: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="descricao" className="text-sm font-medium mb-2 block">
                          Descrição (opcional)
                        </Label>
                        <Input
                          id="descricao"
                          value={novoMovimento.descricao || ""}
                          onChange={(e) => setNovoMovimento({ ...novoMovimento, descricao: e.target.value })}
                          className="w-full"
                          placeholder="Descrição do movimento"
                        />
                      </div>
                      {!fundoManeioAtual && (
                        <div>
                          <Label htmlFor="saldoInicial" className="text-sm font-medium mb-2 block">
                            Saldo Inicial
                          </Label>
                          <Input
                            id="saldoInicial"
                            type="number"
                            value={saldoInicial}
                            onChange={(e) => setSaldoInicial(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      )}
                      <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-md border border-gray-200">
                        <p>
                          <span className="text-red-500">*</span> Campos obrigatórios
                        </p>
                        <p className="mt-1">Se a data não for especificada, será usada a data atual.</p>
                        <p className="mt-1">Se a descrição não for fornecida, será usado um texto padrão.</p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddMovimento}>Adicionar Movimento</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Botão de Reposição de Fundo de Maneio */}
              <Dialog open={isReposicaoDialogOpen} onOpenChange={setIsReposicaoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Reposição
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Reposição de Fundo de Maneio</DialogTitle>
                    <DialogDescription>Registre uma reposição do fundo de maneio</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="reposicao-data" className="text-sm font-medium mb-2 block">
                          Data
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                              {format(reposicao.data, "dd/MM/yyyy", { locale: pt })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={reposicao.data}
                              onSelect={(date) => setReposicao({ ...reposicao, data: date || new Date() })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="reposicao-valor" className="text-sm font-medium mb-2 block">
                          Valor <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="reposicao-valor"
                          type="number"
                          value={reposicao.valor || ""}
                          onChange={(e) => setReposicao({ ...reposicao, valor: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reposicao-descricao" className="text-sm font-medium mb-2 block">
                          Descrição
                        </Label>
                        <Input
                          id="reposicao-descricao"
                          value={reposicao.descricao}
                          onChange={(e) => setReposicao({ ...reposicao, descricao: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-md border border-gray-200">
                        <p>
                          <span className="text-red-500">*</span> Campos obrigatórios
                        </p>
                        <p className="mt-1">
                          A reposição criará automaticamente um pagamento e uma transação bancária associados.
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsReposicaoDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleReposicaoFundoManeio} className="bg-green-600 hover:bg-green-700">
                      Confirmar Reposição
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button onClick={handleTransportarSaldo}>Transportar Saldo</Button>

              {/* Botão para reparar dados */}
              <Button
                variant="outline"
                className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                onClick={repararDados}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reparar Dados
              </Button>
            </div>
          </div>
          <div className="text-2xl font-bold mb-4">Saldo Atual: {calcularSaldo().toFixed(2)} MZN</div>
          <Table>
            <TableHeader className="bg-red-600">
              <TableRow>
                <TableHead className="font-semibold text-white">Data</TableHead>
                <TableHead className="font-semibold text-white">Tipo</TableHead>
                <TableHead className="font-semibold text-white">Valor</TableHead>
                <TableHead className="font-semibold text-white">Descrição</TableHead>
                <TableHead className="font-semibold text-white">Origem</TableHead>
                <TableHead className="font-semibold text-white">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fundoManeioAtual?.movimentos.map((movimento, index) => (
                <TableRow key={movimento.id}>
                  <TableCell>{format(movimento.data, "dd/MM/yyyy", { locale: pt })}</TableCell>
                  <TableCell>{movimento.tipo === "entrada" ? "Entrada" : "Saída"}</TableCell>
                  <TableCell>{movimento.valor.toFixed(2)} MZN</TableCell>
                  <TableCell>{movimento.descricao}</TableCell>
                  <TableCell>
                    {movimento.reposicaoId ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Reposição
                      </Badge>
                    ) : movimento.pagamentoId ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Pagamento
                      </Badge>
                    ) : (
                      "Manual"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {movimento.pagamentoId || movimento.reposicaoId ? (
                        <Button variant="outline" size="sm" onClick={() => handleVerDetalhes(movimento)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteMovimento(movimento.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Diálogo de detalhes do movimento */}
          <Dialog open={isDetalhesDialogOpen} onOpenChange={setIsDetalhesDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Detalhes do Movimento</DialogTitle>
                <DialogDescription>Informações sobre o movimento relacionado a um pagamento</DialogDescription>
              </DialogHeader>
              {movimentoSelecionado && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">Data:</Label>
                    <div className="col-span-3">{format(movimentoSelecionado.data, "dd/MM/yyyy", { locale: pt })}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">Tipo:</Label>
                    <div className="col-span-3">{movimentoSelecionado.tipo === "entrada" ? "Entrada" : "Saída"}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">Valor:</Label>
                    <div className="col-span-3">{movimentoSelecionado.valor.toFixed(2)} MZN</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">Descrição:</Label>
                    <div className="col-span-3">{movimentoSelecionado.descricao}</div>
                  </div>
                  {movimentoSelecionado.reposicaoId && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right font-semibold">Origem:</Label>
                      <div className="col-span-3">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Reposição de Fundo de Maneio
                        </Badge>
                      </div>
                    </div>
                  )}
                  {movimentoSelecionado.pagamentoId && !movimentoSelecionado.reposicaoId && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right font-semibold">Pagamento:</Label>
                        <div className="col-span-3">{movimentoSelecionado.pagamentoReferencia}</div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right font-semibold">Fornecedor:</Label>
                        <div className="col-span-3">{movimentoSelecionado.fornecedorNome}</div>
                      </div>
                    </>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setIsDetalhesDialogOpen(false)}>Fechar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Adicione esta seção no final do CardContent */}
          <div className="mt-8 print:block hidden">
            <div className="flex justify-between items-center">
              <div>
                <p>Preparado por: {user?.fullName || "N/A"}</p>
                <p>Data: {format(new Date(), "dd/MM/yyyy", { locale: pt })}</p>
              </div>
              <div>
                <p>Assinatura: ____________________</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

