"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/components/ui/use-toast"
import { PrintLayout } from "@/components/print-layout"
import { Trash2, Printer, FileDown } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"
import { useAppContext } from "@/contexts/AppContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Modificar o tipo Cheque para incluir referência ao pagamento
type Cheque = {
  id: string
  numero: string
  valor: number
  beneficiario: string
  dataEmissao: Date
  dataCompensacao: Date | null
  estado: "pendente" | "compensado" | "cancelado"
  pagamentoId?: string
  pagamentoReferencia?: string
  fornecedorNome?: string
}

// Modificar o componente ControloCheques para incluir a integração com pagamentos
export function ControloCheques() {
  const { fornecedores, atualizarPagamento } = useAppContext()
  // Modificar o componente ControloCheques para carregar cheques do localStorage
  // Substitua a declaração do estado cheques com esta versão:

  const [cheques, setCheques] = useState<Cheque[]>([])

  // Adicionar um useEffect para carregar os cheques do localStorage
  // Adicione este useEffect logo após a declaração do estado:

  useEffect(() => {
    // Carregar cheques do localStorage
    const chequesArmazenados = localStorage.getItem("cheques")
    if (chequesArmazenados) {
      try {
        const chequesParsed = JSON.parse(chequesArmazenados)
        // Converter as datas de string para objeto Date
        const chequesFormatados = chequesParsed.map((cheque: any) => ({
          ...cheque,
          dataEmissao: new Date(cheque.dataEmissao),
          dataCompensacao: cheque.dataCompensacao ? new Date(cheque.dataCompensacao) : null,
        }))
        setCheques(chequesFormatados)
      } catch (error) {
        console.error("Erro ao carregar cheques:", error)
        setCheques([])
      }
    }
  }, [])

  // Obter todos os pagamentos pendentes que podem ser associados a cheques
  const pagamentosPendentes = fornecedores.flatMap((fornecedor) =>
    fornecedor.pagamentos
      .filter((pagamento) => pagamento.estado === "pendente" || pagamento.estado === "atrasado")
      .map((pagamento) => ({
        ...pagamento,
        fornecedorId: fornecedor.id,
        fornecedorNome: fornecedor.nome,
      })),
  )

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text("Controlo de Cheques", 14, 15)
    doc.autoTable({
      head: [["Número", "Valor", "Beneficiário", "Data de Emissão", "Data de Compensação", "Estado", "Pagamento"]],
      body: cheques.map((cheque) => [
        cheque.numero,
        `${cheque.valor.toFixed(2)} MT`,
        cheque.beneficiario,
        format(cheque.dataEmissao, "dd/MM/yyyy", { locale: pt }),
        cheque.dataCompensacao ? format(cheque.dataCompensacao, "dd/MM/yyyy", { locale: pt }) : "-",
        cheque.estado,
        cheque.pagamentoReferencia || "-",
      ]),
    })
    doc.save("controlo-cheques.pdf")
  }

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      cheques.map((cheque) => ({
        Número: cheque.numero,
        Valor: cheque.valor,
        Beneficiário: cheque.beneficiario,
        "Data de Emissão": format(cheque.dataEmissao, "dd/MM/yyyy", { locale: pt }),
        "Data de Compensação": cheque.dataCompensacao
          ? format(cheque.dataCompensacao, "dd/MM/yyyy", { locale: pt })
          : "-",
        Estado: cheque.estado,
        Pagamento: cheque.pagamentoReferencia || "-",
      })),
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Cheques")

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.download = "controlo-cheques.xlsx"
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCheque, setNewCheque] = useState<Partial<Cheque>>({
    estado: "pendente",
  })
  const [pagamentoSelecionadoId, setPagamentoSelecionadoId] = useState<string>("")

  // Modificar a função handleAddCheque para salvar no localStorage
  // Substitua a função handleAddCheque existente com esta versão:

  const handleAddCheque = () => {
    if (newCheque.numero && newCheque.valor && newCheque.beneficiario && newCheque.dataEmissao) {
      // Verificar se um pagamento foi selecionado
      let pagamentoReferencia = ""
      let fornecedorNome = ""

      if (pagamentoSelecionadoId && pagamentoSelecionadoId !== "none") {
        const pagamentoSelecionado = pagamentosPendentes.find((p) => p.id === pagamentoSelecionadoId)
        if (pagamentoSelecionado) {
          pagamentoReferencia = pagamentoSelecionado.referencia
          fornecedorNome = pagamentoSelecionado.fornecedorNome

          // Se o valor do cheque não foi definido manualmente, usar o valor do pagamento
          if (!newCheque.valor) {
            newCheque.valor = pagamentoSelecionado.valor
          }

          // Se o beneficiário não foi definido manualmente, usar o nome do fornecedor
          if (!newCheque.beneficiario) {
            newCheque.beneficiario = pagamentoSelecionado.fornecedorNome
          }
        }
      }

      const chequeToAdd: Cheque = {
        id: Date.now().toString(),
        numero: newCheque.numero,
        valor: newCheque.valor,
        beneficiario: newCheque.beneficiario,
        dataEmissao: newCheque.dataEmissao,
        dataCompensacao: null,
        estado: "pendente",
        pagamentoId: pagamentoSelecionadoId !== "none" ? pagamentoSelecionadoId : undefined,
        pagamentoReferencia: pagamentoReferencia || undefined,
        fornecedorNome: fornecedorNome || undefined,
      }

      const chequesAtualizados = [...cheques, chequeToAdd]
      setCheques(chequesAtualizados)

      // Salvar no localStorage
      localStorage.setItem("cheques", JSON.stringify(chequesAtualizados))

      setIsAddDialogOpen(false)
      setNewCheque({ estado: "pendente" })
      setPagamentoSelecionadoId("")

      toast({
        title: "Cheque adicionado",
        description: "O novo cheque foi adicionado com sucesso.",
      })

      // Se um pagamento foi selecionado, atualizar o método de pagamento para "cheque"
      if (pagamentoSelecionadoId && pagamentoSelecionadoId !== "none") {
        const pagamentoSelecionado = pagamentosPendentes.find((p) => p.id === pagamentoSelecionadoId)
        if (pagamentoSelecionado) {
          atualizarPagamento(pagamentoSelecionado.fornecedorId, {
            ...pagamentoSelecionado,
            metodo: "cheque",
            observacoes: `${pagamentoSelecionado.observacoes ? pagamentoSelecionado.observacoes + " | " : ""}Cheque nº ${newCheque.numero}`,
          })

          toast({
            title: "Pagamento atualizado",
            description: `O pagamento ${pagamentoSelecionado.referencia} foi associado ao cheque.`,
          })
        }
      }
    }
  }

  // Modificar a função handleCompensarCheque para salvar no localStorage
  // Substitua a função handleCompensarCheque existente com esta versão:

  const handleCompensarCheque = (id: string) => {
    const chequesAtualizados = cheques.map((cheque) => {
      if (cheque.id === id) {
        // Marcar o cheque como compensado
        const chequeAtualizado = {
          ...cheque,
          estado: "compensado",
          dataCompensacao: new Date(),
        }

        // Se o cheque estiver associado a um pagamento, marcar o pagamento como pago
        if (cheque.pagamentoId) {
          const pagamento = pagamentosPendentes.find((p) => p.id === cheque.pagamentoId)
          if (pagamento) {
            atualizarPagamento(pagamento.fornecedorId, {
              ...pagamento,
              estado: "pago",
              dataPagamento: new Date(),
              observacoes: `${pagamento.observacoes ? pagamento.observacoes + " | " : ""}Cheque nº ${cheque.numero} compensado em ${format(new Date(), "dd/MM/yyyy", { locale: pt })}`,
            })

            toast({
              title: "Pagamento atualizado",
              description: `O pagamento ${pagamento.referencia} foi marcado como pago.`,
            })
          }
        }

        // Adicionar uma transação bancária para este cheque
        adicionarTransacaoBancaria(chequeAtualizado)

        return chequeAtualizado
      }
      return cheque
    })

    setCheques(chequesAtualizados)

    // Salvar no localStorage
    localStorage.setItem("cheques", JSON.stringify(chequesAtualizados))

    toast({
      title: "Cheque compensado",
      description: "O cheque foi marcado como compensado.",
    })
  }

  // Adicionar função para criar uma transação bancária a partir de um cheque
  // Adicionar após a função handleCompensarCheque:

  const adicionarTransacaoBancaria = (cheque: Cheque) => {
    // Verificar se já existe uma transação para este cheque
    const transacoesArmazenadas = localStorage.getItem("transacoesBancarias")
    if (transacoesArmazenadas) {
      try {
        const transacoesParsed = JSON.parse(transacoesArmazenadas)

        // Verificar se já existe uma transação para este cheque
        const transacaoExistente = transacoesParsed.find((t: any) => t.chequeId === cheque.id)
        if (transacaoExistente) {
          return // Não adicionar duplicada
        }

        // Adicionar nova transação
        const novaTransacao = {
          id: `cheque-${cheque.id}`,
          data: cheque.dataCompensacao || new Date(),
          descricao: `Cheque nº ${cheque.numero} - ${cheque.beneficiario}`,
          valor: cheque.valor,
          tipo: "debito",
          reconciliado: Boolean(cheque.pagamentoId),
          pagamentoId: cheque.pagamentoId,
          chequeId: cheque.id,
          chequeNumero: cheque.numero,
          metodo: "cheque",
        }

        const transacoesAtualizadas = [...transacoesParsed, novaTransacao]
        localStorage.setItem("transacoesBancarias", JSON.stringify(transacoesAtualizadas))
      } catch (error) {
        console.error("Erro ao processar transações bancárias:", error)

        // Se houver erro, criar nova lista
        const novaTransacao = [
          {
            id: `cheque-${cheque.id}`,
            data: cheque.dataCompensacao || new Date(),
            descricao: `Cheque nº ${cheque.numero} - ${cheque.beneficiario}`,
            valor: cheque.valor,
            tipo: "debito",
            reconciliado: Boolean(cheque.pagamentoId),
            pagamentoId: cheque.pagamentoId,
            chequeId: cheque.id,
            chequeNumero: cheque.numero,
            metodo: "cheque",
          },
        ]
        localStorage.setItem("transacoesBancarias", JSON.stringify(novaTransacao))
      }
    } else {
      // Não existe lista de transações, criar nova
      const novaTransacao = [
        {
          id: `cheque-${cheque.id}`,
          data: cheque.dataCompensacao || new Date(),
          descricao: `Cheque nº ${cheque.numero} - ${cheque.beneficiario}`,
          valor: cheque.valor,
          tipo: "debito",
          reconciliado: Boolean(cheque.pagamentoId),
          pagamentoId: cheque.pagamentoId,
          chequeId: cheque.id,
          chequeNumero: cheque.numero,
          metodo: "cheque",
        },
      ]
      localStorage.setItem("transacoesBancarias", JSON.stringify(novaTransacao))
    }
  }

  // Modificar a função handleDeleteCheque para salvar no localStorage
  // Substitua a função handleDeleteCheque existente com esta versão:

  const handleDeleteCheque = (id: string) => {
    const chequesAtualizados = cheques.filter((cheque) => cheque.id !== id)
    setCheques(chequesAtualizados)

    // Salvar no localStorage
    localStorage.setItem("cheques", JSON.stringify(chequesAtualizados))

    toast({
      title: "Cheque eliminado",
      description: "O cheque foi removido com sucesso.",
    })
  }

  return (
    <PrintLayout title="Controlo de Cheques">
      <Card>
        <CardHeader className="bg-red-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Controlo de Cheques</CardTitle>
              <CardDescription>Gerencie os cheques emitidos e pendentes</CardDescription>
            </div>
            <div className="space-x-2">
              <Button onClick={handlePrint} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleExportPDF} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button onClick={handleExportExcel} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>Adicionar Novo Cheque</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Cheque</DialogTitle>
                  <DialogDescription>Preencha os detalhes do novo cheque</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pagamento" className="text-right">
                      Pagamento (opcional)
                    </Label>
                    <Select value={pagamentoSelecionadoId} onValueChange={(value) => setPagamentoSelecionadoId(value)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecionar pagamento (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum pagamento</SelectItem>
                        {pagamentosPendentes.map((pagamento) => (
                          <SelectItem key={pagamento.id} value={pagamento.id}>
                            {pagamento.referencia} - {pagamento.fornecedorNome} - {pagamento.valor.toFixed(2)} MT
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="numero" className="text-right">
                      Número
                    </Label>
                    <Input
                      id="numero"
                      value={newCheque.numero || ""}
                      onChange={(e) => setNewCheque({ ...newCheque, numero: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="valor" className="text-right">
                      Valor
                    </Label>
                    <Input
                      id="valor"
                      type="number"
                      value={newCheque.valor || ""}
                      onChange={(e) => setNewCheque({ ...newCheque, valor: Number(e.target.value) })}
                      className="col-span-3"
                      placeholder={
                        pagamentoSelecionadoId
                          ? `${pagamentosPendentes.find((p) => p.id === pagamentoSelecionadoId)?.valor.toFixed(2) || ""} MT`
                          : ""
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="beneficiario" className="text-right">
                      Beneficiário
                    </Label>
                    <Input
                      id="beneficiario"
                      value={newCheque.beneficiario || ""}
                      onChange={(e) => setNewCheque({ ...newCheque, beneficiario: e.target.value })}
                      className="col-span-3"
                      placeholder={
                        pagamentoSelecionadoId
                          ? pagamentosPendentes.find((p) => p.id === pagamentoSelecionadoId)?.fornecedorNome || ""
                          : ""
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dataEmissao" className="text-right">
                      Data de Emissão
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="col-span-3 justify-start text-left font-normal">
                          {newCheque.dataEmissao ? (
                            format(newCheque.dataEmissao, "dd/MM/yyyy", { locale: pt })
                          ) : (
                            <span>Selecionar data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newCheque.dataEmissao}
                          onSelect={(date) => setNewCheque({ ...newCheque, dataEmissao: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddCheque}>Adicionar Cheque</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-red-600">
                <TableHead className="font-semibold text-white">Número</TableHead>
                <TableHead className="font-semibold text-white">Valor</TableHead>
                <TableHead className="font-semibold text-white">Beneficiário</TableHead>
                <TableHead className="font-semibold text-white">Data de Emissão</TableHead>
                <TableHead className="font-semibold text-white">Data de Compensação</TableHead>
                <TableHead className="font-semibold text-white">Estado</TableHead>
                <TableHead className="font-semibold text-white">Pagamento</TableHead>
                <TableHead className="font-semibold text-white">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cheques.map((cheque, index) => (
                <TableRow key={cheque.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell>{cheque.numero}</TableCell>
                  <TableCell>{cheque.valor.toFixed(2)} MT</TableCell>
                  <TableCell>{cheque.beneficiario}</TableCell>
                  <TableCell>{format(cheque.dataEmissao, "dd/MM/yyyy", { locale: pt })}</TableCell>
                  <TableCell>
                    {cheque.dataCompensacao ? format(cheque.dataCompensacao, "dd/MM/yyyy", { locale: pt }) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        cheque.estado === "pendente"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : cheque.estado === "compensado"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {cheque.estado.charAt(0).toUpperCase() + cheque.estado.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cheque.pagamentoReferencia ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{cheque.pagamentoReferencia}</span>
                        {cheque.fornecedorNome && (
                          <span className="text-xs text-gray-500">{cheque.fornecedorNome}</span>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {cheque.estado === "pendente" && (
                      <Button
                        onClick={() => handleCompensarCheque(cheque.id)}
                        className="bg-green-500 text-white hover:bg-green-600"
                      >
                        Compensar
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCheque(cheque.id)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

