"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PrintLayout } from "@/components/print-layout"
import { useAppContext } from "@/contexts/AppContext"
import { format, isWithinInterval, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { pt } from "date-fns/locale"
import {
  Printer,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Edit,
  Trash,
  MoreHorizontal,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { DateRange } from "react-day-picker"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Cores para os gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

export function DemonstracaoResultados() {
  const { fornecedores, receitas, addReceita, updateReceita, deleteReceita, clientes = [] } = useAppContext()
  const hoje = new Date()

  // Estados para filtros
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>("ano")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(hoje),
    to: endOfYear(hoje),
  })
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState<string>("todos")
  const [visualizacao, setVisualizacao] = useState<string>("mensal")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    descricao: "",
    valor: 0,
    dataRecebimento: "",
    dataPrevisao: format(hoje, "yyyy-MM-dd"),
    estado: "prevista",
    metodo: "transferência",
    categoria: "",
    observacoes: "",
    documentoFiscal: false,
    cliente: "",
    reconciliado: false,
  })

  const [receitaSelecionada, setReceitaSelecionada] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Calcular período com base na seleção
  const periodo = useMemo(() => {
    if (periodoSelecionado === "mes") {
      return {
        from: startOfMonth(hoje),
        to: endOfMonth(hoje),
      }
    } else if (periodoSelecionado === "trimestre") {
      return {
        from: subMonths(hoje, 3),
        to: hoje,
      }
    } else if (periodoSelecionado === "semestre") {
      return {
        from: subMonths(hoje, 6),
        to: hoje,
      }
    } else if (periodoSelecionado === "ano") {
      return {
        from: startOfYear(hoje),
        to: endOfYear(hoje),
      }
    } else {
      return dateRange
    }
  }, [periodoSelecionado, dateRange, hoje])

  // Obter lista de departamentos únicos
  const departamentos = useMemo(() => {
    const deps = new Set<string>()
    fornecedores.forEach((fornecedor) => {
      fornecedor.pagamentos.forEach((pagamento) => {
        if (pagamento.departamento) {
          deps.add(pagamento.departamento)
        }
      })
    })
    return Array.from(deps)
  }, [fornecedores])

  // Filtrar despesas (pagamentos) com base nos critérios
  const despesasFiltradas = useMemo(() => {
    if (!periodo.from || !periodo.to) return []

    return fornecedores.flatMap((fornecedor) =>
      fornecedor.pagamentos
        .filter((pagamento) => {
          const dataVencimento = new Date(pagamento.dataVencimento)
          const isWithinPeriod = isWithinInterval(dataVencimento, {
            start: periodo.from!,
            end: periodo.to!,
          })
          const matchesDepartamento =
            departamentoSelecionado === "todos" || pagamento.departamento === departamentoSelecionado

          return isWithinPeriod && matchesDepartamento
        })
        .map((pagamento) => ({
          ...pagamento,
          fornecedorNome: fornecedor.nome,
          fornecedorId: fornecedor.id,
        })),
    )
  }, [fornecedores, periodo, departamentoSelecionado])

  // Filtrar receitas com base nos critérios
  const receitasFiltradas = useMemo(() => {
    if (!periodo.from || !periodo.to) return []

    return receitas.filter((receita) => {
      const dataParaFiltro = receita.dataRecebimento || receita.dataPrevisao
      return isWithinInterval(dataParaFiltro, {
        start: periodo.from!,
        end: periodo.to!,
      })
    })
  }, [receitas, periodo])

  // Calcular totais
  const totalReceitas = useMemo(() => {
    return receitasFiltradas.reduce((acc, curr) => acc + curr.valor, 0)
  }, [receitasFiltradas])

  const totalDespesas = useMemo(() => {
    return despesasFiltradas.reduce((acc, curr) => acc + curr.valor, 0)
  }, [despesasFiltradas])

  const resultado = useMemo(() => {
    return totalReceitas - totalDespesas
  }, [totalReceitas, totalDespesas])

  // Dados para gráficos
  const dadosMensais = useMemo(() => {
    const meses: Record<number, { receitas: number; despesas: number }> = {}

    // Inicializar todos os meses do período
    for (let i = 0; i < 12; i++) {
      meses[i] = { receitas: 0, despesas: 0 }
    }

    // Somar receitas por mês
    receitasFiltradas.forEach((receita) => {
      const dataParaFiltro = receita.dataRecebimento || receita.dataPrevisao
      // Garantir que dataParaFiltro é um objeto Date válido
      const dataComoDate = dataParaFiltro instanceof Date ? dataParaFiltro : new Date(dataParaFiltro)
      const mes = dataComoDate.getMonth()
      meses[mes].receitas += receita.valor
    })

    // Somar despesas por mês
    despesasFiltradas.forEach((despesa) => {
      // Garantir que a data é um objeto Date válido
      const dataComoDate = new Date(despesa.dataVencimento)
      const mes = dataComoDate.getMonth()
      meses[mes].despesas += despesa.valor
    })

    // Converter para array para o gráfico
    return Object.entries(meses).map(([mes, valores]) => ({
      mes: format(new Date(2023, Number.parseInt(mes), 1), "MMM", { locale: pt }),
      receitas: valores.receitas,
      despesas: valores.despesas,
      resultado: valores.receitas - valores.despesas,
    }))
  }, [receitasFiltradas, despesasFiltradas])

  // Dados para o gráfico de pizza de receitas por categoria
  const receitasPorCategoria = useMemo(() => {
    const categorias: Record<string, number> = {}

    receitasFiltradas.forEach((receita) => {
      if (!categorias[receita.categoria]) {
        categorias[receita.categoria] = 0
      }
      categorias[receita.categoria] += receita.valor
    })

    return Object.entries(categorias).map(([categoria, valor]) => ({
      categoria,
      valor,
    }))
  }, [receitasFiltradas])

  // Dados para o gráfico de pizza de despesas por departamento
  const despesasPorDepartamento = useMemo(() => {
    const deps: Record<string, number> = {}

    despesasFiltradas.forEach((despesa) => {
      if (!deps[despesa.departamento]) {
        deps[despesa.departamento] = 0
      }
      deps[despesa.departamento] += despesa.valor
    })

    return Object.entries(deps).map(([departamento, valor]) => ({
      departamento,
      valor,
    }))
  }, [despesasFiltradas])

  // Calcular indicadores financeiros
  const indicadores = useMemo(() => {
    // Margem bruta (Receita - Despesa) / Receita
    const margemBruta = totalReceitas > 0 ? (resultado / totalReceitas) * 100 : 0

    // Relação Despesa/Receita
    const relacaoDespesaReceita = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0

    // Crescimento de receita (simulado)
    // Em um sistema real, isso seria calculado comparando com períodos anteriores
    const crescimentoReceita = 8.5

    // Crescimento de despesa (simulado)
    const crescimentoDespesa = 6.2

    return {
      margemBruta,
      relacaoDespesaReceita,
      crescimentoReceita,
      crescimentoDespesa,
    }
  }, [totalReceitas, totalDespesas, resultado])

  // Função para exportar dados em CSV
  const exportarCSV = () => {
    // Cabeçalho do CSV
    let csv = "Tipo,Descrição,Valor,Data\n"

    // Adicionar receitas
    receitasFiltradas.forEach((receita) => {
      const dataParaExportar = receita.dataRecebimento || receita.dataPrevisao
      csv += `"Receita","${receita.descricao}",${receita.valor},"${format(dataParaExportar, "dd/MM/yyyy")}"\n`
    })

    // Adicionar despesas
    despesasFiltradas.forEach((despesa) => {
      csv += `"Despesa","${despesa.fornecedorNome} - ${despesa.referencia}",${despesa.valor},"${format(
        new Date(despesa.dataVencimento),
        "dd/MM/yyyy",
      )}"\n`
    })

    // Criar blob e link para download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `demonstracao-resultados-${format(hoje, "dd-MM-yyyy")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Função para imprimir o relatório
  const handlePrint = () => {
    window.print()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    if (type === "number") {
      setFormData({ ...formData, [name]: Number.parseFloat(value) || 0 })
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked })
  }

  const resetForm = () => {
    setFormData({
      id: "",
      descricao: "",
      valor: 0,
      dataRecebimento: "",
      dataPrevisao: format(hoje, "yyyy-MM-dd"),
      estado: "prevista",
      metodo: "transferência",
      categoria: "",
      observacoes: "",
      documentoFiscal: false,
      cliente: "",
      reconciliado: false,
    })
  }

  const handleOpenDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Create a unique ID for the new receipt
      const newId = `receita-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      const novaReceita = {
        id: newId,
        descricao: formData.descricao,
        valor: formData.valor,
        dataRecebimento: formData.dataRecebimento ? new Date(formData.dataRecebimento) : null,
        dataPrevisao: new Date(formData.dataPrevisao),
        estado: formData.estado as "prevista" | "recebida" | "atrasada" | "cancelada",
        metodo: formData.metodo as "transferência" | "depósito" | "cheque" | "dinheiro" | "outro",
        categoria: formData.categoria,
        observacoes: formData.observacoes,
        documentoFiscal: formData.documentoFiscal,
        cliente: formData.cliente,
        reconciliado: formData.reconciliado,
        historico: [],
      }

      // Verificar se todos os campos obrigatórios estão preenchidos
      if (!novaReceita.descricao || !novaReceita.valor || !novaReceita.categoria || !novaReceita.cliente) {
        toast({
          title: "Erro ao adicionar receita",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        })
        return
      }

      console.log("Adicionando nova receita:", novaReceita)

      // Adicionar a receita e mostrar feedback ao usuário
      addReceita(novaReceita)
        .then(() => {
          toast({
            title: "Receita adicionada",
            description: "A receita foi adicionada com sucesso.",
            variant: "default",
          })
          handleCloseDialog()
        })
        .catch((error) => {
          console.error("Erro ao adicionar receita:", error)
          toast({
            title: "Erro ao adicionar receita",
            description: "Ocorreu um erro ao adicionar a receita. Por favor, tente novamente.",
            variant: "destructive",
          })
        })
    } catch (error) {
      console.error("Erro ao adicionar receita:", error)
      toast({
        title: "Erro ao adicionar receita",
        description: "Ocorreu um erro ao adicionar a receita. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditReceita = () => {
    if (!receitaSelecionada) return

    try {
      // Garantir que as datas estão no formato correto
      const receitaAtualizada = {
        ...receitaSelecionada,
        dataRecebimento: receitaSelecionada.dataRecebimento ? new Date(receitaSelecionada.dataRecebimento) : null,
        dataPrevisao: new Date(receitaSelecionada.dataPrevisao),
      }

      // Chamar a função do contexto para atualizar a receita
      updateReceita(receitaAtualizada)
        .then(() => {
          toast({
            title: "Receita atualizada",
            description: "A receita foi atualizada com sucesso.",
          })
          setIsEditDialogOpen(false)
        })
        .catch((error) => {
          console.error("Erro ao atualizar receita:", error)
          toast({
            title: "Erro ao atualizar receita",
            description: "Ocorreu um erro ao atualizar a receita. Por favor, tente novamente.",
            variant: "destructive",
          })
        })
    } catch (error) {
      console.error("Erro ao atualizar receita:", error)
      toast({
        title: "Erro ao atualizar receita",
        description: "Ocorreu um erro ao atualizar a receita. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteReceita = () => {
    if (!receitaSelecionada) return

    try {
      // Chamar a função do contexto para eliminar a receita
      deleteReceita(receitaSelecionada.id)
        .then(() => {
          toast({
            title: "Receita eliminada",
            description: "A receita foi eliminada com sucesso.",
          })
          setIsDeleteDialogOpen(false)
        })
        .catch((error) => {
          console.error("Erro ao eliminar receita:", error)
          toast({
            title: "Erro ao eliminar receita",
            description: "Ocorreu um erro ao eliminar a receita. Por favor, tente novamente.",
            variant: "destructive",
          })
        })
    } catch (error) {
      console.error("Erro ao eliminar receita:", error)
      toast({
        title: "Erro ao eliminar receita",
        description: "Ocorreu um erro ao eliminar a receita. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <PrintLayout title="Demonstração de Resultados">
      <Card className="w-full">
        <CardHeader className="bg-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Demonstração de Resultados</CardTitle>
              <CardDescription>Análise de receitas, despesas e resultados financeiros</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleOpenDialog} className="print:hidden bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Receita
              </Button>
              <Button onClick={handlePrint} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={exportarCSV} className="print:hidden bg-blue-600 text-white hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="visao-geral" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="receitas">Receitas</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
              <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
            </TabsList>

            {/* Aba de Visão Geral */}
            <TabsContent value="visao-geral" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total de Receitas</CardTitle>
                    <CardDescription>
                      {periodo.from && periodo.to
                        ? `${format(periodo.from, "dd/MM/yyyy")} - ${format(periodo.to, "dd/MM/yyyy")}`
                        : "Período selecionado"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                      <div className="text-3xl font-bold text-green-600">
                        {totalReceitas.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                      </div>
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600">
                        +{indicadores.crescimentoReceita.toFixed(1)}% vs. período anterior
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total de Despesas</CardTitle>
                    <CardDescription>
                      {periodo.from && periodo.to
                        ? `${format(periodo.from, "dd/MM/yyyy")} - ${format(periodo.to, "dd/MM/yyyy")}`
                        : "Período selecionado"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-red-500 mr-2" />
                      <div className="text-3xl font-bold text-red-600">
                        {totalDespesas.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                      </div>
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-600">
                        +{indicadores.crescimentoDespesa.toFixed(1)}% vs. período anterior
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Resultado</CardTitle>
                    <CardDescription>Receitas - Despesas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
                      <div className={`text-3xl font-bold ${resultado >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {resultado.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                      </div>
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      {resultado >= 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-blue-600">Resultado positivo</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-red-600">Resultado negativo</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Evolução Mensal</CardTitle>
                  <CardDescription>Receitas, Despesas e Resultado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosMensais} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis
                          tickFormatter={(value) =>
                            value.toLocaleString("pt-MZ", {
                              style: "currency",
                              currency: "MZN",
                              notation: "compact",
                              maximumFractionDigits: 1,
                            })
                          }
                        />
                        <Tooltip
                          formatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                        />
                        <Legend />
                        <Bar dataKey="receitas" name="Receitas" fill="#4ade80" />
                        <Bar dataKey="despesas" name="Despesas" fill="#f87171" />
                        <Bar dataKey="resultado" name="Resultado" fill="#60a5fa" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Receitas por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={receitasPorCategoria}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="valor"
                            nameKey="categoria"
                            label={({ categoria, percent }) => `${categoria}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {receitasPorCategoria && receitasPorCategoria.length > 0
                              ? receitasPorCategoria.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))
                              : null}
                          </Pie>
                          <Tooltip
                            formatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Despesas por Departamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={despesasPorDepartamento}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="valor"
                            nameKey="departamento"
                            label={({ departamento, percent }) => `${departamento}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {despesasPorDepartamento && despesasPorDepartamento.length > 0
                              ? despesasPorDepartamento.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))
                              : null}
                          </Pie>
                          <Tooltip
                            formatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba de Receitas */}
            <TabsContent value="receitas" className="pt-6">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Detalhamento de Receitas</CardTitle>
                  <CardDescription>
                    {periodo.from && periodo.to
                      ? `${format(periodo.from, "dd/MM/yyyy")} - ${format(periodo.to, "dd/MM/yyyy")}`
                      : "Período selecionado"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receitasFiltradas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                            Nenhuma receita encontrada para o período selecionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        receitasFiltradas.map((receita, index) => (
                          <TableRow key={receita.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell className="font-medium">{receita.descricao}</TableCell>
                            <TableCell>{receita.categoria}</TableCell>
                            <TableCell>{receita.cliente}</TableCell>
                            <TableCell>
                              {format(receita.dataRecebimento || receita.dataPrevisao, "dd/MM/yyyy", { locale: pt })}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  receita.estado === "recebida"
                                    ? "bg-green-100 text-green-800"
                                    : receita.estado === "prevista"
                                      ? "bg-blue-100 text-blue-800"
                                      : receita.estado === "atrasada"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {receita.estado}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {receita.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                            </TableCell>
                            <TableCell className="text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Abrir menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setReceitaSelecionada(receita)
                                      setIsEditDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      setReceitaSelecionada(receita)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Receitas por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={receitasPorCategoria} layout="vertical" margin={{ left: 20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            tickFormatter={(value) =>
                              value.toLocaleString("pt-MZ", {
                                style: "currency",
                                currency: "MZN",
                                notation: "compact",
                                maximumFractionDigits: 1,
                              })
                            }
                          />
                          <YAxis type="category" dataKey="categoria" width={120} />
                          <Tooltip
                            formatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          />
                          <Bar dataKey="valor" fill="#4ade80">
                            {receitasPorCategoria.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Evolução de Receitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dadosMensais} margin={{ left: 20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis
                            tickFormatter={(value) =>
                              value.toLocaleString("pt-MZ", {
                                style: "currency",
                                currency: "MZN",
                                notation: "compact",
                                maximumFractionDigits: 1,
                              })
                            }
                          />
                          <Tooltip
                            formatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#4ade80" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba de Despesas */}
            <TabsContent value="despesas" className="pt-6">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Detalhamento de Despesas</CardTitle>
                  <CardDescription>
                    {periodo.from && periodo.to
                      ? `${format(periodo.from, "dd/MM/yyyy")} - ${format(periodo.to, "dd/MM/yyyy")}`
                      : "Período selecionado"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {despesasFiltradas && despesasFiltradas.length > 0 ? (
                        despesasFiltradas.map((despesa, index) => (
                          <TableRow key={despesa.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell className="font-medium">{despesa.fornecedorNome}</TableCell>
                            <TableCell>{despesa.referencia}</TableCell>
                            <TableCell>{despesa.departamento}</TableCell>
                            <TableCell>
                              {format(new Date(despesa.dataVencimento), "dd/MM/yyyy", { locale: pt })}
                            </TableCell>
                            <TableCell className="text-right">
                              {despesa.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  despesa.estado === "pago"
                                    ? "bg-green-100 text-green-800"
                                    : despesa.estado === "pendente"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : despesa.estado === "atrasado"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {despesa.estado}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                            Nenhuma despesa encontrada para o período selecionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Despesas por Departamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={despesasPorDepartamento} layout="vertical" margin={{ left: 20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            tickFormatter={(value) =>
                              value.toLocaleString("pt-MZ", {
                                style: "currency",
                                currency: "MZN",
                                notation: "compact",
                                maximumFractionDigits: 1,
                              })
                            }
                          />
                          <YAxis type="category" dataKey="departamento" width={120} />
                          <Tooltip
                            formatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          />
                          <Bar dataKey="valor" fill="#f87171">
                            {despesasPorDepartamento.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Evolução de Despesas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dadosMensais} margin={{ left: 20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis
                            tickFormatter={(value) =>
                              value.toLocaleString("pt-MZ", {
                                style: "currency",
                                currency: "MZN",
                                notation: "compact",
                                maximumFractionDigits: 1,
                              })
                            }
                          />
                          <Tooltip
                            formatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#f87171" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba de Indicadores */}
            <TabsContent value="indicadores" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Margem Bruta</CardTitle>
                    <CardDescription>(Receitas - Despesas) / Receitas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <div className="text-5xl font-bold mb-4">{indicadores.margemBruta.toFixed(1)}%</div>
                      <div className="w-full max-w-md">
                        <Progress
                          value={indicadores.margemBruta}
                          className="h-4"
                          indicatorClassName={
                            indicadores.margemBruta <= 0
                              ? "bg-red-500"
                              : indicadores.margemBruta <= 10
                                ? "bg-yellow-500"
                                : indicadores.margemBruta <= 20
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                          }
                        />
                        <div className="flex justify-between mt-2 text-sm text-gray-500">
                          <span>0%</span>
                          <span>10%</span>
                          <span>20%</span>
                          <span>30%</span>
                          <span>40%+</span>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                          A margem bruta indica a porcentagem de cada unidade monetária de receita que resta após o
                          pagamento das despesas.
                        </p>
                        <p
                          className={`mt-2 font-medium ${
                            indicadores.margemBruta <= 0
                              ? "text-red-600"
                              : indicadores.margemBruta <= 10
                                ? "text-yellow-600"
                                : indicadores.margemBruta <= 20
                                  ? "text-blue-600"
                                  : "text-green-600"
                          }`}
                        >
                          {indicadores.margemBruta <= 0
                            ? "Crítico: Operando com prejuízo"
                            : indicadores.margemBruta <= 10
                              ? "Atenção: Margem baixa"
                              : indicadores.margemBruta <= 20
                                ? "Bom: Margem adequada"
                                : "Excelente: Margem alta"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Relação Despesa/Receita</CardTitle>
                    <CardDescription>Despesas / Receitas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <div className="text-5xl font-bold mb-4">{indicadores.relacaoDespesaReceita.toFixed(1)}%</div>
                      <div className="w-full max-w-md">
                        <Progress
                          value={indicadores.relacaoDespesaReceita}
                          className="h-4"
                          indicatorClassName={
                            indicadores.relacaoDespesaReceita <= 60
                              ? "bg-green-500"
                              : indicadores.relacaoDespesaReceita <= 80
                                ? "bg-blue-500"
                                : indicadores.relacaoDespesaReceita <= 100
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                          }
                        />
                        <div className="flex justify-between mt-2 text-sm text-gray-500">
                          <span>0%</span>
                          <span>60%</span>
                          <span>80%</span>
                          <span>100%</span>
                          <span>120%+</span>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                          Este indicador mostra quanto das receitas é consumido pelas despesas. Valores abaixo de 100%
                          indicam lucro.
                        </p>
                        <p
                          className={`mt-2 font-medium ${
                            indicadores.relacaoDespesaReceita <= 60
                              ? "text-green-600"
                              : indicadores.relacaoDespesaReceita <= 80
                                ? "text-blue-600"
                                : indicadores.relacaoDespesaReceita <= 100
                                  ? "text-yellow-600"
                                  : "text-red-600"
                          }`}
                        >
                          {indicadores.relacaoDespesaReceita <= 60
                            ? "Excelente: Baixa proporção de despesas"
                            : indicadores.relacaoDespesaReceita <= 80
                              ? "Bom: Proporção adequada de despesas"
                              : indicadores.relacaoDespesaReceita <= 100
                                ? "Atenção: Despesas próximas das receitas"
                                : "Crítico: Despesas excedem receitas"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Demonstração do Resultado do Exercício (DRE)</CardTitle>
                  <CardDescription>
                    {periodo.from && periodo.to
                      ? `${format(periodo.from, "dd/MM/yyyy")} - ${format(periodo.to, "dd/MM/yyyy")}`
                      : "Período selecionado"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-white font-medium">
                        <TableCell>1. RECEITA BRUTA</TableCell>
                        <TableCell className="text-right">
                          {totalReceitas.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                        </TableCell>
                        <TableCell className="text-right">100.0%</TableCell>
                      </TableRow>

                      {receitasPorCategoria.map((categoria, index) => (
                        <TableRow key={index} className="bg-white text-sm">
                          <TableCell className="pl-8">{categoria.categoria}</TableCell>
                          <TableCell className="text-right">
                            {categoria.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </TableCell>
                          <TableCell className="text-right">
                            {((categoria.valor / totalReceitas) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}

                      <TableRow className="bg-gray-50 font-medium">
                        <TableCell>2. DESPESAS OPERACIONAIS</TableCell>
                        <TableCell className="text-right">
                          {totalDespesas.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                        </TableCell>
                        <TableCell className="text-right">
                          {((totalDespesas / totalReceitas) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>

                      {despesasPorDepartamento.map((departamento, index) => (
                        <TableRow key={index} className="bg-gray-50 text-sm">
                          <TableCell className="pl-8">{departamento.departamento}</TableCell>
                          <TableCell className="text-right">
                            {departamento.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </TableCell>
                          <TableCell className="text-right">
                            {((departamento.valor / totalReceitas) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}

                      <TableRow className="bg-white font-bold">
                        <TableCell>3. RESULTADO OPERACIONAL (1-2)</TableCell>
                        <TableCell className="text-right">
                          {resultado.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                        </TableCell>
                        <TableCell className="text-right">{((resultado / totalReceitas) * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {/* Diálogo para adicionar receita */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Receita</DialogTitle>
            <DialogDescription>Preencha os detalhes para adicionar uma nova receita.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    name="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    name="cliente"
                    value={formData.cliente}
                    onChange={handleInputChange}
                    required
                    list="clientes-list"
                  />
                  <datalist id="clientes-list">
                    {Array.isArray(clientes)
                      ? clientes.map((cliente) => <option key={cliente} value={cliente} />)
                      : null}
                  </datalist>
                </div>
                <div>
                  <Label htmlFor="dataPrevisao">Data Prevista</Label>
                  <Input
                    id="dataPrevisao"
                    name="dataPrevisao"
                    type="date"
                    value={formData.dataPrevisao}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dataRecebimento">Data de Recebimento</Label>
                  <Input
                    id="dataRecebimento"
                    name="dataRecebimento"
                    type="date"
                    value={formData.dataRecebimento}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={formData.estado} onValueChange={(value) => handleSelectChange("estado", value)}>
                    <SelectTrigger id="estado">
                      <SelectValue placeholder="Selecionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prevista">Prevista</SelectItem>
                      <SelectItem value="recebida">Recebida</SelectItem>
                      <SelectItem value="atrasada">Atrasada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="metodo">Método</Label>
                  <Select value={formData.metodo} onValueChange={(value) => handleSelectChange("metodo", value)}>
                    <SelectTrigger id="metodo">
                      <SelectValue placeholder="Selecionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferência">Transferência</SelectItem>
                      <SelectItem value="depósito">Depósito</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    required
                    list="categorias-list"
                  />
                  <datalist id="categorias-list">
                    {receitasPorCategoria && receitasPorCategoria.length > 0
                      ? receitasPorCategoria.map((categoria) => (
                          <option key={categoria.categoria} value={categoria.categoria} />
                        ))
                      : null}
                  </datalist>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="documentoFiscal"
                    checked={formData.documentoFiscal}
                    onCheckedChange={(checked) => handleCheckboxChange("documentoFiscal", checked as boolean)}
                  />
                  <Label htmlFor="documentoFiscal">Documento Fiscal Emitido</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reconciliado"
                    checked={formData.reconciliado}
                    onCheckedChange={(checked) => handleCheckboxChange("reconciliado", checked as boolean)}
                  />
                  <Label htmlFor="reconciliado">Reconciliado</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar Receita</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar receita */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Receita</DialogTitle>
            <DialogDescription>Atualize os detalhes da receita.</DialogDescription>
          </DialogHeader>
          {receitaSelecionada && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleEditReceita()
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="edit-descricao">Descrição</Label>
                    <Input
                      id="edit-descricao"
                      value={receitaSelecionada.descricao}
                      onChange={(e) => setReceitaSelecionada({ ...receitaSelecionada, descricao: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-valor">Valor</Label>
                    <Input
                      id="edit-valor"
                      type="number"
                      step="0.01"
                      value={receitaSelecionada.valor}
                      onChange={(e) =>
                        setReceitaSelecionada({
                          ...receitaSelecionada,
                          valor: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-cliente">Cliente</Label>
                    <Input
                      id="edit-cliente"
                      value={receitaSelecionada.cliente}
                      onChange={(e) => setReceitaSelecionada({ ...receitaSelecionada, cliente: e.target.value })}
                      required
                      list="clientes-list"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-categoria">Categoria</Label>
                    <Input
                      id="edit-categoria"
                      value={receitaSelecionada.categoria}
                      onChange={(e) => setReceitaSelecionada({ ...receitaSelecionada, categoria: e.target.value })}
                      required
                      list="categorias-list"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-estado">Estado</Label>
                    <Select
                      value={receitaSelecionada.estado}
                      onValueChange={(value) => setReceitaSelecionada({ ...receitaSelecionada, estado: value })}
                    >
                      <SelectTrigger id="edit-estado">
                        <SelectValue placeholder="Selecionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prevista">Prevista</SelectItem>
                        <SelectItem value="recebida">Recebida</SelectItem>
                        <SelectItem value="atrasada">Atrasada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmar exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteReceita}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrintLayout>
  )
}

