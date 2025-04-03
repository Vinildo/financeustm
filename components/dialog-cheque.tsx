"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { adicionarCheque } from "@/lib/cheque-utils"

interface DialogChequeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pagamentoInfo: any
  onChequeEmitido?: (chequeNumero: string) => void
}

export function DialogCheque({ open, onOpenChange, pagamentoInfo, onChequeEmitido }: DialogChequeProps) {
  const { toast } = useToast()
  const [chequeData, setChequeData] = useState({
    numero: "",
    banco: "BIM",
    dataEmissao: new Date().toISOString().split("T")[0],
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setChequeData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    try {
      if (!chequeData.numero) {
        toast({
          title: "Erro",
          description: "Por favor, informe o número do cheque.",
          variant: "destructive",
        })
        return
      }

      console.log("Emitindo cheque com dados:", {
        chequeData,
        pagamentoInfo,
      })

      // Criar novo cheque
      const novoCheque = adicionarCheque({
        numero: chequeData.numero,
        banco: chequeData.banco,
        beneficiario: pagamentoInfo.fornecedorNome || pagamentoInfo.beneficiario,
        valor: Number(pagamentoInfo.valor) || 0,
        dataEmissao: new Date(chequeData.dataEmissao),
        descricao: pagamentoInfo.descricao,
        pagamentoId: pagamentoInfo.id, // Associar ao pagamento
        pagamentoReferencia: pagamentoInfo.referencia,
        fornecedorNome: pagamentoInfo.fornecedorNome,
      })

      if (novoCheque) {
        toast({
          title: "Cheque emitido",
          description: `Cheque nº ${novoCheque.numero} emitido com sucesso.`,
        })

        // Notificar o componente pai que o cheque foi emitido
        if (onChequeEmitido) {
          onChequeEmitido(novoCheque.numero)
        }
      } else {
        toast({
          title: "Aviso",
          description: "Já existe um cheque com este número.",
          variant: "warning",
        })
      }

      // Fechar diálogo
      onOpenChange(false)

      // Limpar formulário
      setChequeData({
        numero: "",
        banco: "BIM",
        dataEmissao: new Date().toISOString().split("T")[0],
      })
    } catch (error) {
      console.error("Erro ao emitir cheque:", error)
      toast({
        title: "Erro",
        description: "Não foi possível emitir o cheque. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Emitir Cheque</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do cheque para o pagamento de {Number(pagamentoInfo.valor || "0").toFixed(2)} MT para{" "}
            {pagamentoInfo.fornecedorNome || pagamentoInfo.beneficiario}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="numero" className="text-right">
              Número
            </Label>
            <Input
              id="numero"
              name="numero"
              value={chequeData.numero}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="banco" className="text-right">
              Banco
            </Label>
            <Input
              id="banco"
              name="banco"
              value={chequeData.banco}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dataEmissao" className="text-right">
              Data
            </Label>
            <Input
              id="dataEmissao"
              name="dataEmissao"
              type="date"
              value={chequeData.dataEmissao}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} className="bg-red-600 hover:bg-red-700">
            Emitir Cheque
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

