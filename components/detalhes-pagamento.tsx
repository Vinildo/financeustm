import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Pagamento } from "@/types/fornecedor"

interface DetalhesPagamentoProps {
  pagamento: Pagamento & { fornecedorNome: string }
  isOpen: boolean
  onClose: () => void
}

export function DetalhesPagamento({ pagamento, isOpen, onClose }: DetalhesPagamentoProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Pagamento</DialogTitle>
          <DialogDescription>Informações detalhadas sobre o pagamento {pagamento.referencia}</DialogDescription>
        </DialogHeader>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Referência</TableCell>
              <TableCell>{pagamento.referencia}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Fornecedor</TableCell>
              <TableCell>{pagamento.fornecedorNome}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Valor</TableCell>
              <TableCell>{pagamento.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Data de Vencimento</TableCell>
              <TableCell>{format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Data de Pagamento</TableCell>
              <TableCell>
                {pagamento.dataPagamento
                  ? format(new Date(pagamento.dataPagamento), "dd/MM/yyyy", { locale: pt })
                  : "Não pago"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Estado</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`
                  ${pagamento.estado === "pendente" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : ""}
                  ${pagamento.estado === "pago" ? "bg-green-50 text-green-700 border-green-200" : ""}
                  ${pagamento.estado === "parcialmente pago" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
                  ${pagamento.estado === "atrasado" ? "bg-red-50 text-red-700 border-red-200" : ""}
                  ${pagamento.estado === "cancelado" ? "bg-gray-50 text-gray-700 border-gray-200" : ""}
                `}
                >
                  {pagamento.estado.charAt(0).toUpperCase() + pagamento.estado.slice(1)}
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Método</TableCell>
              <TableCell>{pagamento.metodo}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Departamento</TableCell>
              <TableCell>{pagamento.departamento}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Observações</TableCell>
              <TableCell>{pagamento.observacoes || "Nenhuma observação"}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {pagamento.pagamentosParciais && pagamento.pagamentosParciais.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-1">Histórico de Pagamentos Parciais</h3>
            <div className="border rounded-md overflow-hidden max-h-[150px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Data
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Valor
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Método
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagamento.pagamentosParciais.map((parcial) => (
                    <tr key={parcial.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {format(new Date(parcial.dataPagamento), "dd/MM/yyyy", { locale: pt })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-medium">
                        {parcial.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{parcial.metodo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 bg-gray-50 p-2 rounded-md border border-gray-200 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-xs font-medium text-gray-500">Total:</span>
                  <span className="text-xs font-medium text-gray-900 ml-1">
                    {pagamento.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Pago:</span>
                  <span className="text-xs font-medium text-green-600 ml-1">
                    {(pagamento.valorPago || 0).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Restante:</span>
                  <span className="text-xs font-medium text-red-600 ml-1">
                    {(pagamento.valor - (pagamento.valorPago || 0) || 0).toLocaleString("pt-MZ", {
                      style: "currency",
                      currency: "MZN",
                    })}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${Math.round(((pagamento.valorPago || 0) / pagamento.valor) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-center mt-0.5 text-gray-500">
                  {Math.round(((pagamento.valorPago || 0) / pagamento.valor) * 100)}% pago
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

