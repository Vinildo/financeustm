"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

interface DialogTransferenciaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pagamentoInfo: any
  onConfirm?: (dados: any) => void
}

export function DialogTransferencia({ open, onOpenChange, pagamentoInfo, onConfirm }: DialogTransferenciaProps) {
  const [dataTransferencia, setDataTransferencia] = useState<Date>(new Date())
  const [referencia, setReferencia] = useState("")
  const [observacoes, setObservacoes] = useState("")

  const handleConfirmar = () => {
    if (onConfirm) {
      onConfirm({
        dataTransferencia,
        referencia,
        observacoes,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transferência Bancária</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="bg-gray-50 p-3 rounded-md mb-2">
            <p className="font-medium">{pagamentoInfo?.beneficiario || pagamentoInfo?.fornecedorNome}</p>
            <p className="text-sm text-gray-500">{pagamentoInfo?.descricao || pagamentoInfo?.referencia}</p>
            <p className="text-sm font-medium">
              {typeof pagamentoInfo?.valor === "number"
                ? pagamentoInfo.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })
                : "0,00 MZN"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data-transferencia" className="text-sm font-medium mb-1 block">
                Data
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {format(dataTransferencia, "dd/MM/yyyy", { locale: pt })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataTransferencia}
                    onSelect={(date) => date && setDataTransferencia(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="referencia" className="text-sm font-medium mb-1 block">
                Referência
              </Label>
              <Input
                id="referencia"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Nº da transferência"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes" className="text-sm font-medium mb-1 block">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} className="bg-red-600 hover:bg-red-700">
            Confirmar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

