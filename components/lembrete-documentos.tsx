"use client"
import { useState } from "react"
import { useAppContext } from "@/contexts/AppContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { FileCheck, AlertTriangle, Percent } from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

interface LembreteDocumentosProps {
  pagamento: {
    id: string
    referencia: string
    fornecedorId: string
    fornecedorNome: string
    valor: number
    valorPago?: number
    dataPagamento: Date | null
    facturaRecebida?: boolean
    reciboRecebido?: boolean
    vdRecebido?: boolean
    estado: string
    tipo?: string
  }
  isOpen: boolean
  onClose: () => void
}

export function LembreteDocumentos({ pagamento, isOpen, onClose }: LembreteDocumentosProps) {
  const { updatePagamento } = useAppContext()
  const [documentos, setDocumentos] = useState({
    facturaRecebida: pagamento.facturaRecebida || false,
    reciboRecebido: pagamento.reciboRecebido || false,
    vdRecebido: pagamento.vdRecebido || false,
  })

  const handleSalvar = () => {
    try {
      // Atualizar o pagamento com os documentos marcados
      const pagamentoAtualizado = {
        ...pagamento,
        facturaRecebida: documentos.facturaRecebida,
        reciboRecebido: documentos.reciboRecebido,
        vdRecebido: documentos.vdRecebido,
      }

      // Chamar a função de atualização do contexto
      updatePagamento(pagamento.fornecedorId, pagamentoAtualizado)

      toast({
        title: "Documentos atualizados",
        description: "O status dos documentos foi atualizado com sucesso.",
      })

      onClose()
    } catch (error) {
      console.error("Erro ao atualizar documentos:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar os documentos. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Determinar quais documentos são necessários com base no tipo de pagamento
  const mostrarFatura = pagamento.tipo !== "vd"
  const mostrarVD = pagamento.tipo === "vd"
  const mostrarRecibo = true // Recibo é sempre necessário

  const isPagamentoParcial = pagamento.estado === "parcialmente pago"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileCheck className="mr-2 h-5 w-5 text-green-600" />
            Documentos Fiscais
          </DialogTitle>
          <DialogDescription>
            Verifique os documentos fiscais recebidos para o pagamento {pagamento.referencia}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Lembrete importante</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {isPagamentoParcial
                    ? "Mesmo para pagamentos parciais, é necessário obter documentação fiscal. Certifique-se de receber e arquivar todos os documentos necessários."
                    : "Todos os pagamentos devem ter a documentação fiscal completa. Certifique-se de receber e arquivar todos os documentos necessários."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="font-medium mb-2">Detalhes do Pagamento</h3>
              <p className="text-sm text-gray-600">
                Fornecedor: <span className="font-medium">{pagamento.fornecedorNome}</span>
              </p>
              <p className="text-sm text-gray-600">
                Referência: <span className="font-medium">{pagamento.referencia}</span>
              </p>
              <p className="text-sm text-gray-600">
                Valor:{" "}
                <span className="font-medium">
                  {pagamento.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                </span>
              </p>
              {isPagamentoParcial && pagamento.valorPago && (
                <p className="text-sm text-gray-600">
                  Valor Pago:{" "}
                  <span className="font-medium flex items-center">
                    <Percent className="mr-1 h-3 w-3 text-purple-600" />
                    {pagamento.valorPago.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })} (
                    {Math.round((pagamento.valorPago / pagamento.valor) * 100)}%)
                  </span>
                </p>
              )}
              <p className="text-sm text-gray-600">
                Data de Pagamento:{" "}
                <span className="font-medium">
                  {pagamento.dataPagamento
                    ? format(new Date(pagamento.dataPagamento), "dd/MM/yyyy", { locale: pt })
                    : "Não pago"}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Estado:{" "}
                <span className={`font-medium ${isPagamentoParcial ? "text-purple-600" : "text-green-600"}`}>
                  {isPagamentoParcial ? "Parcialmente Pago" : "Pago"}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Documentos Recebidos</h3>

              {mostrarFatura && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fatura"
                    checked={documentos.facturaRecebida}
                    onCheckedChange={(checked) => setDocumentos({ ...documentos, facturaRecebida: checked as boolean })}
                  />
                  <Label htmlFor="fatura" className="cursor-pointer">
                    Fatura recebida
                  </Label>
                </div>
              )}

              {mostrarRecibo && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recibo"
                    checked={documentos.reciboRecebido}
                    onCheckedChange={(checked) => setDocumentos({ ...documentos, reciboRecebido: checked as boolean })}
                  />
                  <Label htmlFor="recibo" className="cursor-pointer">
                    Recibo recebido
                    {isPagamentoParcial && <span className="text-xs text-purple-600 ml-1">(pagamento parcial)</span>}
                  </Label>
                </div>
              )}

              {mostrarVD && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vd"
                    checked={documentos.vdRecebido}
                    onCheckedChange={(checked) => setDocumentos({ ...documentos, vdRecebido: checked as boolean })}
                  />
                  <Label htmlFor="vd" className="cursor-pointer">
                    VD (Venda a Dinheiro) recebida
                  </Label>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

