"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

interface NotificarFornecedorProps {
  fornecedorNome: string
  referenciaPagamento: string
  dataVencimento: Date
  valor: number
  isOpen: boolean
  onClose: () => void
}

export function NotificarFornecedor({
  fornecedorNome,
  referenciaPagamento,
  dataVencimento,
  valor,
  isOpen,
  onClose,
}: NotificarFornecedorProps) {
  const [email, setEmail] = useState("")
  const [mensagem, setMensagem] = useState("")

  const handleEnviarNotificacao = () => {
    // Aqui você implementaria a lógica real de envio de e-mail
    console.log("Enviando notificação para:", email)
    console.log("Mensagem:", mensagem)

    // Simula o envio bem-sucedido
    toast({
      title: "Notificação enviada",
      description: `Uma notificação foi enviada para ${fornecedorNome}.`,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Notificar Fornecedor</DialogTitle>
          <DialogDescription>Envie uma notificação ao fornecedor sobre o pagamento próximo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mensagem" className="text-right">
              Mensagem
            </Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="col-span-3"
              placeholder={`Prezado ${fornecedorNome},

Gostaríamos de lembrá-lo sobre o pagamento próximo:

Referência: ${referenciaPagamento}
Data de Vencimento: ${dataVencimento.toLocaleDateString()}
Valor: ${valor.toFixed(2)} MT

Por favor, certifique-se de que o pagamento seja efetuado até a data de vencimento.

Atenciosamente,
Departamento Financeiro`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleEnviarNotificacao}>
            Enviar Notificação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

