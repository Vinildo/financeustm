"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { PrintLayout } from "@/components/print-layout"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useAppContext } from "@/contexts/AppContext"

export function RelatorioCliente() {
  const { fornecedores } = useAppContext()
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string>("")

  const fornecedorAtual = fornecedores.find((f) => f.id === fornecedorSelecionado)

  const calcularTotalDivida = (pagamentos: any[]) => {
    return pagamentos
      .filter((p) => p.estado === "pendente" || p.estado === "atrasado")
      .reduce((acc, curr) => acc + curr.valor, 0)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <PrintLayout title="Relatório por Fornecedor">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Relatório por Fornecedor</CardTitle>
              <CardDescription>Detalhes dos pagamentos por fornecedor</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Select value={fornecedorSelecionado} onValueChange={setFornecedorSelecionado}>
                <SelectTrigger className="w-[200px]">
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
              <Button onClick={handlePrint} className="print:hidden">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fornecedorAtual ? (
            <div className="space-y-4">
              <div className="text-2xl font-bold">
                Total da Dívida:{" "}
                {calcularTotalDivida(fornecedorAtual.pagamentos).toLocaleString("pt-MZ", {
                  style: "currency",
                  currency: "MZN",
                })}
              </div>
              <Table>
                <TableHeader className="table-header-row">
                  <TableRow>
                    <TableHead className="table-header-cell">Referência</TableHead>
                    <TableHead className="table-header-cell">Valor</TableHead>
                    <TableHead className="table-header-cell">Vencimento</TableHead>
                    <TableHead className="table-header-cell">Estado</TableHead>
                    <TableHead className="table-header-cell">Departamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedorAtual.pagamentos.map((pagamento, index) => (
                    <TableRow key={pagamento.id} className={index % 2 === 0 ? "table-row-even" : "table-row-odd"}>
                      <TableCell>{pagamento.referencia}</TableCell>
                      <TableCell>
                        {pagamento.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                      </TableCell>
                      <TableCell>{format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}</TableCell>
                      <TableCell>{pagamento.estado}</TableCell>
                      <TableCell>{pagamento.departamento}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">Selecione um fornecedor para ver o relatório</div>
          )}
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

