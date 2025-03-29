"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, isWithinInterval, parseISO } from "date-fns"
import { pt } from "date-fns/locale"
import { useAppContext } from "@/contexts/AppContext"
import { PrintLayout } from "@/components/print-layout"
import { Printer } from "lucide-react"

export function ExtratoFornecedor() {
  const { fornecedores } = useAppContext()
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string>("")
  const [dataInicio, setDataInicio] = useState<string>("")
  const [dataFim, setDataFim] = useState<string>("")

  const fornecedorAtual = fornecedores.find((f) => f.id === fornecedorSelecionado)

  const calcularExtrato = () => {
    if (!fornecedorAtual || !dataInicio || !dataFim) return null

    const pagamentosFiltrados = fornecedorAtual.pagamentos.filter((pagamento) => {
      const dataPagamento = pagamento.dataPagamento
        ? new Date(pagamento.dataPagamento)
        : new Date(pagamento.dataVencimento)
      return isWithinInterval(dataPagamento, {
        start: parseISO(dataInicio),
        end: parseISO(dataFim),
      })
    })

    const valorTotal = pagamentosFiltrados.reduce((acc, curr) => acc + curr.valor, 0)
    const valorPago = pagamentosFiltrados.reduce((acc, curr) => (curr.estado === "pago" ? acc + curr.valor : acc), 0)
    const saldo = valorTotal - valorPago

    return {
      pagamentos: pagamentosFiltrados,
      valorTotal,
      valorPago,
      saldo,
    }
  }

  const extrato = calcularExtrato()

  const handlePrint = () => {
    window.print()
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pagamento aguardando processamento"
      case "pago":
        return "Pagamento efetuado com sucesso"
      case "atrasado":
        return "Pagamento em atraso"
      case "cancelado":
        return "Pagamento cancelado"
      default:
        return "Status desconhecido"
    }
  }

  return (
    <PrintLayout title="Extrato de Fornecedor">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Extrato de Fornecedor</CardTitle>
              <CardDescription>Visualize o extrato de pagamentos por período</CardDescription>
            </div>
            <Button onClick={handlePrint} className="print:hidden">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Select value={fornecedorSelecionado} onValueChange={setFornecedorSelecionado}>
                  <SelectTrigger id="fornecedor">
                    <SelectValue placeholder="Selecionar fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input id="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>

            {extrato && (
              <>
                <div className="mt-6 space-y-2">
                  <p className="text-lg font-semibold">Resumo</p>
                  <p>
                    Valor Total: {extrato.valorTotal.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                  </p>
                  <p>Valor Pago: {extrato.valorPago.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</p>
                  <p>Saldo: {extrato.saldo.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referência</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extrato.pagamentos.map((pagamento) => (
                      <TableRow key={pagamento.id}>
                        <TableCell>{pagamento.referencia}</TableCell>
                        <TableCell>
                          {format(
                            pagamento.dataPagamento
                              ? new Date(pagamento.dataPagamento)
                              : new Date(pagamento.dataVencimento),
                            "dd/MM/yyyy",
                            { locale: pt },
                          )}
                        </TableCell>
                        <TableCell>
                          {pagamento.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                        </TableCell>
                        <TableCell>{pagamento.estado}</TableCell>
                        <TableCell>
                          {pagamento.descricao || "Sem descrição"} - {getStatusDescription(pagamento.estado)}
                          <br />
                          <span className="text-sm text-gray-500">
                            Método: {pagamento.metodo}, Departamento: {pagamento.departamento}
                          </span>
                          {pagamento.observacoes && (
                            <p className="text-sm text-gray-500 mt-1">Obs: {pagamento.observacoes}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

