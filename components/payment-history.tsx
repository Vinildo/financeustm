import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, User, FileText } from "lucide-react"

// Atualizar a interface HistoryEntry para corresponder ao formato que estamos usando
interface HistoryEntry {
  id: string
  timestamp: Date
  username: string
  action: "create" | "update" | "delete"
  details: string
  previousState?: any
  newState?: any
}

interface PaymentHistoryProps {
  history: HistoryEntry[]
  isOpen: boolean
  onClose: () => void
}

export function PaymentHistory({ history, isOpen, onClose }: PaymentHistoryProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Edições</DialogTitle>
          <DialogDescription>Registro de todas as alterações feitas neste pagamento</DialogDescription>
        </DialogHeader>
        {history && history.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data e Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-gray-500" />
                        {format(new Date(entry.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: pt })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-500" />
                        {entry.username || "Admin User"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          entry.action === "create"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : entry.action === "update"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {entry.action === "create" ? "Criação" : entry.action === "update" ? "Atualização" : "Remoção"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-gray-500" />
                        {entry.details}
                      </div>
                      {entry.action === "update" && entry.previousState && entry.newState && (
                        <div className="mt-2 text-xs text-gray-500">
                          {entry.previousState.estado !== entry.newState.estado && (
                            <div>
                              Estado: {entry.previousState.estado} → {entry.newState.estado}
                            </div>
                          )}
                          {entry.previousState.valor !== entry.newState.valor && (
                            <div>
                              Valor: {entry.previousState.valor} → {entry.newState.valor}
                            </div>
                          )}
                          {entry.previousState.dataVencimento !== entry.newState.dataVencimento && (
                            <div>
                              Data de Vencimento:{" "}
                              {format(new Date(entry.previousState.dataVencimento), "dd/MM/yyyy", { locale: pt })} →{" "}
                              {format(new Date(entry.newState.dataVencimento), "dd/MM/yyyy", { locale: pt })}
                            </div>
                          )}
                          {entry.previousState.metodo !== entry.newState.metodo && (
                            <div>
                              Método: {entry.previousState.metodo} → {entry.newState.metodo}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Nenhum histórico de edição encontrado para este pagamento.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

