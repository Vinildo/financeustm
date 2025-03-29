"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PrintLayout } from "@/components/print-layout"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/contexts/AppContext"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, isWithinInterval, startOfYear } from "date-fns"
import { pt } from "date-fns/locale"
import { PeriodFilter } from "@/components/ui/period-filter"
// Adicionar a importação do componente Tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Modificar o componente RelatorioDivida para incluir a opção de visualização em tabela
export function RelatorioDivida() {
  const { fornecedores } = useAppContext()
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroFornecedor, setFiltroFornecedor] = useState<string>("todos")
  const [startDate, setStartDate] = useState<Date | undefined>(startOfYear(new Date()))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [activeTab, setActiveTab] = useState("tabela") // Adicionar estado para controlar a aba ativa

  const operacoesFiltradas = useMemo(() => {
    return fornecedores
      .flatMap((fornecedor) =>
        fornecedor.pagamentos
          .filter((pagamento) => {
            const dataVencimento = new Date(pagamento.dataVencimento)
            const isWithinDateRange =
              startDate && endDate ? isWithinInterval(dataVencimento, { start: startDate, end: endDate }) : true

            return (
              pagamento.tipo === "fatura" &&
              (filtroFornecedor === "todos" || fornecedor.id === filtroFornecedor) &&
              (filtroEstado === "todos" || pagamento.estado === filtroEstado) &&
              (pagamento.estado === "pendente" || pagamento.estado === "atrasado") &&
              isWithinDateRange
            )
          })
          .map((pagamento) => ({
            ...pagamento,
            fornecedorNome: fornecedor.nome,
          })),
      )
      .sort((a, b) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime())
  }, [fornecedores, filtroEstado, filtroFornecedor, startDate, endDate])

  const totalDivida = useMemo(() => {
    return operacoesFiltradas.reduce((acc, curr) => acc + curr.valor, 0)
  }, [operacoesFiltradas])

  // Dados agrupados por departamento para o gráfico
  const dadosPorDepartamento = useMemo(() => {
    const dados: Record<string, { pendente: number; atrasado: number }> = {}

    operacoesFiltradas.forEach((operacao) => {
      if (!dados[operacao.departamento]) {
        dados[operacao.departamento] = { pendente: 0, atrasado: 0 }
      }

      if (operacao.estado === "pendente") {
        dados[operacao.departamento].pendente += operacao.valor
      } else if (operacao.estado === "atrasado") {
        dados[operacao.departamento].atrasado += operacao.valor
      }
    })

    return Object.entries(dados).map(([departamento, valores]) => ({
      departamento,
      pendente: valores.pendente,
      atrasado: valores.atrasado,
      total: valores.pendente + valores.atrasado,
    }))
  }, [operacoesFiltradas])

  const handlePrint = () => {
    window.print()
  }

  return (
    <PrintLayout title="Relatório de Dívida">
      <Card className="w-full">
        <CardHeader className="bg-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Relatório de Dívida (Apenas Faturas)</CardTitle>
              <CardDescription>Visão geral das dívidas por departamento</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filtroFornecedor} onValueChange={setFiltroFornecedor}>
                <SelectTrigger className="w-[200px] bg-white border-gray-300">
                  <SelectValue placeholder="Filtrar por fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os fornecedores</SelectItem>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-[180px] bg-white border-gray-300">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
              <PeriodFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                className="bg-white border-gray-300"
              />
              <Button onClick={handlePrint} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-2xl font-bold">
              Total da Dívida: {totalDivida.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tabela">Tabela</TabsTrigger>
                <TabsTrigger value="grafico">Gráfico</TabsTrigger>
              </TabsList>

              <TabsContent value="tabela" className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-red-600 text-white">
                      <TableHead className="text-white">Fornecedor</TableHead>
                      <TableHead className="text-white">Referência</TableHead>
                      <TableHead className="text-white">Valor</TableHead>
                      <TableHead className="text-white">Data de Vencimento</TableHead>
                      <TableHead className="text-white">Estado</TableHead>
                      <TableHead className="text-white">Departamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operacoesFiltradas.map((operacao, index) => (
                      <TableRow key={operacao.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <TableCell>{operacao.fornecedorNome}</TableCell>
                        <TableCell>{operacao.referencia}</TableCell>
                        <TableCell>
                          {operacao.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                        </TableCell>
                        <TableCell>{format(new Date(operacao.dataVencimento), "dd/MM/yyyy", { locale: pt })}</TableCell>
                        <TableCell>{operacao.estado}</TableCell>
                        <TableCell>{operacao.departamento}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="grafico" className="pt-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosPorDepartamento} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="departamento" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                      />
                      <Legend />
                      <Bar dataKey="pendente" name="Pendente" fill="#FFBB28" />
                      <Bar dataKey="atrasado" name="Atrasado" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Resumo por Departamento</h3>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-600 text-white">
                        <TableHead className="text-white">Departamento</TableHead>
                        <TableHead className="text-white text-right">Pendente</TableHead>
                        <TableHead className="text-white text-right">Atrasado</TableHead>
                        <TableHead className="text-white text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosPorDepartamento.map((item, index) => (
                        <TableRow key={item.departamento} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <TableCell className="font-medium">{item.departamento}</TableCell>
                          <TableCell className="text-right">
                            {item.pendente.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.atrasado.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.total.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-100 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right">
                          {dadosPorDepartamento
                            .reduce((acc, curr) => acc + curr.pendente, 0)
                            .toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                        </TableCell>
                        <TableCell className="text-right">
                          {dadosPorDepartamento
                            .reduce((acc, curr) => acc + curr.atrasado, 0)
                            .toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalDivida.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

