"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { PrintLayout } from "@/components/print-layout"
import { Printer, FileDown, Search, Check, AlertTriangle, FileText } from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import * as XLSX from "xlsx"
import { useAppContext } from "@/contexts/AppContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Tipos para a reconciliação
type ReconciliacaoItem = {
  id: string
  tipo: "pagamento" | "fundo_maneio" | "cheque"
  referencia: string
  valor: number
  data: Date
  fornecedor: string
  estado: string
  reconciliado: boolean
  itemRelacionadoId?: string
  itemRelacionadoTipo?: string
}

export function ReconciliacaoInterna() {
  const { fornecedores } = useAppContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pagamentos_fundo")
  const [itensPagamentos, setItensPagamentos] = useState<ReconciliacaoItem[]>([])
  const [itensFundoManeio, setItensFundoManeio] = useState<ReconciliacaoItem[]>([])
  const [itensCheques, setItensCheques] = useState<ReconciliacaoItem[]>([])
  const [isReconciliarDialogOpen, setIsReconciliarDialogOpen] = useState(false)
  const [itemSelecionado, setItemSelecionado] = useState<ReconciliacaoItem | null>(null)
  const [itemParaReconciliar, setItemParaReconciliar] = useState<string>("")
  const [itensParaReconciliar, setItensParaReconciliar] = useState<ReconciliacaoItem[]>([])
  const [isDetalhesDialogOpen, setIsDetalhesDialogOpen] = useState(false)
  const [itemDetalhes, setItemDetalhes] = useState<ReconciliacaoItem | null>(null)

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [fornecedores])

  const carregarDados = () => {
    // Carregar pagamentos
    const pagamentos = fornecedores.flatMap((fornecedor) =>
      fornecedor.pagamentos.map((pagamento) => ({
        id: pagamento.id,
        tipo: "pagamento" as const,
        referencia: pagamento.referencia,
        valor: pagamento.valor,
        data: pagamento.dataPagamento || pagamento.dataVencimento,
        fornecedor: fornecedor.nome,
        estado: pagamento.estado,
        reconciliado: !!pagamento.fundoManeioId || !!pagamento.transacaoBancariaId,
        itemRelacionadoId: pagamento.fundoManeioId || pagamento.transacaoBancariaId,
        itemRelacionadoTipo:
          pagamento.metodo === "fundo de maneio"
            ? "fundo_maneio"
            : pagamento.metodo === "cheque"
              ? "cheque"
              : undefined,
      })),
    )
    setItensPagamentos(pagamentos)

    // Carregar movimentos do fundo de maneio
    const fundosManeioData = localStorage.getItem("fundosManeio")
    if (fundosManeioData) {
      try {
        const fundosManeio = JSON.parse(fundosManeioData, (key, value) => {
          if (key === "mes" || key === "data") {
            return new Date(value)
          }
          return value
        })

        const movimentos = fundosManeio.flatMap((fundo: any) =>
          fundo.movimentos
            .filter((movimento: any) => movimento.tipo === "saida")
            .map((movimento: any) => ({
              id: movimento.id,
              tipo: "fundo_maneio" as const,
              referencia: movimento.pagamentoReferencia || `Movimento ${movimento.id.substring(0, 8)}`,
              valor: movimento.valor,
              data: movimento.data,
              fornecedor: movimento.fornecedorNome || "Não especificado",
              estado: "processado",
              reconciliado: !!movimento.pagamentoId,
              itemRelacionadoId: movimento.pagamentoId,
              itemRelacionadoTipo: movimento.pagamentoId ? "pagamento" : undefined,
            })),
        )
        setItensFundoManeio(movimentos)
      } catch (error) {
        console.error("Erro ao carregar fundos de maneio:", error)
        setItensFundoManeio([])
      }
    }

    // Carregar cheques
    const chequesData = localStorage.getItem("cheques")
    if (chequesData) {
      try {
        const chequesParsed = JSON.parse(chequesData)
        const chequesFormatados = chequesParsed.map((cheque: any) => ({
          id: cheque.id,
          tipo: "cheque" as const,
          referencia: `Cheque ${cheque.numero}`,
          valor: cheque.valor,
          data: new Date(cheque.dataEmissao),
          fornecedor: cheque.beneficiario,
          estado: cheque.estado,
          reconciliado: !!cheque.pagamentoId,
          itemRelacionadoId: cheque.pagamentoId,
          itemRelacionadoTipo: cheque.pagamentoId ? "pagamento" : undefined,
        }))
        setItensCheques(chequesFormatados)
      } catch (error) {
        console.error("Erro ao carregar cheques:", error)
        setItensCheques([])
      }
    }
  }

  // Filtrar itens com base na pesquisa
  const filtrarItens = (itens: ReconciliacaoItem[]) => {
    return itens.filter(
      (item) =>
        item.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  // Obter itens para reconciliar com base no item selecionado
  const obterItensParaReconciliar = (item: ReconciliacaoItem) => {
    if (item.tipo === "pagamento") {
      // Se for um pagamento, pode ser reconciliado com fundo de maneio ou cheque
      if (item.estado === "pago" && item.metodo === "fundo de maneio") {
        return itensFundoManeio.filter((i) => !i.reconciliado || i.itemRelacionadoId === item.id)
      } else if (item.estado === "pago" && item.metodo === "cheque") {
        return itensCheques.filter((i) => !i.reconciliado || i.itemRelacionadoId === item.id)
      } else {
        return []
      }
    } else if (item.tipo === "fundo_maneio") {
      // Se for um movimento do fundo de maneio, pode ser reconciliado com pagamentos
      return itensPagamentos.filter(
        (i) =>
          i.estado === "pago" && i.metodo === "fundo de maneio" && (!i.reconciliado || i.itemRelacionadoId === item.id),
      )
    } else if (item.tipo === "cheque") {
      // Se for um cheque, pode ser reconciliado com pagamentos
      return itensPagamentos.filter(
        (i) => i.estado === "pago" && i.metodo === "cheque" && (!i.reconciliado || i.itemRelacionadoId === item.id),
      )
    }
    return []
  }

  // Abrir diálogo de reconciliação
  const abrirDialogoReconciliacao = (item: ReconciliacaoItem) => {
    setItemSelecionado(item)
    const itensDisponiveis = obterItensParaReconciliar(item)
    setItensParaReconciliar(itensDisponiveis)
    setItemParaReconciliar(item.itemRelacionadoId || "")
    setIsReconciliarDialogOpen(true)
  }

  // Reconciliar itens
  const reconciliarItens = () => {
    if (!itemSelecionado || !itemParaReconciliar) {
      toast({
        title: "Erro",
        description: "Selecione um item para reconciliar.",
        variant: "destructive",
      })
      return
    }

    // Encontrar o item relacionado
    const itemRelacionado = itensParaReconciliar.find((i) => i.id === itemParaReconciliar)
    if (!itemRelacionado) {
      toast({
        title: "Erro",
        description: "Item para reconciliação não encontrado.",
        variant: "destructive",
      })
      return
    }

    // Atualizar os dados com base no tipo de item
    if (itemSelecionado.tipo === "pagamento") {
      // Atualizar pagamento
      atualizarPagamento(itemSelecionado.id, itemRelacionado.id, itemRelacionado.tipo)
    } else if (itemSelecionado.tipo === "fundo_maneio") {
      // Atualizar movimento do fundo de maneio
      atualizarMovimentoFundoManeio(itemSelecionado.id, itemRelacionado.id)
    } else if (itemSelecionado.tipo === "cheque") {
      // Atualizar cheque
      atualizarCheque(itemSelecionado.id, itemRelacionado.id)
    }

    // Recarregar dados
    carregarDados()
    setIsReconciliarDialogOpen(false)

    toast({
      title: "Reconciliação realizada",
      description: "Os itens foram reconciliados com sucesso.",
    })
  }

  // Atualizar pagamento
  const atualizarPagamento = (pagamentoId: string, itemRelacionadoId: string, tipoRelacionado: string) => {
    const fornecedores = JSON.parse(localStorage.getItem("fornecedores") || "[]")

    for (const fornecedor of fornecedores) {
      const pagamentoIndex = fornecedor.pagamentos.findIndex((p: any) => p.id === pagamentoId)
      if (pagamentoIndex !== -1) {
        if (tipoRelacionado === "fundo_maneio") {
          fornecedor.pagamentos[pagamentoIndex].fundoManeioId = itemRelacionadoId
          fornecedor.pagamentos[pagamentoIndex].metodo = "fundo de maneio"
        } else if (tipoRelacionado === "cheque") {
          fornecedor.pagamentos[pagamentoIndex].transacaoBancariaId = itemRelacionadoId
          fornecedor.pagamentos[pagamentoIndex].metodo = "cheque"
        }
        fornecedor.pagamentos[pagamentoIndex].estado = "pago"
        fornecedor.pagamentos[pagamentoIndex].dataPagamento = new Date()
        break
      }
    }

    localStorage.setItem("fornecedores", JSON.stringify(fornecedores))
  }

  // Atualizar movimento do fundo de maneio
  const atualizarMovimentoFundoManeio = (movimentoId: string, pagamentoId: string) => {
    const fundosManeio = JSON.parse(localStorage.getItem("fundosManeio") || "[]", (key, value) => {
      if (key === "mes" || key === "data") {
        return new Date(value)
      }
      return value
    })

    // Encontrar o pagamento para obter informações
    let pagamentoInfo = null
    for (const fornecedor of JSON.parse(localStorage.getItem("fornecedores") || "[]")) {
      const pagamento = fornecedor.pagamentos.find((p: any) => p.id === pagamentoId)
      if (pagamento) {
        pagamentoInfo = {
          referencia: pagamento.referencia,
          fornecedorNome: fornecedor.nome,
        }
        break
      }
    }

    // Atualizar o movimento
    for (const fundo of fundosManeio) {
      const movimentoIndex = fundo.movimentos.findIndex((m: any) => m.id === movimentoId)
      if (movimentoIndex !== -1) {
        fundo.movimentos[movimentoIndex].pagamentoId = pagamentoId
        if (pagamentoInfo) {
          fundo.movimentos[movimentoIndex].pagamentoReferencia = pagamentoInfo.referencia
          fundo.movimentos[movimentoIndex].fornecedorNome = pagamentoInfo.fornecedorNome
        }
        break
      }
    }

    localStorage.setItem("fundosManeio", JSON.stringify(fundosManeio))
  }

  // Atualizar cheque
  const atualizarCheque = (chequeId: string, pagamentoId: string) => {
    const cheques = JSON.parse(localStorage.getItem("cheques") || "[]")

    // Encontrar o pagamento para obter informações
    let pagamentoInfo = null
    for (const fornecedor of JSON.parse(localStorage.getItem("fornecedores") || "[]")) {
      const pagamento = fornecedor.pagamentos.find((p: any) => p.id === pagamentoId)
      if (pagamento) {
        pagamentoInfo = {
          referencia: pagamento.referencia,
          fornecedorNome: fornecedor.nome,
        }
        break
      }
    }

    // Atualizar o cheque
    const chequeIndex = cheques.findIndex((c: any) => c.id === chequeId)
    if (chequeIndex !== -1) {
      cheques[chequeIndex].pagamentoId = pagamentoId
      if (pagamentoInfo) {
        cheques[chequeIndex].pagamentoReferencia = pagamentoInfo.referencia
        cheques[chequeIndex].beneficiario = pagamentoInfo.fornecedorNome
      }
    }

    localStorage.setItem("cheques", JSON.stringify(cheques))
  }

  // Remover reconciliação
  const removerReconciliacao = (item: ReconciliacaoItem) => {
    if (!item.itemRelacionadoId) return

    if (item.tipo === "pagamento") {
      // Remover referência no pagamento
      const fornecedores = JSON.parse(localStorage.getItem("fornecedores") || "[]")
      for (const fornecedor of fornecedores) {
        const pagamentoIndex = fornecedor.pagamentos.findIndex((p: any) => p.id === item.id)
        if (pagamentoIndex !== -1) {
          if (item.itemRelacionadoTipo === "fundo_maneio") {
            fornecedor.pagamentos[pagamentoIndex].fundoManeioId = undefined
          } else if (item.itemRelacionadoTipo === "cheque") {
            fornecedor.pagamentos[pagamentoIndex].transacaoBancariaId = undefined
          }
          break
        }
      }
      localStorage.setItem("fornecedores", JSON.stringify(fornecedores))

      // Remover referência no item relacionado
      if (item.itemRelacionadoTipo === "fundo_maneio") {
        const fundosManeio = JSON.parse(localStorage.getItem("fundosManeio") || "[]", (key, value) => {
          if (key === "mes" || key === "data") {
            return new Date(value)
          }
          return value
        })

        for (const fundo of fundosManeio) {
          const movimentoIndex = fundo.movimentos.findIndex((m: any) => m.id === item.itemRelacionadoId)
          if (movimentoIndex !== -1) {
            fundo.movimentos[movimentoIndex].pagamentoId = undefined
            fundo.movimentos[movimentoIndex].pagamentoReferencia = undefined
            break
          }
        }

        localStorage.setItem("fundosManeio", JSON.stringify(fundosManeio))
      } else if (item.itemRelacionadoTipo === "cheque") {
        const cheques = JSON.parse(localStorage.getItem("cheques") || "[]")
        const chequeIndex = cheques.findIndex((c: any) => c.id === item.itemRelacionadoId)
        if (chequeIndex !== -1) {
          cheques[chequeIndex].pagamentoId = undefined
          cheques[chequeIndex].pagamentoReferencia = undefined
        }
        localStorage.setItem("cheques", JSON.stringify(cheques))
      }
    } else if (item.tipo === "fundo_maneio") {
      // Remover referência no movimento do fundo de maneio
      const fundosManeio = JSON.parse(localStorage.getItem("fundosManeio") || "[]", (key, value) => {
        if (key === "mes" || key === "data") {
          return new Date(value)
        }
        return value
      })

      for (const fundo of fundosManeio) {
        const movimentoIndex = fundo.movimentos.findIndex((m: any) => m.id === item.id)
        if (movimentoIndex !== -1) {
          fundo.movimentos[movimentoIndex].pagamentoId = undefined
          fundo.movimentos[movimentoIndex].pagamentoReferencia = undefined
          break
        }
      }

      localStorage.setItem("fundosManeio", JSON.stringify(fundosManeio))

      // Remover referência no pagamento
      const fornecedores = JSON.parse(localStorage.getItem("fornecedores") || "[]")
      for (const fornecedor of fornecedores) {
        const pagamentoIndex = fornecedor.pagamentos.findIndex((p: any) => p.id === item.itemRelacionadoId)
        if (pagamentoIndex !== -1) {
          fornecedor.pagamentos[pagamentoIndex].fundoManeioId = undefined
          break
        }
      }
      localStorage.setItem("fornecedores", JSON.stringify(fornecedores))
    } else if (item.tipo === "cheque") {
      // Remover referência no cheque
      const cheques = JSON.parse(localStorage.getItem("cheques") || "[]")
      const chequeIndex = cheques.findIndex((c: any) => c.id === item.id)
      if (chequeIndex !== -1) {
        cheques[chequeIndex].pagamentoId = undefined
        cheques[chequeIndex].pagamentoReferencia = undefined
      }
      localStorage.setItem("cheques", JSON.stringify(cheques))

      // Remover referência no pagamento
      const fornecedores = JSON.parse(localStorage.getItem("fornecedores") || "[]")
      for (const fornecedor of fornecedores) {
        const pagamentoIndex = fornecedor.pagamentos.findIndex((p: any) => p.id === item.itemRelacionadoId)
        if (pagamentoIndex !== -1) {
          fornecedor.pagamentos[pagamentoIndex].transacaoBancariaId = undefined
          break
        }
      }
      localStorage.setItem("fornecedores", JSON.stringify(fornecedores))
    }

    // Recarregar dados
    carregarDados()

    toast({
      title: "Reconciliação removida",
      description: "A reconciliação foi removida com sucesso.",
    })
  }

  // Exportar para Excel
  const handleExportExcel = () => {
    let dados = []

    if (activeTab === "pagamentos_fundo") {
      dados = [
        ...itensPagamentos.map((item) => ({
          Tipo: "Pagamento",
          Referência: item.referencia,
          Valor: item.valor,
          Data: format(new Date(item.data), "dd/MM/yyyy", { locale: pt }),
          Fornecedor: item.fornecedor,
          Estado: item.estado,
          Reconciliado: item.reconciliado ? "Sim" : "Não",
          "Item Relacionado": item.itemRelacionadoId ? "Sim" : "Não",
        })),
        ...itensFundoManeio.map((item) => ({
          Tipo: "Fundo de Maneio",
          Referência: item.referencia,
          Valor: item.valor,
          Data: format(new Date(item.data), "dd/MM/yyyy", { locale: pt }),
          Fornecedor: item.fornecedor,
          Estado: item.estado,
          Reconciliado: item.reconciliado ? "Sim" : "Não",
          "Item Relacionado": item.itemRelacionadoId ? "Sim" : "Não",
        })),
      ]
    } else if (activeTab === "pagamentos_cheques") {
      dados = [
        ...itensPagamentos.map((item) => ({
          Tipo: "Pagamento",
          Referência: item.referencia,
          Valor: item.valor,
          Data: format(new Date(item.data), "dd/MM/yyyy", { locale: pt }),
          Fornecedor: item.fornecedor,
          Estado: item.estado,
          Reconciliado: item.reconciliado ? "Sim" : "Não",
          "Item Relacionado": item.itemRelacionadoId ? "Sim" : "Não",
        })),
        ...itensCheques.map((item) => ({
          Tipo: "Cheque",
          Referência: item.referencia,
          Valor: item.valor,
          Data: format(new Date(item.data), "dd/MM/yyyy", { locale: pt }),
          Fornecedor: item.fornecedor,
          Estado: item.estado,
          Reconciliado: item.reconciliado ? "Sim" : "Não",
          "Item Relacionado": item.itemRelacionadoId ? "Sim" : "Não",
        })),
      ]
    }

    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reconciliação")

    // Gerar arquivo Excel e iniciar download
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.download = "reconciliacao-interna.xlsx"
    link.click()
    window.URL.revokeObjectURL(url)
  }

  // Imprimir
  const handlePrint = () => {
    window.print()
  }

  // Mostrar detalhes do item
  const mostrarDetalhes = (item: ReconciliacaoItem) => {
    setItemDetalhes(item)
    setIsDetalhesDialogOpen(true)
  }

  // Renderizar tabela de reconciliação
  const renderTabela = (itens: ReconciliacaoItem[], tipoItem: string) => {
    const itensFiltrados = filtrarItens(itens)

    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-red-600">
            <TableHead className="font-semibold text-white">Referência</TableHead>
            <TableHead className="font-semibold text-white">Valor</TableHead>
            <TableHead className="font-semibold text-white">Data</TableHead>
            <TableHead className="font-semibold text-white">Fornecedor</TableHead>
            <TableHead className="font-semibold text-white">Estado</TableHead>
            <TableHead className="font-semibold text-white">Reconciliado</TableHead>
            <TableHead className="font-semibold text-white text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itensFiltrados.length > 0 ? (
            itensFiltrados.map((item, index) => (
              <TableRow key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <TableCell className="font-medium">{item.referencia}</TableCell>
                <TableCell>{item.valor.toFixed(2)} MT</TableCell>
                <TableCell>{format(new Date(item.data), "dd/MM/yyyy", { locale: pt })}</TableCell>
                <TableCell>{item.fornecedor}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      item.estado === "pendente"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : item.estado === "pago" || item.estado === "processado"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : item.estado === "atrasado"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                    }
                  >
                    {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.reconciliado ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Check className="mr-1 h-4 w-4" />
                      Sim
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <AlertTriangle className="mr-1 h-4 w-4" />
                      Não
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => mostrarDetalhes(item)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                    {item.reconciliado ? (
                      <Button variant="outline" size="sm" onClick={() => removerReconciliacao(item)}>
                        Remover Reconciliação
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => abrirDialogoReconciliacao(item)}>
                        Reconciliar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                Nenhum item encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    )
  }

  return (
    <PrintLayout title="Reconciliação Interna">
      <Card>
        <CardHeader className="bg-red-600 text-white">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Reconciliação Interna</CardTitle>
              <CardDescription>Reconcilie pagamentos com o fundo de maneio e controlo de cheques</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handlePrint} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleExportExcel} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={carregarDados} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                Atualizar Dados
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pagamentos_fundo">Pagamentos e Fundo de Maneio</TabsTrigger>
                <TabsTrigger value="pagamentos_cheques">Pagamentos e Cheques</TabsTrigger>
              </TabsList>

              <TabsContent value="pagamentos_fundo" className="pt-4">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Pagamentos</h3>
                  {renderTabela(
                    itensPagamentos.filter((item) => item.metodo === "fundo de maneio" || !item.reconciliado),
                    "pagamento",
                  )}

                  <h3 className="text-lg font-semibold mt-8">Fundo de Maneio</h3>
                  {renderTabela(itensFundoManeio, "fundo_maneio")}
                </div>
              </TabsContent>

              <TabsContent value="pagamentos_cheques" className="pt-4">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Pagamentos</h3>
                  {renderTabela(
                    itensPagamentos.filter((item) => item.metodo === "cheque" || !item.reconciliado),
                    "pagamento",
                  )}

                  <h3 className="text-lg font-semibold mt-8">Cheques</h3>
                  {renderTabela(itensCheques, "cheque")}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de reconciliação */}
      <Dialog open={isReconciliarDialogOpen} onOpenChange={setIsReconciliarDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reconciliar Item</DialogTitle>
            <DialogDescription>Selecione o item para reconciliar com {itemSelecionado?.referencia}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Item Selecionado</h3>
              {itemSelecionado && (
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">Tipo:</span>{" "}
                    {itemSelecionado.tipo === "pagamento"
                      ? "Pagamento"
                      : itemSelecionado.tipo === "fundo_maneio"
                        ? "Fundo de Maneio"
                        : "Cheque"}
                  </p>
                  <p>
                    <span className="font-medium">Referência:</span> {itemSelecionado.referencia}
                  </p>
                  <p>
                    <span className="font-medium">Valor:</span> {itemSelecionado.valor.toFixed(2)} MT
                  </p>
                  <p>
                    <span className="font-medium">Fornecedor:</span> {itemSelecionado.fornecedor}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="item-para-reconciliar" className="text-sm font-medium">
                Item para Reconciliar
              </Label>
              {itensParaReconciliar.length > 0 ? (
                <Select value={itemParaReconciliar} onValueChange={setItemParaReconciliar}>
                  <SelectTrigger id="item-para-reconciliar">
                    <SelectValue placeholder="Selecione um item" />
                  </SelectTrigger>
                  <SelectContent>
                    {itensParaReconciliar.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.referencia} - {item.valor.toFixed(2)} MT - {item.fornecedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center py-4 text-gray-500">Não há itens disponíveis para reconciliação.</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReconciliarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={reconciliarItens} disabled={itensParaReconciliar.length === 0}>
              Reconciliar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de detalhes */}
      <Dialog open={isDetalhesDialogOpen} onOpenChange={setIsDetalhesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Item</DialogTitle>
            <DialogDescription>Informações detalhadas sobre o item selecionado</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {itemDetalhes && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Tipo:</p>
                    <p>
                      {itemDetalhes.tipo === "pagamento"
                        ? "Pagamento"
                        : itemDetalhes.tipo === "fundo_maneio"
                          ? "Fundo de Maneio"
                          : "Cheque"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Referência:</p>
                    <p>{itemDetalhes.referencia}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Valor:</p>
                    <p>{itemDetalhes.valor.toFixed(2)} MT</p>
                  </div>
                  <div>
                    <p className="font-medium">Data:</p>
                    <p>{format(new Date(itemDetalhes.data), "dd/MM/yyyy", { locale: pt })}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Fornecedor:</p>
                    <p>{itemDetalhes.fornecedor}</p>
                  </div>
                  <div>
                    <p className="font-medium">Estado:</p>
                    <p>{itemDetalhes.estado}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium">Reconciliado:</p>
                  <p>{itemDetalhes.reconciliado ? "Sim" : "Não"}</p>
                </div>
                {itemDetalhes.reconciliado && itemDetalhes.itemRelacionadoId && (
                  <div>
                    <p className="font-medium">Item Relacionado:</p>
                    <p>{itemDetalhes.itemRelacionadoId}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDetalhesDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrintLayout>
  )
}

