"use client"

import { useState, useEffect } from "react"
import { format, parseISO, isValid } from "date-fns"
import { pt } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileSpreadsheet,
  Printer,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  Info,
  Filter,
  X,
} from "lucide-react"
import { useAppContext } from "@/contexts/AppContext"
import { PrintLayout } from "@/components/print-layout"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function ExtratoFornecedor() {
  const { fornecedores = [] } = useAppContext() || {}
  const [searchTerm, setSearchTerm] = useState("")
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string | null>(null)
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState<any[]>([])
  const [pagamentosFornecedor, setPagamentosFornecedor] = useState<any[]>([])
  const [pagamentosParciais, setPagamentosParciais] = useState<any[]>([])
  const [incluirCotacoes, setIncluirCotacoes] = useState(false)
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})
  const [fornecedorAtual, setFornecedorAtual] = useState<any>(null)
  const [periodoInicio, setPeriodoInicio] = useState<string>(
    format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
  )
  const [periodoFim, setPeriodoFim] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<string>("")
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [filtroValorMin, setFiltroValorMin] = useState<string>("")
  const [filtroValorMax, setFiltroValorMax] = useState<string>("")

  // Filtrar fornecedores pelo termo de busca e outros filtros
  useEffect(() => {
    if (!fornecedores || fornecedores.length === 0) {
      setFornecedoresFiltrados([])
      return
    }

    try {
      const filtrados = fornecedores
        .filter((fornecedor) => {
          // Filtrar por termo de busca
          if (!fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false
          }

          // Filtrar por categoria (se implementado)
          if (filtroCategoria && fornecedor.categoria !== filtroCategoria) {
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
            totalValor,
            totalPago,
            totalPendente,
          }
        })
        .sort((a, b) => a.nome.localeCompare(b.nome))

      setFornecedoresFiltrados(filtrados)
    } catch (error) {
      console.error("Erro ao processar fornecedores:", error)
      setFornecedoresFiltrados([])
    }
  }, [fornecedores, searchTerm, incluirCotacoes, filtroCategoria, filtroStatus, filtroValorMin, filtroValorMax])

  // Atualizar fornecedor atual quando selecionado
  useEffect(() => {
    if (fornecedorSelecionado) {
      const fornecedor = fornecedores.find((f) => f.id === fornecedorSelecionado)
      setFornecedorAtual(fornecedor || null)
    } else {
      setFornecedorAtual(null)
    }
  }, [fornecedorSelecionado, fornecedores])

  // Processar pagamentos do fornecedor selecionado
  useEffect(() => {
    if (!fornecedorSelecionado) {
      setPagamentosFornecedor([])
      setPagamentosParciais([])
      return
    }

    try {
      const fornecedor = fornecedores.find((f) => f.id === fornecedorSelecionado)
      if (!fornecedor) {
        setPagamentosFornecedor([])
        setPagamentosParciais([])
        return
      }

      // Processar pagamentos
      const pagamentos = (fornecedor.pagamentos || [])
        .filter((pagamento) => incluirCotacoes || pagamento.tipo !== "cotacao")
        .filter((pagamento) => {
          // Filtrar por período
          const dataVencimento = new Date(pagamento.dataVencimento)
          const inicio = parseISO(periodoInicio)
          const fim = parseISO(periodoFim)
          return (
            isValid(dataVencimento) &&
            isValid(inicio) &&
            isValid(fim) &&
            dataVencimento >= inicio &&
            dataVencimento <= fim
          )
        })
        .map((pagamento) => {
          // Calcular valor pendente considerando pagamentos parciais
          const pagamentosParciais = pagamento.pagamentosParciais || []
          const valorPago =
            pagamentosParciais.length > 0
              ? pagamentosParciais.reduce((total, p) => total + p.valor, 0)
              : pagamento.estado === "pago"
                ? pagamento.valor
                : 0

          const valorPendente = Math.max(0, pagamento.valor - valorPago)
          const percentualPago = pagamento.valor > 0 ? (valorPago / pagamento.valor) * 100 : 0

          // Determinar status baseado no pagamento parcial
          let status = pagamento.estado
          if (valorPago > 0 && valorPendente > 0) {
            status = "parcialmente pago"
          } else if (valorPendente <= 0) {
            status = "pago"
          }

          return {
            ...pagamento,
            valorPago: valorPago,
            valorPendente: valorPendente,
            percentualPago: percentualPago,
            status: status,
          }
        })
        .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())

      setPagamentosFornecedor(pagamentos)

      // Processar pagamentos parciais
      const parciais = pagamentos
        .filter((p) => p.pagamentosParciais && p.pagamentosParciais.length > 0)
        .flatMap((p) =>
          (p.pagamentosParciais || []).map((parcial: any) => ({
            ...parcial,
            referenciaPagamento: p.referencia,
            valorTotal: p.valor,
          })),
        )
        .sort((a: any, b: any) => new Date(a.dataPagamento).getTime() - new Date(b.dataPagamento).getTime())

      setPagamentosParciais(parciais)
    } catch (error) {
      console.error("Erro ao processar pagamentos do fornecedor:", error)
      setPagamentosFornecedor([])
      setPagamentosParciais([])
    }
  }, [fornecedores, fornecedorSelecionado, incluirCotacoes, periodoInicio, periodoFim])

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    // Implementação futura
    alert("Exportação para Excel em desenvolvimento")
  }

  const toggleExpandido = (id: string) => {
    setExpandidos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const resetFilters = () => {
    setSearchTerm("")
    setIncluirCotacoes(false)
    setFiltroCategoria("")
    setFiltroStatus("todos")
    setFiltroValorMin("")
    setFiltroValorMax("")
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

  const getMetodoBadge = (metodo: string) => {
    switch (metodo) {
      case "transferência":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Transferência
          </Badge>
        )
      case "cheque":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Cheque
          </Badge>
        )
      case "débito direto":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Débito Direto
          </Badge>
        )
      case "fundo de maneio":
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
            Fundo de Maneio
          </Badge>
        )
      case "outro":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Outro
          </Badge>
        )
      default:
        return <Badge variant="outline">{metodo}</Badge>
    }
  }

  // Calcular totais para o extrato
  const calcularTotais = () => {
    if (!pagamentosFornecedor.length) return { totalValor: 0, totalPago: 0, totalPendente: 0 }

    const totalValor = pagamentosFornecedor.reduce((acc, p) => acc + p.valor, 0)
    const totalPago = pagamentosFornecedor.reduce((acc, p) => acc + p.valorPago, 0)
    const totalPendente = pagamentosFornecedor.reduce((acc, p) => acc + p.valorPendente, 0)

    return { totalValor, totalPago, totalPendente }
  }

  const totais = calcularTotais()

  const getEstadoBadge = (estado: string, percentualPago: number) => {
    switch (estado) {
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
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  return (
    <PrintLayout title="Extrato de Fornecedor">
      <Card className="border-gray-300">
        <CardHeader className="bg-gray-100 border-b border-gray-300">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-red-700">Extrato de Fornecedor</CardTitle>
              <CardDescription>Extrato de conta corrente e movimentos financeiros</CardDescription>
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
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 border rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-3 border-b">
                <h3 className="font-semibold flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  Fornecedores
                </h3>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Input
                    placeholder="Pesquisar fornecedor..."
                    className="flex-1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72">
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

                        <Button className="w-full" onClick={() => setIsFilterOpen(false)}>
                          Aplicar Filtros
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-2">
                {fornecedoresFiltrados.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Nenhum fornecedor encontrado.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {fornecedoresFiltrados.map((fornecedor) => (
                      <Button
                        key={fornecedor.id}
                        variant={fornecedorSelecionado === fornecedor.id ? "default" : "outline"}
                        className="w-full justify-start text-left"
                        onClick={() => setFornecedorSelecionado(fornecedor.id)}
                      >
                        <div className="truncate">{fornecedor.nome}</div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-3">
              {!fornecedorSelecionado ? (
                <div className="border rounded-lg p-8 text-center">
                  <p className="text-gray-500">Selecione um fornecedor para visualizar o extrato.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cabeçalho do Extrato */}
                  <Card className="border-gray-300">
                    <CardHeader className="bg-gray-50 py-3 px-4 border-b border-gray-300">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{fornecedorAtual?.nome}</h3>
                          <p className="text-sm text-gray-500">
                            {fornecedorAtual?.nuit && `NUIT: ${fornecedorAtual.nuit}`}
                            {fornecedorAtual?.endereco && ` • ${fornecedorAtual.endereco}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Período do Extrato</p>
                          <div className="flex items-center space-x-2">
                            <input
                              type="date"
                              value={periodoInicio}
                              onChange={(e) => setPeriodoInicio(e.target.value)}
                              className="text-sm border rounded p-1"
                            />
                            <span>a</span>
                            <input
                              type="date"
                              value={periodoFim}
                              onChange={(e) => setPeriodoFim(e.target.value)}
                              className="text-sm border rounded p-1"
                            />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Resumo do Extrato */}
                      <div className="grid grid-cols-3 divide-x border-b">
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500">Total em Faturas</p>
                          <p className="font-bold text-lg">
                            {totais.totalValor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </p>
                        </div>
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500">Total Pago</p>
                          <p className="font-bold text-lg text-green-700">
                            {totais.totalPago.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </p>
                        </div>
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500">Saldo Pendente</p>
                          <p className="font-bold text-lg text-red-700">
                            {totais.totalPendente.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </p>
                        </div>
                      </div>

                      {/* Tabela de Movimentos */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-red-600 text-white">
                              <TableHead className="font-semibold text-white w-[120px]">Data</TableHead>
                              <TableHead className="font-semibold text-white w-[150px]">Documento</TableHead>
                              <TableHead className="font-semibold text-white w-[200px]">Descrição</TableHead>
                              <TableHead className="font-semibold text-white w-[100px] text-right">Valor</TableHead>
                              <TableHead className="font-semibold text-white w-[100px] text-right">Pagamento</TableHead>
                              <TableHead className="font-semibold text-white w-[100px] text-right">Saldo</TableHead>
                              <TableHead className="font-semibold text-white w-[120px]">Status</TableHead>
                              <TableHead className="font-semibold w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pagamentosFornecedor.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-4">
                                  <p className="text-gray-500">Nenhum movimento encontrado para este período.</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              <>
                                {pagamentosFornecedor.map((pagamento, index) => {
                                  // Calcular saldo acumulado
                                  const saldoAcumulado = pagamentosFornecedor
                                    .slice(0, index + 1)
                                    .reduce((acc, p) => acc + p.valor - p.valorPago, 0)

                                  return (
                                    <Collapsible
                                      key={pagamento.id}
                                      open={expandidos[pagamento.id]}
                                      onOpenChange={() => toggleExpandido(pagamento.id)}
                                    >
                                      <TableRow className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                        <TableCell className="w-[120px]">
                                          {format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}
                                        </TableCell>
                                        <TableCell className="w-[150px]">
                                          <div className="flex items-center">
                                            <FileText className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                            <span>
                                              {pagamento.tipo === "fatura"
                                                ? "Fatura"
                                                : pagamento.tipo === "cotacao"
                                                  ? "Cotação"
                                                  : pagamento.tipo === "vd"
                                                    ? "VD"
                                                    : pagamento.tipo}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-500">{pagamento.referencia}</div>
                                        </TableCell>
                                        <TableCell className="w-[200px]">
                                          <div className="font-medium">{pagamento.descricao || "Sem descrição"}</div>
                                          {pagamento.departamento && (
                                            <div className="text-xs text-gray-500">Dept: {pagamento.departamento}</div>
                                          )}
                                        </TableCell>
                                        <TableCell className="w-[100px] text-right font-medium">
                                          {pagamento.valor.toLocaleString("pt-MZ", {
                                            style: "currency",
                                            currency: "MZN",
                                          })}
                                        </TableCell>
                                        <TableCell className="w-[100px] text-right text-green-700">
                                          {pagamento.valorPago > 0
                                            ? pagamento.valorPago.toLocaleString("pt-MZ", {
                                                style: "currency",
                                                currency: "MZN",
                                              })
                                            : "-"}
                                          {pagamento.valorPago > 0 && pagamento.valorPago < pagamento.valor && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              ({Math.round(pagamento.percentualPago)}%)
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell className="w-[100px] text-right font-medium text-red-700">
                                          {saldoAcumulado.toLocaleString("pt-MZ", {
                                            style: "currency",
                                            currency: "MZN",
                                          })}
                                        </TableCell>
                                        <TableCell className="w-[120px]">
                                          {getEstadoBadge(pagamento.estado, pagamento.percentualPago)}
                                        </TableCell>
                                        <TableCell>
                                          <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                              {expandidos[pagamento.id] ? (
                                                <ChevronUp className="h-4 w-4" />
                                              ) : (
                                                <ChevronDown className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </CollapsibleTrigger>
                                        </TableCell>
                                      </TableRow>
                                      <CollapsibleContent>
                                        <TableRow className="bg-gray-50 border-t border-dashed border-gray-200">
                                          <TableCell colSpan={8} className="p-0">
                                            <div className="p-4">
                                              <h4 className="font-semibold mb-2 flex items-center">
                                                <Info className="h-4 w-4 mr-1" />
                                                Detalhes do Movimento
                                              </h4>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                  <p className="text-sm text-gray-500">Método de Pagamento</p>
                                                  <p>{getMetodoBadge(pagamento.metodo || "Não especificado")}</p>
                                                </div>
                                                {pagamento.dataPagamento && (
                                                  <div>
                                                    <p className="text-sm text-gray-500">Data de Pagamento</p>
                                                    <p>
                                                      {format(new Date(pagamento.dataPagamento), "dd/MM/yyyy", {
                                                        locale: pt,
                                                      })}
                                                    </p>
                                                  </div>
                                                )}
                                                {pagamento.observacoes && (
                                                  <div className="col-span-2">
                                                    <p className="text-sm text-gray-500">Observações</p>
                                                    <p>{pagamento.observacoes}</p>
                                                  </div>
                                                )}
                                              </div>

                                              {pagamento.pagamentosParciais &&
                                                pagamento.pagamentosParciais.length > 0 && (
                                                  <div>
                                                    <h4 className="font-semibold mb-2 text-sm border-b pb-1">
                                                      Histórico de Pagamentos
                                                    </h4>
                                                    <Table>
                                                      <TableHeader>
                                                        <TableRow className="bg-gray-100">
                                                          <TableHead className="text-xs font-semibold">Data</TableHead>
                                                          <TableHead className="text-xs font-semibold">
                                                            Método
                                                          </TableHead>
                                                          <TableHead className="text-xs font-semibold">
                                                            Referência
                                                          </TableHead>
                                                          <TableHead className="text-xs font-semibold text-right">
                                                            Valor
                                                          </TableHead>
                                                          <TableHead className="text-xs font-semibold">
                                                            Usuário
                                                          </TableHead>
                                                        </TableRow>
                                                      </TableHeader>
                                                      <TableBody>
                                                        {pagamento.pagamentosParciais.map((parcial: any) => (
                                                          <TableRow key={parcial.id} className="text-sm">
                                                            <TableCell className="py-1.5">
                                                              {format(new Date(parcial.dataPagamento), "dd/MM/yyyy", {
                                                                locale: pt,
                                                              })}
                                                            </TableCell>
                                                            <TableCell className="py-1.5">
                                                              {getMetodoBadge(parcial.metodo)}
                                                            </TableCell>
                                                            <TableCell className="py-1.5">
                                                              {parcial.referencia || "-"}
                                                            </TableCell>
                                                            <TableCell className="py-1.5 text-right text-green-700">
                                                              {parcial.valor.toLocaleString("pt-MZ", {
                                                                style: "currency",
                                                                currency: "MZN",
                                                              })}
                                                            </TableCell>
                                                            <TableCell className="py-1.5">{parcial.usuario}</TableCell>
                                                          </TableRow>
                                                        ))}
                                                      </TableBody>
                                                    </Table>
                                                  </div>
                                                )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )
                                })}
                              </>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 border-t border-gray-300 p-4">
                      <div className="w-full flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          <Calendar className="h-3.5 w-3.5 inline-block mr-1" />
                          Extrato gerado em {format(new Date(), "dd/MM/yyyy", { locale: pt })}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Saldo Final</p>
                          <p className="font-bold text-lg text-red-700">
                            {totais.totalPendente.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </p>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

