"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PrintLayout } from "@/components/print-layout"
import { useAppContext } from "@/contexts/AppContext"
import { format, isWithinInterval, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { pt } from "date-fns/locale"
import { Printer, Download, Info } from "lucide-react"
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import type { DateRange } from "react-day-picker"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Cores para os gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

export function RelatorioFinanceiro() {
  const { fornecedores } = useAppContext()
  const hoje = new Date()

  // Estados para filtros
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>("mes")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(hoje),
    to: endOfMonth(hoje),
  })
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState<string>("todos")

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

  // Filtrar pagamentos com base nos critérios
  const pagamentosFiltrados = useMemo(() => {
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

  // Calcular totais e métricas
  const totalDespesas = useMemo(() => {
    return pagamentosFiltrados.reduce((acc, curr) => acc + curr.valor, 0)
  }, [pagamentosFiltrados])

  const totalPago = useMemo(() => {
    return pagamentosFiltrados.filter((p) => p.estado === "pago").reduce((acc, curr) => acc + curr.valor, 0)
  }, [pagamentosFiltrados])

  const totalPendente = useMemo(() => {
    return pagamentosFiltrados
      .filter((p) => p.estado === "pendente" || p.estado === "atrasado")
      .reduce((acc, curr) => acc + curr.valor, 0)
  }, [pagamentosFiltrados])

  // Dados para gráficos
  const despesasPorDepartamento = useMemo(() => {
    const dados: Record<string, number> = {}
    pagamentosFiltrados.forEach((pagamento) => {
      if (!dados[pagamento.departamento]) {
        dados[pagamento.departamento] = 0
      }
      dados[pagamento.departamento] += pagamento.valor
    })

    return Object.entries(dados)
      .map(([departamento, valor]) => ({
        departamento,
        valor,
      }))
      .sort((a, b) => b.valor - a.valor)
  }, [pagamentosFiltrados])

  const despesasPorFornecedor = useMemo(() => {
    const dados: Record<string, number> = {}
    pagamentosFiltrados.forEach((pagamento) => {
      if (!dados[pagamento.fornecedorNome]) {
        dados[pagamento.fornecedorNome] = 0
      }
      dados[pagamento.fornecedorNome] += pagamento.valor
    })

    return Object.entries(dados)
      .map(([fornecedor, valor]) => ({
        fornecedor,
        valor,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10) // Top 10 fornecedores
  }, [pagamentosFiltrados])

  const despesasPorMes = useMemo(() => {
    const dados: Record<string, number> = {}

    // Inicializar os últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const data = subMonths(hoje, i)
      const chave = format(data, "MMM yyyy", { locale: pt })
      dados[chave] = 0
    }

    // Preencher com dados reais
    fornecedores.forEach((fornecedor) => {
      fornecedor.pagamentos.forEach((pagamento) => {
        const dataVencimento = new Date(pagamento.dataVencimento)
        const chave = format(dataVencimento, "MMM yyyy", { locale: pt })
        if (dados[chave] !== undefined) {
          dados[chave] += pagamento.valor
        }
      })
    })

    return Object.entries(dados)
      .map(([mes, valor]) => ({
        mes,
        valor,
      }))
      .reverse()
  }, [fornecedores, hoje])

  // Calcular rácios financeiros
  const racios = useMemo(() => {
    // Obter todos os pagamentos para cálculos globais
    const todosPagamentos = fornecedores.flatMap((f) => f.pagamentos)

    // Total de dívida atual (pendente + atrasado)
    const totalDivida = todosPagamentos
      .filter((p) => p.estado === "pendente" || p.estado === "atrasado")
      .reduce((acc, curr) => acc + curr.valor, 0)

    // Total pago nos últimos 12 meses
    const dataLimite = subMonths(hoje, 12)
    const totalPago12Meses = todosPagamentos
      .filter((p) => p.estado === "pago" && p.dataPagamento && new Date(p.dataPagamento) >= dataLimite)
      .reduce((acc, curr) => acc + curr.valor, 0)

    // Média mensal de pagamentos
    const mediaMensalPagamentos = totalPago12Meses / 12

    // Rácio de endividamento (dívida total / média mensal de pagamentos)
    const racioEndividamento = mediaMensalPagamentos > 0 ? totalDivida / mediaMensalPagamentos : 0

    // Rácio de liquidez (assumindo um valor fixo para demonstração)
    // Em um sistema real, isso viria de outros dados financeiros
    const ativoCirculante = 1000000 // Valor fictício para demonstração
    const passivoCirculante = totalDivida
    const racioLiquidez = passivoCirculante > 0 ? ativoCirculante / passivoCirculante : 0

    // Percentual de pagamentos em atraso
    const pagamentosAtrasados = todosPagamentos.filter((p) => p.estado === "atrasado").length
    const totalPagamentos = todosPagamentos.length
    const percentualAtraso = totalPagamentos > 0 ? (pagamentosAtrasados / totalPagamentos) * 100 : 0

    // Tempo médio de pagamento (em dias)
    const pagamentosConcluidos = todosPagamentos.filter(
      (p) => p.estado === "pago" && p.dataPagamento && p.dataVencimento,
    )

    let somaTemposPagamento = 0
    pagamentosConcluidos.forEach((p) => {
      const dataVencimento = new Date(p.dataVencimento)
      const dataPagamento = new Date(p.dataPagamento!)
      const diferencaDias = Math.floor((dataPagamento.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24))
      somaTemposPagamento += diferencaDias
    })

    const tempoMedioPagamento = pagamentosConcluidos.length > 0 ? somaTemposPagamento / pagamentosConcluidos.length : 0

    return {
      racioEndividamento,
      racioLiquidez,
      percentualAtraso,
      tempoMedioPagamento,
      mesesParaLiquidarDivida: mediaMensalPagamentos > 0 ? totalDivida / mediaMensalPagamentos : 0,
      concentracaoFornecedores: calcularConcentracaoFornecedores(todosPagamentos),
    }
  }, [fornecedores, hoje])

  // Função para calcular a concentração de fornecedores (% do top 3 fornecedores)
  const calcularConcentracaoFornecedores = (pagamentos: any[]) => {
    const totalPorFornecedor: Record<string, number> = {}

    fornecedores.forEach((fornecedor) => {
      totalPorFornecedor[fornecedor.id] = fornecedor.pagamentos
        .filter((p) => p.estado === "pendente" || p.estado === "atrasado")
        .reduce((acc, curr) => acc + curr.valor, 0)
    })

    const valoresOrdenados = Object.values(totalPorFornecedor).sort((a, b) => b - a)
    const top3 = valoresOrdenados.slice(0, 3).reduce((acc, curr) => acc + curr, 0)
    const total = valoresOrdenados.reduce((acc, curr) => acc + curr, 0)

    return total > 0 ? (top3 / total) * 100 : 0
  }

  // Dados para o gráfico de radar de rácios
  const dadosRadar = useMemo(() => {
    return [
      {
        subject: "Liquidez",
        A: Math.min(racios.racioLiquidez, 2), // Limitado a 2 para visualização
        fullMark: 2,
      },
      {
        subject: "Endividamento",
        A: Math.min(racios.racioEndividamento, 12) / 12, // Normalizado para 0-1
        fullMark: 1,
      },
      {
        subject: "Pagamentos em Dia",
        A: (100 - racios.percentualAtraso) / 100, // Invertido e normalizado
        fullMark: 1,
      },
      {
        subject: "Tempo de Pagamento",
        A: Math.max(0, 1 - Math.min(racios.tempoMedioPagamento, 30) / 30), // Normalizado e invertido
        fullMark: 1,
      },
      {
        subject: "Diversificação",
        A: 1 - Math.min(racios.concentracaoFornecedores, 100) / 100, // Invertido e normalizado
        fullMark: 1,
      },
    ]
  }, [racios])

  // Função para exportar dados em CSV
  const exportarCSV = () => {
    // Cabeçalho do CSV
    let csv = "Fornecedor,Referência,Valor,Data Vencimento,Estado,Departamento\n"

    // Adicionar dados
    pagamentosFiltrados.forEach((pagamento) => {
      csv += `"${pagamento.fornecedorNome}","${pagamento.referencia}",${pagamento.valor},"${format(
        new Date(pagamento.dataVencimento),
        "dd/MM/yyyy",
      )}","${pagamento.estado}","${pagamento.departamento}"\n`
    })

    // Criar blob e link para download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio-financeiro-${format(hoje, "dd-MM-yyyy")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Função para imprimir o relatório
  const handlePrint = () => {
    window.print()
  }

  return (
    <PrintLayout title="Relatório Financeiro">
      <Card className="w-full">
        <CardHeader className="bg-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Relatório Financeiro</CardTitle>
              <CardDescription>Análise de despesas, endividamento e rácios financeiros</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                <SelectTrigger className="w-[180px] bg-white border-gray-300">
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Mês Atual</SelectItem>
                  <SelectItem value="trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="semestre">Último Semestre</SelectItem>
                  <SelectItem value="ano">Ano Atual</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {periodoSelecionado === "personalizado" && (
                <DateRangeFilter
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  className="bg-white border-gray-300"
                />
              )}

              <Select value={departamentoSelecionado} onValueChange={setDepartamentoSelecionado}>
                <SelectTrigger className="w-[200px] bg-white border-gray-300">
                  <SelectValue placeholder="Selecionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os departamentos</SelectItem>
                  {departamentos.map((dep) => (
                    <SelectItem key={dep} value={dep}>
                      {dep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
              <TabsTrigger value="despesas">Análise de Despesas</TabsTrigger>
              <TabsTrigger value="endividamento">Endividamento</TabsTrigger>
              <TabsTrigger value="racios">Rácios Financeiros</TabsTrigger>
            </TabsList>

            {/* Aba de Visão Geral */}
            <TabsContent value="visao-geral" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    <div className="text-3xl font-bold">
                      {totalDespesas.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Pago</CardTitle>
                    <CardDescription>{((totalPago / totalDespesas) * 100).toFixed(1)}% do total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {totalPago.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </div>
                    <Progress value={(totalPago / totalDespesas) * 100} className="h-2 mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Pendente</CardTitle>
                    <CardDescription>{((totalPendente / totalDespesas) * 100).toFixed(1)}% do total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">
                      {totalPendente.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </div>
                    <Progress value={(totalPendente / totalDespesas) * 100} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                          <YAxis type="category" dataKey="departamento" width={100} />
                          <Tooltip
                            formatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          />
                          <Bar dataKey="valor" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tendência de Despesas (12 meses)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={despesasPorMes} margin={{ left: 20, right: 20 }}>
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
                          <Line type="monotone" dataKey="valor" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Principais Indicadores Financeiros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Rácio de Liquidez</h3>
                        <Popover>
                          <PopoverTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p className="text-sm">
                              O rácio de liquidez mede a capacidade da empresa de pagar suas obrigações de curto prazo.
                              Um valor maior que 1 indica boa saúde financeira.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="text-2xl font-bold mt-2">{racios.racioLiquidez.toFixed(2)}</div>
                      <div className={`text-sm ${racios.racioLiquidez >= 1 ? "text-green-600" : "text-red-600"}`}>
                        {racios.racioLiquidez >= 1 ? "Saudável" : "Atenção necessária"}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Meses para Liquidar Dívida</h3>
                        <Popover>
                          <PopoverTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p className="text-sm">
                              Estimativa de quantos meses seriam necessários para pagar toda a dívida atual, baseado na
                              média mensal de pagamentos.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="text-2xl font-bold mt-2">{racios.mesesParaLiquidarDivida.toFixed(1)}</div>
                      <div
                        className={`text-sm ${racios.mesesParaLiquidarDivida <= 6 ? "text-green-600" : racios.mesesParaLiquidarDivida <= 12 ? "text-amber-600" : "text-red-600"}`}
                      >
                        {racios.mesesParaLiquidarDivida <= 6
                          ? "Excelente"
                          : racios.mesesParaLiquidarDivida <= 12
                            ? "Aceitável"
                            : "Preocupante"}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Pagamentos em Atraso</h3>
                        <Popover>
                          <PopoverTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p className="text-sm">
                              Percentual de pagamentos que estão atualmente em atraso. Um valor baixo indica boa gestão
                              de pagamentos.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="text-2xl font-bold mt-2">{racios.percentualAtraso.toFixed(1)}%</div>
                      <div
                        className={`text-sm ${racios.percentualAtraso <= 5 ? "text-green-600" : racios.percentualAtraso <= 15 ? "text-amber-600" : "text-red-600"}`}
                      >
                        {racios.percentualAtraso <= 5
                          ? "Excelente"
                          : racios.percentualAtraso <= 15
                            ? "Aceitável"
                            : "Preocupante"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de Análise de Despesas */}
            <TabsContent value="despesas" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Fornecedores</CardTitle>
                    <CardDescription>Por valor total de despesas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={despesasPorFornecedor} layout="vertical" margin={{ left: 20, right: 20 }}>
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
                          <YAxis type="category" dataKey="fornecedor" width={120} />
                          <Tooltip
                            formatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          />
                          <Bar dataKey="valor" fill="#00C49F">
                            {despesasPorFornecedor.map((entry, index) => (
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
                    <CardTitle>Distribuição de Despesas</CardTitle>
                    <CardDescription>Por departamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={despesasPorDepartamento}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="valor"
                            nameKey="departamento"
                            label={({ departamento, percent }) => `${departamento}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {despesasPorDepartamento.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
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

              <Card>
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
                      {pagamentosFiltrados.map((pagamento, index) => (
                        <TableRow key={pagamento.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <TableCell className="font-medium">{pagamento.fornecedorNome}</TableCell>
                          <TableCell>{pagamento.referencia}</TableCell>
                          <TableCell>{pagamento.departamento}</TableCell>
                          <TableCell>
                            {format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}
                          </TableCell>
                          <TableCell className="text-right">
                            {pagamento.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                pagamento.estado === "pago"
                                  ? "bg-green-100 text-green-800"
                                  : pagamento.estado === "pendente"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : pagamento.estado === "atrasado"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {pagamento.estado}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de Endividamento */}
            <TabsContent value="endividamento" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Nível de Endividamento</CardTitle>
                    <CardDescription>Meses necessários para liquidar a dívida atual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <div className="text-5xl font-bold mb-4">{racios.mesesParaLiquidarDivida.toFixed(1)}</div>
                      <div className="w-full max-w-md">
                        <Progress
                          value={Math.min((racios.mesesParaLiquidarDivida * 100) / 12, 100)}
                          className="h-4"
                          indicatorClassName={
                            racios.mesesParaLiquidarDivida <= 3
                              ? "bg-green-500"
                              : racios.mesesParaLiquidarDivida <= 6
                                ? "bg-yellow-500"
                                : racios.mesesParaLiquidarDivida <= 12
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                          }
                        />
                        <div className="flex justify-between mt-2 text-sm text-gray-500">
                          <span>0</span>
                          <span>3</span>
                          <span>6</span>
                          <span>12</span>
                          <span>18+</span>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                          Baseado na média mensal de pagamentos dos últimos 12 meses e no total da dívida atual.
                        </p>
                        <p
                          className={`mt-2 font-medium ${
                            racios.mesesParaLiquidarDivida <= 3
                              ? "text-green-600"
                              : racios.mesesParaLiquidarDivida <= 6
                                ? "text-yellow-600"
                                : racios.mesesParaLiquidarDivida <= 12
                                  ? "text-orange-600"
                                  : "text-red-600"
                          }`}
                        >
                          {racios.mesesParaLiquidarDivida <= 3
                            ? "Excelente: Baixo nível de endividamento"
                            : racios.mesesParaLiquidarDivida <= 6
                              ? "Bom: Nível de endividamento controlado"
                              : racios.mesesParaLiquidarDivida <= 12
                                ? "Moderado: Monitorar o nível de endividamento"
                                : "Alto: Atenção necessária ao nível de endividamento"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Concentração de Fornecedores</CardTitle>
                    <CardDescription>Percentual da dívida concentrada nos top 3 fornecedores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <div className="text-5xl font-bold mb-4">{racios.concentracaoFornecedores.toFixed(1)}%</div>
                      <div className="w-full max-w-md">
                        <Progress
                          value={racios.concentracaoFornecedores}
                          className="h-4"
                          indicatorClassName={
                            racios.concentracaoFornecedores <= 40
                              ? "bg-green-500"
                              : racios.concentracaoFornecedores <= 60
                                ? "bg-yellow-500"
                                : racios.concentracaoFornecedores <= 80
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                          }
                        />
                        <div className="flex justify-between mt-2 text-sm text-gray-500">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                          Uma alta concentração indica dependência de poucos fornecedores, o que pode representar risco.
                        </p>
                        <p
                          className={`mt-2 font-medium ${
                            racios.concentracaoFornecedores <= 40
                              ? "text-green-600"
                              : racios.concentracaoFornecedores <= 60
                                ? "text-yellow-600"
                                : racios.concentracaoFornecedores <= 80
                                  ? "text-orange-600"
                                  : "text-red-600"
                          }`}
                        >
                          {racios.concentracaoFornecedores <= 40
                            ? "Baixa concentração: Boa diversificação"
                            : racios.concentracaoFornecedores <= 60
                              ? "Concentração moderada: Aceitável"
                              : racios.concentracaoFornecedores <= 80
                                ? "Alta concentração: Considerar diversificar"
                                : "Concentração muito alta: Risco significativo"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Evolução da Dívida</CardTitle>
                  <CardDescription>Últimos 12 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={despesasPorMes} margin={{ left: 20, right: 20 }}>
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
                        <Line
                          type="monotone"
                          dataKey="valor"
                          name="Total de Despesas"
                          stroke="#8884d8"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de Rácios Financeiros */}
            <TabsContent value="racios" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Rácio de Liquidez</CardTitle>
                    <CardDescription>Capacidade de pagar obrigações de curto prazo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{racios.racioLiquidez.toFixed(2)}</div>
                    <Progress
                      value={Math.min(racios.racioLiquidez * 50, 100)}
                      className="h-2 mt-2"
                      indicatorClassName={racios.racioLiquidez >= 1 ? "bg-green-500" : "bg-red-500"}
                    />
                    <p className="mt-2 text-sm text-gray-600">Ideal: &gt; 1.0 (quanto maior, melhor)</p>
                    <p
                      className={`text-sm font-medium ${racios.racioLiquidez >= 1.5 ? "text-green-600" : racios.racioLiquidez >= 1 ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {racios.racioLiquidez >= 1.5
                        ? "Excelente"
                        : racios.racioLiquidez >= 1
                          ? "Adequado"
                          : "Insuficiente"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Tempo Médio de Pagamento</CardTitle>
                    <CardDescription>Dias em relação ao vencimento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{racios.tempoMedioPagamento.toFixed(1)} dias</div>
                    <Progress
                      value={Math.min(Math.max(0, 100 - racios.tempoMedioPagamento * 5), 100)}
                      className="h-2 mt-2"
                      indicatorClassName={
                        racios.tempoMedioPagamento <= 0
                          ? "bg-green-500"
                          : racios.tempoMedioPagamento <= 7
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }
                    />
                    <p className="mt-2 text-sm text-gray-600">Ideal: 0 ou negativo (pagamento antes do vencimento)</p>
                    <p
                      className={`text-sm font-medium ${
                        racios.tempoMedioPagamento <= 0
                          ? "text-green-600"
                          : racios.tempoMedioPagamento <= 7
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {racios.tempoMedioPagamento <= 0
                        ? "Excelente: Pagamentos antes do vencimento"
                        : racios.tempoMedioPagamento <= 7
                          ? "Aceitável: Pequeno atraso"
                          : "Preocupante: Atraso significativo"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pagamentos em Atraso</CardTitle>
                    <CardDescription>Percentual do total de pagamentos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{racios.percentualAtraso.toFixed(1)}%</div>
                    <Progress
                      value={100 - racios.percentualAtraso}
                      className="h-2 mt-2"
                      indicatorClassName={
                        racios.percentualAtraso <= 5
                          ? "bg-green-500"
                          : racios.percentualAtraso <= 15
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }
                    />
                    <p className="mt-2 text-sm text-gray-600">Ideal: &lt; 5% (quanto menor, melhor)</p>
                    <p
                      className={`text-sm font-medium ${
                        racios.percentualAtraso <= 5
                          ? "text-green-600"
                          : racios.percentualAtraso <= 15
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {racios.percentualAtraso <= 5
                        ? "Excelente: Poucos atrasos"
                        : racios.percentualAtraso <= 15
                          ? "Aceitável: Monitorar atrasos"
                          : "Preocupante: Muitos pagamentos atrasados"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Radar de Rácios Financeiros</CardTitle>
                    <CardDescription>Visão consolidada dos principais indicadores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dadosRadar}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 1]} />
                          <Radar name="Desempenho" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 text-center">
                        Quanto mais próximo da borda externa, melhor o desempenho em cada indicador.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interpretação dos Rácios</CardTitle>
                    <CardDescription>Análise e recomendações</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium">Liquidez</h3>
                        <p className="text-sm text-gray-600">
                          {racios.racioLiquidez >= 1.5
                            ? "Excelente liquidez. A empresa tem boa capacidade de pagar suas obrigações de curto prazo."
                            : racios.racioLiquidez >= 1
                              ? "Liquidez adequada. A empresa consegue cobrir suas obrigações de curto prazo, mas deve monitorar este indicador."
                              : "Liquidez insuficiente. A empresa pode enfrentar dificuldades para pagar suas obrigações de curto prazo."}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Endividamento</h3>
                        <p className="text-sm text-gray-600">
                          {racios.mesesParaLiquidarDivida <= 3
                            ? "Nível de endividamento muito baixo. A empresa poderia considerar investimentos estratégicos."
                            : racios.mesesParaLiquidarDivida <= 6
                              ? "Nível de endividamento saudável. Boa gestão financeira."
                              : racios.mesesParaLiquidarDivida <= 12
                                ? "Nível de endividamento moderado. Recomenda-se monitorar e evitar novos compromissos significativos."
                                : "Nível de endividamento elevado. Recomenda-se implementar estratégias para redução da dívida."}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Concentração de Fornecedores</h3>
                        <p className="text-sm text-gray-600">
                          {racios.concentracaoFornecedores <= 40
                            ? "Boa diversificação de fornecedores, reduzindo riscos operacionais."
                            : racios.concentracaoFornecedores <= 60
                              ? "Concentração moderada. Considere diversificar mais os fornecedores para reduzir riscos."
                              : "Alta concentração em poucos fornecedores. Recomenda-se buscar alternativas para reduzir a dependência."}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Gestão de Pagamentos</h3>
                        <p className="text-sm text-gray-600">
                          {racios.percentualAtraso <= 5 && racios.tempoMedioPagamento <= 0
                            ? "Excelente gestão de pagamentos. A empresa paga em dia ou antecipadamente."
                            : racios.percentualAtraso <= 15 && racios.tempoMedioPagamento <= 7
                              ? "Gestão de pagamentos adequada, com poucos atrasos."
                              : "Oportunidade de melhoria na gestão de pagamentos. Considere implementar processos mais eficientes."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

