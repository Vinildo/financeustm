"use client"

import { useState, useEffect } from "react"
import { format, isAfter, isBefore, isEqual, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { pt } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, FileSpreadsheet, Printer } from "lucide-react"
import { useAppContext } from "@/contexts/AppContext"
import { PrintLayout } from "@/components/print-layout"
import { Progress } from "@/components/ui/progress"

export function RelatorioDivida() {
  const { fornecedores = [] } = useAppContext() || {}
  const [mesSelecionado, setMesSelecionado] = useState<Date>(startOfMonth(new Date()))
  const [dividas, setDividas] = useState<any[]>([])
  const [totalDivida, setTotalDivida] = useState(0)
  const [totalPago, setTotalPago] = useState(0)
  const [totalPendente, setTotalPendente] = useState(0)
  const [incluirCotacoes, setIncluirCotacoes] = useState(false)

  useEffect(() => {
    if (!fornecedores || fornecedores.length === 0) {
      setDividas([])
      setTotalDivida(0)
      setTotalPago(0)
      setTotalPendente(0)
      return
    }

    try {
      // Filtrar pagamentos do mês selecionado
      const dividasFiltradas = fornecedores.flatMap((fornecedor) => {
        return (fornecedor.pagamentos || [])
          .filter((pagamento) => {
            // Filtrar por mês e excluir cotações se necessário
            const dataVencimento = new Date(pagamento.dataVencimento)
            const noMesSelecionado =
              (isAfter(dataVencimento, startOfMonth(mesSelecionado)) &&
                isBefore(dataVencimento, endOfMonth(mesSelecionado))) ||
              isEqual(dataVencimento, startOfMonth(mesSelecionado)) ||
              isEqual(dataVencimento, endOfMonth(mesSelecionado))

            // Excluir cotações se a opção não estiver marcada
            if (!incluirCotacoes && pagamento.tipo === "cotacao") {
              return false
            }

            return noMesSelecionado
          })
          .map((pagamento) => {
            // Calcular valor pendente considerando pagamentos parciais
            const valorPago = pagamento.valorPago || 0
            const valorPendente = pagamento.valor - valorPago
            const percentualPago = pagamento.valor > 0 ? (valorPago / pagamento.valor) * 100 : 0

            // Determinar status baseado no pagamento parcial
            let status = pagamento.estado
            if (valorPago > 0 && valorPago < pagamento.valor) {
              status = "parcialmente pago"
            }

            return {
              ...pagamento,
              fornecedorNome: fornecedor.nome,
              fornecedorId: fornecedor.id,
              valorPago: valorPago,
              valorPendente: valorPendente,
              percentualPago: percentualPago,
              status: status,
            }
          })
      })

      setDividas(dividasFiltradas)

      // Calcular totais
      const total = dividasFiltradas.reduce((acc, divida) => acc + divida.valor, 0)
      const pago = dividasFiltradas.reduce((acc, divida) => acc + (divida.valorPago || 0), 0)
      const pendente = dividasFiltradas.reduce((acc, divida) => acc + divida.valorPendente, 0)

      setTotalDivida(total)
      setTotalPago(pago)
      setTotalPendente(pendente)
    } catch (error) {
      console.error("Erro ao processar dívidas:", error)
      setDividas([])
      setTotalDivida(0)
      setTotalPago(0)
      setTotalPendente(0)
    }
  }, [fornecedores, mesSelecionado, incluirCotacoes])

  const handleMesAnterior = () => {
    setMesSelecionado(subMonths(mesSelecionado, 1))
  }

  const handleProximoMes = () => {
    setMesSelecionado(addMonths(mesSelecionado, 1))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    // Implementação futura
    alert("Exportação para Excel em desenvolvimento")
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
    <PrintLayout title="Relatório de Dívidas">
      <Card>
        <CardHeader className="bg-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Relatório de Dívidas</CardTitle>
              <CardDescription>
                {incluirCotacoes ? "Todas as dívidas e cotações do período" : "Dívidas do período (excluindo cotações)"}
              </CardDescription>
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
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Button onClick={handleMesAnterior} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold">{format(mesSelecionado, "MMMM yyyy", { locale: pt })}</span>
              <Button onClick={handleProximoMes} variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm">
                <input
                  type="checkbox"
                  checked={incluirCotacoes}
                  onChange={() => setIncluirCotacoes(!incluirCotacoes)}
                  className="mr-2"
                />
                Incluir cotações
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Total de Dívidas</div>
                <div className="text-2xl font-bold">
                  {totalDivida.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Total Pago</div>
                <div className="text-2xl font-bold text-green-700">
                  {totalPago.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Total Pendente</div>
                <div className="text-2xl font-bold text-yellow-700">
                  {totalPendente.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                </div>
              </CardContent>
            </Card>
          </div>

          {dividas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma dívida encontrada para o período selecionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-600 text-white">
                    <TableHead className="font-semibold text-white">Referência</TableHead>
                    <TableHead className="font-semibold text-white">Fornecedor</TableHead>
                    <TableHead className="font-semibold text-white">Tipo</TableHead>
                    <TableHead className="font-semibold text-white">Vencimento</TableHead>
                    <TableHead className="font-semibold text-white text-right">Valor Original</TableHead>
                    <TableHead className="font-semibold text-white text-right">Valor Pendente</TableHead>
                    <TableHead className="font-semibold text-white">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dividas.map((divida, index) => (
                    <TableRow key={divida.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell className="font-medium">{divida.referencia}</TableCell>
                      <TableCell>{divida.fornecedorNome}</TableCell>
                      <TableCell>
                        {divida.tipo === "fatura"
                          ? "Fatura"
                          : divida.tipo === "cotacao"
                            ? "Cotação"
                            : divida.tipo === "vd"
                              ? "VD"
                              : divida.tipo}
                      </TableCell>
                      <TableCell>{format(new Date(divida.dataVencimento), "dd/MM/yyyy", { locale: pt })}</TableCell>
                      <TableCell className="text-right">
                        {divida.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                      </TableCell>
                      <TableCell className="text-right">
                        {divida.valorPendente.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                      </TableCell>
                      <TableCell>{getStatusBadge(divida.status, divida.percentualPago)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

