"use client"

import { useState, useEffect } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { PrintLayout } from "@/components/print-layout"
import { Printer } from "lucide-react"
import { format, startOfMonth, endOfMonth, addMonths, subMonths, getYear, getMonth } from "date-fns"
import * as XLSX from "xlsx"
import { useAppContext } from "@/contexts/AppContext"

// Tipos para orçamento
type ItemOrcamento = {
  id: string
  departamento: string
  valorPrevisto: number
  descricao: string
}

type Orcamento = {
  id: string
  ano: number
  mes: number
  itens: ItemOrcamento[]
}

export function PrevisaoOrcamento() {
  const { fornecedores } = useAppContext()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [mesSelecionado, setMesSelecionado] = useState<Date>(startOfMonth(new Date()))
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [novoItem, setNovoItem] = useState<Partial<ItemOrcamento>>({})
  const [itemEditando, setItemEditando] = useState<ItemOrcamento | null>(null)
  const [activeTab, setActiveTab] = useState("orcamento")

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const dadosSalvos = localStorage.getItem("orcamentos")
    if (dadosSalvos) {
      setOrcamentos(JSON.parse(dadosSalvos))
    }
  }, [])

  // Salvar dados no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem("orcamentos", JSON.stringify(orcamentos))
  }, [orcamentos])

  // Obter o orçamento do mês atual
  const orcamentoAtual = orcamentos.find(
    (o) => o.ano === getYear(mesSelecionado) && o.mes === getMonth(mesSelecionado) + 1,
  )

  // Obter todos os pagamentos do mês atual
  const pagamentosDoMes = fornecedores.flatMap((fornecedor) =>
    fornecedor.pagamentos.filter((pagamento) => {
      const dataPagamento = pagamento.dataPagamento
        ? new Date(pagamento.dataPagamento)
        : new Date(pagamento.dataVencimento)
      return (
        dataPagamento >= startOfMonth(mesSelecionado) &&
        dataPagamento <= endOfMonth(mesSelecionado) &&
        pagamento.tipo === "fatura"
      )
    }),
  )

  // Calcular valores realizados por departamento
  const valoresRealizados = pagamentosDoMes.reduce(
    (acc, pagamento) => {
      const departamento = pagamento.departamento
      if (!acc[departamento]) {
        acc[departamento] = 0
      }
      acc[departamento] += pagamento.valor
      return acc
    },
    {} as Record<string, number>,
  )

  // Preparar dados para o gráfico
  const dadosGrafico =
    orcamentoAtual?.itens.map((item) => ({
      departamento: item.departamento,
      previsto: item.valorPrevisto,
      realizado: valoresRealizados[item.departamento] || 0,
      percentual: valoresRealizados[item.departamento]
        ? Math.round((valoresRealizados[item.departamento] / item.valorPrevisto) * 100)
        : 0,
    })) || []

  // Calcular totais
  const totalPrevisto = orcamentoAtual?.itens.reduce((acc, item) => acc + item.valorPrevisto, 0) || 0
  const totalRealizado = Object.values(valoresRealizados).reduce((acc, valor) => acc + valor, 0)
  const percentualTotal = totalPrevisto > 0 ? Math.round((totalRealizado / totalPrevisto) * 100) : 0

  const handleMesAnterior = () => {
    setMesSelecionado((mesAtual) => subMonths(mesAtual, 1))
  }

  const handleProximoMes = () => {
    setMesSelecionado((mesAtual) => addMonths(mesAtual, 1))
  }

  const handleAddItem = () => {
    if (!novoItem.departamento || !novoItem.valorPrevisto) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const ano = getYear(mesSelecionado)
    const mes = getMonth(mesSelecionado) + 1

    // Verificar se já existe um orçamento para este mês
    const orcamentoExistente = orcamentos.find((o) => o.ano === ano && o.mes === mes)

    if (orcamentoExistente) {
      // Adicionar item ao orçamento existente
      const novosOrcamentos = orcamentos.map((o) => {
        if (o.id === orcamentoExistente!.id) {
          return {
            ...o,
            itens: [
              ...o.itens,
              {
                id: Date.now().toString(),
                departamento: novoItem.departamento!,
                valorPrevisto: novoItem.valorPrevisto!,
                descricao: novoItem.descricao || "",
              },
            ],
          }
        }
        return o
      })
      setOrcamentos(novosOrcamentos)
    } else {
      // Criar novo orçamento para este mês
      const novoOrcamento: Orcamento = {
        id: Date.now().toString(),
        ano,
        mes,
        itens: [
          {
            id: Date.now().toString(),
            departamento: novoItem.departamento!,
            valorPrevisto: novoItem.valorPrevisto!,
            descricao: novoItem.descricao || "",
          },
        ],
      }
      setOrcamentos([...orcamentos, novoOrcamento])
    }

    setNovoItem({})
    setIsAddDialogOpen(false)
    toast({
      title: "Item adicionado",
      description: "O item foi adicionado ao orçamento com sucesso.",
    })
  }

  const handleEditItem = () => {
    if (!itemEditando || !itemEditando.departamento || !itemEditando.valorPrevisto) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const novosOrcamentos = orcamentos.map((o) => {
      if (o.ano === getYear(mesSelecionado) && o.mes === getMonth(mesSelecionado) + 1) {
        return {
          ...o,
          itens: o.itens.map((item) => (item.id === itemEditando.id ? itemEditando : item)),
        }
      }
      return o
    })

    setOrcamentos(novosOrcamentos)
    setItemEditando(null)
    setIsEditDialogOpen(false)
    toast({
      title: "Item atualizado",
      description: "O item foi atualizado com sucesso.",
    })
  }

  const handleDeleteItem = (itemId: string) => {
    const novosOrcamentos = orcamentos.map((o) => {
      if (o.ano === getYear(mesSelecionado) && o.mes === getMonth(mesSelecionado) + 1) {
        return {
          ...o,
          itens: o.itens.filter((item) => item.id !== itemId),
        }
      }
      return o
    })

    // Remover orçamentos vazios
    const orcamentosFiltrados = novosOrcamentos.filter((o) => o.itens.length > 0)

    setOrcamentos(orcamentosFiltrados)
    toast({
      title: "Item removido",
      description: "O item foi removido do orçamento com sucesso.",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    if (!orcamentoAtual) {
      toast({
        title: "Erro",
        description: "Não há orçamento para exportar neste mês.",
        variant: "destructive",
      })
      return
    }

    const dadosExport = orcamentoAtual.itens.map((item) => ({
      Departamento: item.departamento,
      "Valor Previsto": item.valorPrevisto.toFixed(2),
      "Valor Realizado": (valoresRealizados[item.departamento] || 0).toFixed(2),
      "% Execução": valoresRealizados[item.departamento]
        ? Math.round((valoresRealizados[item.departamento] / item.valorPrevisto) * 100) + "%"
        : "0%",
      Descrição: item.descricao,
    }))

    // Adicionar linha de total
    dadosExport.push({
      Departamento: "TOTAL",
      "Valor Previsto": totalPrevisto.toFixed(2),
      "Valor Realizado": totalRealizado.toFixed(2),
      "% Execução": percentualTotal + "%",
      Descrição: "",
    })

    const ws = XLSX.utils.json_to_sheet(dadosExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Orçamento")

    // Gerar arquivo Excel e iniciar download
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.download = `orcamento-${format(mesSelecionado, "yyyy-MM")}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <PrintLayout title="Previsão e Orçamento">
      <Card className="w-full">
        <CardHeader className="bg-red-600 text-white">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Previsão e Orçamento</CardTitle>
              <CardDescription>Gerencie o orçamento mensal e acompanhe a execução</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handlePrint} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleExportExcel} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        {/* Conteúdo do Card */}
      </Card>
    </PrintLayout>
  )
}

