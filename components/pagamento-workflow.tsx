"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogCheque } from "./dialog-cheque"
import { DialogFundoManeio } from "./dialog-fundo-maneio"
import { DialogTransferencia } from "./dialog-transferencia"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"

export function PagamentoWorkflow() {
  const { toast } = useToast()
  const [pagamento, setPagamento] = useState({
    id: "", // Será gerado automaticamente
    beneficiario: "",
    descricao: "",
    valor: "",
    metodo: "transferencia",
    data: new Date().toISOString().split("T")[0],
    estado: "pendente",
  })

  const [openChequeDialog, setOpenChequeDialog] = useState(false)
  const [openFundoDialog, setOpenFundoDialog] = useState(false)
  const [openTransferenciaDialog, setOpenTransferenciaDialog] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPagamento((prev) => ({ ...prev, [name]: value }))
  }

  const handleMetodoChange = (value: string) => {
    setPagamento((prev) => ({ ...prev, metodo: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Gerar ID único para o pagamento
    const novoPagamento = {
      ...pagamento,
      id: uuidv4(), // Gera um ID único
      valor: Number.parseFloat(pagamento.valor) || 0,
    }

    try {
      // Salvar no localStorage para persistência local
      const pagamentosAtuais = JSON.parse(localStorage.getItem("pagamentos") || "[]")
      localStorage.setItem("pagamentos", JSON.stringify([...pagamentosAtuais, novoPagamento]))

      // Salvar no Supabase (simulado aqui)
      // Na implementação real, você usaria o cliente Supabase
      // await supabase.from('pagamentos').insert(novoPagamento)

      toast({
        title: "Pagamento registrado",
        description: `Pagamento de ${novoPagamento.valor.toFixed(2)} MT para ${novoPagamento.beneficiario} registrado com sucesso.`,
      })

      // Abrir diálogo apropriado com base no método de pagamento
      if (novoPagamento.metodo === "cheque") {
        setOpenChequeDialog(true)
      } else if (novoPagamento.metodo === "fundo_maneio") {
        setOpenFundoDialog(true)
      } else if (novoPagamento.metodo === "transferencia") {
        setOpenTransferenciaDialog(true)
      }

      // Limpar formulário
      setPagamento({
        id: "",
        beneficiario: "",
        descricao: "",
        valor: "",
        metodo: "transferencia",
        data: new Date().toISOString().split("T")[0],
        estado: "pendente",
      })
    } catch (error) {
      console.error("Erro ao salvar pagamento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Novo Pagamento</CardTitle>
          <CardDescription>Preencha os detalhes do pagamento e selecione o método de pagamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="beneficiario">Beneficiário</Label>
                  <Input
                    id="beneficiario"
                    name="beneficiario"
                    value={pagamento.beneficiario}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="valor">Valor (MT)</Label>
                  <Input
                    id="valor"
                    name="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pagamento.valor}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  name="descricao"
                  value={pagamento.descricao}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    name="data"
                    type="date"
                    value={pagamento.data}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="metodo">Método de Pagamento</Label>
                  <Select value={pagamento.metodo} onValueChange={handleMetodoChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="fundo_maneio">Fundo de Maneio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="mt-4 w-full">
                Registrar Pagamento
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Diálogos para cada método de pagamento */}
      <DialogCheque open={openChequeDialog} onOpenChange={setOpenChequeDialog} pagamentoInfo={pagamento} />

      <DialogFundoManeio open={openFundoDialog} onOpenChange={setOpenFundoDialog} pagamentoInfo={pagamento} />

      <DialogTransferencia
        open={openTransferenciaDialog}
        onOpenChange={setOpenTransferenciaDialog}
        pagamentoInfo={pagamento}
      />
    </div>
  )
}

