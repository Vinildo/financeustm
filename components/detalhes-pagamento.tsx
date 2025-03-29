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
      <DialogContent className="sm:max-w-[425px]">
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
      </DialogContent>
    </Dialog>
  )
}

