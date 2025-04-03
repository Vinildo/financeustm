"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, Printer, Search, Filter, X } from "lucide-react"
import { useAppContext } from "@/contexts/AppContext"
import { PrintLayout } from "@/components/print-layout"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function RelatorioFornecedor() {
  const { fornecedores = [] } = useAppContext() || {}
  const [searchTerm, setSearchTerm] = useState("")
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState<any[]>([])
  const [incluirCotacoes, setIncluirCotacoes] = useState(false)
  const [mostrarPagos, setMostrarPagos] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [filtroValorMin, setFiltroValorMin] = useState<string>("")
  const [filtroValorMax, setFiltroValorMax] = useState<string>("")
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("")
  const [filtroFornecedor, setFiltroFornecedor] = useState<string>("")
  const [departamentos, setDepartamentos] = useState<string[]>([])

  // Extract unique departments from all payments
  useEffect(() => {
    if (!fornecedores || fornecedores.length === 0) return

    const depts = new Set<string>()
    fornecedores.forEach((fornecedor) => {
      ;(fornecedor.pagamentos || []).forEach((pagamento: any) => {
        if (pagamento.departamento) {
          depts.add(pagamento.departamento)
        }
      })
    })

    setDepartamentos(Array.from(depts).sort())
  }, [fornecedores])

  useEffect(() => {
    if (!fornecedores || fornecedores.length === 0) {
      setFornecedoresFiltrados([])
      return
    }

    try {
      // Filtrar fornecedores pelo termo de busca
      const filtrados = fornecedores
        .filter((fornecedor) => {
          // Filtrar por termo de busca
          if (!fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false
          }

          // Filtrar por fornecedor selecionado
          if (filtroFornecedor && fornecedor.id !== filtroFornecedor) {
            return false
          }

          // Verificar se o fornecedor tem pagamentos que atendem aos critérios
          const temPagamentosValidos = (fornecedor.pagamentos || []).some((pagamento) => {
            // Filtrar cotações
            if (!incluirCotacoes && pagamento.tipo === "cotacao") {
              return false
            }

            // Filtrar por valor
            if (filtroValorMin && pagamento.valor < Number.parseFloat(filtroValorMin)) {
              return false
            }

            if (filtroValorMax && pagamento.valor > Number.parseFloat(filtroValorMax)) {
              return false
            }

            // Filtrar por status
            if (filtroStatus !== "todos") {
              const pagamentosParciais = pagamento.pagamentosParciais || []
              const valorPago =
                pagamentosParciais.length > 0
                  ? pagamentosParciais.reduce((total, p) => total + p.valor, 0)
                  : pagamento.estado === "pago"
                    ? pagamento.valor
                    : 0

              const valorPendente = Math.max(0, pagamento.valor - valorPago)

              if (filtroStatus === "pendente" && valorPago > 0) {
                return false
              }
              if (filtroStatus === "pago" && valorPendente > 0) {
                return false
              }
              if (filtroStatus === "parcial" && (valorPago === 0 || valorPendente === 0)) {
                return false
              }
            }

            return true
          })

          return temPagamentosValidos
        })
        .map((fornecedor) => {
          // Calcular totais para o fornecedor
          const pagamentosFiltrados = (fornecedor.pagamentos || []).filter(
            (pagamento) => incluirCotacoes || pagamento.tipo !== "cotacao",
          )

          const totalValor = pagamentosFiltrados.reduce((acc, p) => acc + p.valor, 0)
          const totalPago = pagamentosFiltrados.reduce((acc, p) => {
            const pagamentosParciais = p.pagamentosParciais || []
            const valorPago =
              pagamentosParciais.length > 0
                ? pagamentosParciais.reduce((total, partial) => total + partial.valor, 0)
                : p.estado === "pago"
                  ? p.valor
                  : 0
            return acc + valorPago
          }, 0)
          const totalPendente = totalValor - totalPago

          return {
            ...fornecedor,
            pagamentosFiltrados,
            totalValor,
            totalPago,
            totalPendente,
            percentualPago: totalValor > 0 ? (totalPago / totalValor) * 100 : 0,
          }
        })
        .filter((fornecedor) => fornecedor.pagamentosFiltrados.length > 0)
        .sort((a, b) => b.totalPendente - a.totalPendente)

      setFornecedoresFiltrados(filtrados)
    } catch (error) {
      console.error("Erro ao processar fornecedores:", error)
      setFornecedoresFiltrados([])
    }
  }, [
    fornecedores,
    searchTerm,
    incluirCotacoes,
    filtroStatus,
    filtroValorMin,
    filtroValorMax,
    filtroDepartamento,
    filtroFornecedor,
  ])

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    // Implementação futura
    alert("Exportação para Excel em desenvolvimento")
  }

  const resetFilters = () => {
    setSearchTerm("")
    setIncluirCotacoes(false)
    setFiltroStatus("todos")
    setFiltroValorMin("")
    setFiltroValorMax("")
    setFiltroDepartamento("")
    setFiltroFornecedor("")
  }

  const getStatusBadge = (status: string, percentualPago: number) => {
    switch (status) {
      case "pendente":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendente
          </Badge>
        )
      case "pago":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Pago
          </Badge>
        )
      case "parcialmente pago":
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Parcial ({Math.round(percentualPago)}%)
            </Badge>
            <Progress value={percentualPago} className="h-1.5 w-full" />
          </div>
        )
      case "atrasado":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Atrasado
          </Badge>
        )
      case "cancelado":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <PrintLayout title="Relatório por Fornecedor">
      <Card>
        <CardHeader className="bg-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Relatório por Fornecedor</CardTitle>
              <CardDescription>Detalhamento de pagamentos por fornecedor</CardDescription>
            </div>
            <div className="space-x-2">
              <Button onClick={handlePrint} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleExportExcel} className="print:hidden bg-green-600 hover:bg-green-700">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar fornecedor..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter className="h-4 w-4" />
                    Filtros
                    {(incluirCotacoes ||
                      mostrarPagos ||
                      filtroStatus !== "todos" ||
                      filtroValorMin ||
                      filtroValorMax ||
                      filtroDepartamento ||
                      filtroFornecedor) && (
                      <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                        {
                          [
                            incluirCotacoes,
                            mostrarPagos,
                            filtroStatus !== "todos",
                            filtroValorMin,
                            filtroValorMax,
                            filtroDepartamento,
                            filtroFornecedor,
                          ].filter(Boolean).length
                        }
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="font-medium flex items-center justify-between">
                      <h4>Filtros</h4>
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Limpar
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="incluirCotacoes"
                          checked={incluirCotacoes}
                          onCheckedChange={(checked) => setIncluirCotacoes(checked === true)}
                        />
                        <Label htmlFor="incluirCotacoes">Incluir cotações</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="mostrarPagos"
                          checked={mostrarPagos}
                          onCheckedChange={(checked) => setMostrarPagos(checked === true)}
                        />
                        <Label htmlFor="mostrarPagos">Mostrar pagos</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filtroStatus">Status</Label>
                      <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                        <SelectTrigger id="filtroStatus">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="parcial">Parcialmente Pago</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="filtroValorMin">Valor Mínimo</Label>
                        <Input
                          id="filtroValorMin"
                          type="number"
                          placeholder="0"
                          value={filtroValorMin}
                          onChange={(e) => setFiltroValorMin(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filtroValorMax">Valor Máximo</Label>
                        <Input
                          id="filtroValorMax"
                          type="number"
                          placeholder="∞"
                          value={filtroValorMax}
                          onChange={(e) => setFiltroValorMax(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filtroFornecedor">Fornecedor</Label>
                      <Select value={filtroFornecedor} onValueChange={setFiltroFornecedor}>
                        <SelectTrigger id="filtroFornecedor">
                          <SelectValue placeholder="Todos os fornecedores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {fornecedores.map((fornecedor) => (
                            <SelectItem key={fornecedor.id} value={fornecedor.id}>
                              {fornecedor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full" onClick={() => setIsFilterOpen(false)}>
                      Aplicar Filtros
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {fornecedoresFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum fornecedor encontrado com os filtros atuais.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {fornecedoresFiltrados.map((fornecedor) => (
                <div key={fornecedor.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 p-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">{fornecedor.nome}</h3>
                      <div className="text-sm text-gray-500">{fornecedor.pagamentosFiltrados.length} pagamento(s)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total Pendente</div>
                      <div className="font-bold">
                        {(fornecedor.totalPendente || 0).toLocaleString("pt-MZ", {
                          style: "currency",
                          currency: "MZN",
                        })}
                      </div>
                      {fornecedor.totalPago > 0 && (
                        <div className="mt-1">
                          <div className="flex items-center justify-end gap-2">
                            <div className="text-xs text-gray-500">{Math.round(fornecedor.percentualPago)}% pago</div>
                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${fornecedor.percentualPago}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-red-600 text-white">
                          <TableHead className="font-semibold text-white">Referência</TableHead>
                          <TableHead className="font-semibold text-white">Tipo</TableHead>
                          <TableHead className="font-semibold text-white">Vencimento</TableHead>
                          <TableHead className="font-semibold text-white">Pagamento</TableHead>
                          <TableHead className="font-semibold text-white text-right">Valor Original</TableHead>
                          <TableHead className="font-semibold text-white text-right">Valor Pendente</TableHead>
                          <TableHead className="font-semibold text-white">Progresso</TableHead>
                          <TableHead className="font-semibold text-white">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fornecedor.pagamentosFiltrados.map((pagamento: any) => (
                          <TableRow key={pagamento.id}>
                            <TableCell className="font-medium">{pagamento.referencia}</TableCell>
                            <TableCell>
                              {pagamento.tipo === "fatura"
                                ? "Fatura"
                                : pagamento.tipo === "cotacao"
                                  ? "Cotação"
                                  : pagamento.tipo === "vd"
                                    ? "VD"
                                    : pagamento.tipo}
                            </TableCell>
                            <TableCell>
                              {format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}
                            </TableCell>
                            <TableCell>
                              {pagamento.dataPagamento
                                ? format(new Date(pagamento.dataPagamento), "dd/MM/yyyy", { locale: pt })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {(pagamento.valor || 0).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                            </TableCell>
                            <TableCell className="text-right">
                              {(pagamento.valorPendente || 0).toLocaleString("pt-MZ", {
                                style: "currency",
                                currency: "MZN",
                              })}
                              {pagamento.valorPago > 0 && (
                                <div className="text-xs text-green-600 mt-1">
                                  Pago:{" "}
                                  {(pagamento.valorPago || 0).toLocaleString("pt-MZ", {
                                    style: "currency",
                                    currency: "MZN",
                                  })}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {pagamento.percentualPago > 0 && (
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${pagamento.percentualPago}%` }}
                                  ></div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(pagamento.status, pagamento.percentualPago)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell className="text-right">
                            {(fornecedor.totalValor || 0).toLocaleString("pt-MZ", {
                              style: "currency",
                              currency: "MZN",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {(fornecedor.totalPendente || 0).toLocaleString("pt-MZ", {
                              style: "currency",
                              currency: "MZN",
                            })}
                            {fornecedor.totalPago > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                Pago:{" "}
                                {(fornecedor.totalPago || 0).toLocaleString("pt-MZ", {
                                  style: "currency",
                                  currency: "MZN",
                                })}
                              </div>
                            )}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

