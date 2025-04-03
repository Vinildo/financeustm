"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { PrintLayout } from "@/components/print-layout"
import { Printer, ChevronLeft, ChevronRight, Plus, Edit, Trash2, BarChart4, FileSpreadsheet } from "lucide-react"
import { format, startOfMonth, endOfMonth, addMonths, subMonths, getYear, getMonth } from "date-fns"
import * as XLSX from "xlsx"
import { useAppContext } from "@/contexts/AppContext"

// Tipos para orçamento
type ItemOrcamento = {
  id: string
  departamento: string
  valorPrevisto: number
  descricao: string
}

type Orcamento = {
  id: string
  ano: number
  mes: number
  itens: ItemOrcamento[]
}

export function PrevisaoOrcamento() {
  const { fornecedores } = useAppContext()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [mesSelecionado, setMesSelecionado] = useState<Date>(startOfMonth(new Date()))
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [novoItem, setNovoItem] = useState<Partial<ItemOrcamento>>({})
  const [itemEditando, setItemEditando] = useState<ItemOrcamento | null>(null)
  const [activeTab, setActiveTab] = useState("orcamento")

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const dadosSalvos = localStorage.getItem("orcamentos")
    if (dadosSalvos) {
      setOrcamentos(JSON.parse(dadosSalvos))
    }
  }, [])

  // Salvar dados no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem("orcamentos", JSON.stringify(orcamentos))
  }, [orcamentos])

  // Obter o orçamento do mês atual
  const orcamentoAtual = orcamentos.find(
    (o) => o.ano === getYear(mesSelecionado) && o.mes === getMonth(mesSelecionado) + 1,
  )

  // Obter todos os pagamentos do mês atual
  const pagamentosDoMes = fornecedores.flatMap((fornecedor) =>
    fornecedor.pagamentos.filter((pagamento) => {
      const dataPagamento = pagamento.dataPagamento
        ? new Date(pagamento.dataPagamento)
        : new Date(pagamento.dataVencimento)
      return (
        dataPagamento >= startOfMonth(mesSelecionado) &&
        dataPagamento <= endOfMonth(mesSelecionado) &&
        pagamento.tipo === "fatura"
      )
    }),
  )

  // Calcular valores realizados por departamento
  const valoresRealizados = pagamentosDoMes.reduce(
    (acc, pagamento) => {
      const departamento = pagamento.departamento
      if (!acc[departamento]) {
        acc[departamento] = 0
      }
      acc[departamento] += pagamento.valor
      return acc
    },
    {} as Record<string, number>,
  )

  // Preparar dados para o gráfico
  const dadosGrafico =
    orcamentoAtual?.itens.map((item) => ({
      departamento: item.departamento,
      previsto: item.valorPrevisto,
      realizado: valoresRealizados[item.departamento] || 0,
      percentual: valoresRealizados[item.departamento]
        ? Math.round((valoresRealizados[item.departamento] / item.valorPrevisto) * 100)
        : 0,
    })) || []

  // Calcular totais
  const totalPrevisto = orcamentoAtual?.itens.reduce((acc, item) => acc + item.valorPrevisto, 0) || 0
  const totalRealizado = Object.values(valoresRealizados).reduce((acc, valor) => acc + valor, 0)
  const percentualTotal = totalPrevisto > 0 ? Math.round((totalRealizado / totalPrevisto) * 100) : 0

  const handleMesAnterior = () => {
    setMesSelecionado((mesAtual) => subMonths(mesAtual, 1))
  }

  const handleProximoMes = () => {
    setMesSelecionado((mesAtual) => addMonths(mesAtual, 1))
  }

  const handleAddItem = () => {
    if (!novoItem.departamento || !novoItem.valorPrevisto) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const ano = getYear(mesSelecionado)
    const mes = getMonth(mesSelecionado) + 1

    // Verificar se já existe um orçamento para este mês
    const orcamentoExistente = orcamentos.find((o) => o.ano === ano && o.mes === mes)

    if (orcamentoExistente) {
      // Adicionar item ao orçamento existente
      const novosOrcamentos = orcamentos.map((o) => {
        if (o.id === orcamentoExistente!.id) {
          return {
            ...o,
            itens: [
              ...o.itens,
              {
                id: Date.now().toString(),
                departamento: novoItem.departamento!,
                valorPrevisto: novoItem.valorPrevisto!,
                descricao: novoItem.descricao || "",
              },
            ],
          }
        }
        return o
      })
      setOrcamentos(novosOrcamentos)
    } else {
      // Criar novo orçamento para este mês
      const novoOrcamento: Orcamento = {
        id: Date.now().toString(),
        ano,
        mes,
        itens: [
          {
            id: Date.now().toString(),
            departamento: novoItem.departamento!,
            valorPrevisto: novoItem.valorPrevisto!,
            descricao: novoItem.descricao || "",
          },
        ],
      }
      setOrcamentos([...orcamentos, novoOrcamento])
    }

    setNovoItem({})
    setIsAddDialogOpen(false)
    toast({
      title: "Item adicionado",
      description: "O item foi adicionado ao orçamento com sucesso.",
    })
  }

  const handleEditItem = () => {
    if (!itemEditando || !itemEditando.departamento || !itemEditando.valorPrevisto) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const novosOrcamentos = orcamentos.map((o) => {
      if (o.ano === getYear(mesSelecionado) && o.mes === getMonth(mesSelecionado) + 1) {
        return {
          ...o,
          itens: o.itens.map((item) => (item.id === itemEditando.id ? itemEditando : item)),
        }
      }
      return o
    })

    setOrcamentos(novosOrcamentos)
    setItemEditando(null)
    setIsEditDialogOpen(false)
    toast({
      title: "Item atualizado",
      description: "O item foi atualizado com sucesso.",
    })
  }

  const handleDeleteItem = (itemId: string) => {
    const novosOrcamentos = orcamentos.map((o) => {
      if (o.ano === getYear(mesSelecionado) && o.mes === getMonth(mesSelecionado) + 1) {
        return {
          ...o,
          itens: o.itens.filter((item) => item.id !== itemId),
        }
      }
      return o
    })

    // Remover orçamentos vazios
    const orcamentosFiltrados = novosOrcamentos.filter((o) => o.itens.length > 0)

    setOrcamentos(orcamentosFiltrados)
    toast({
      title: "Item removido",
      description: "O item foi removido do orçamento com sucesso.",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    if (!orcamentoAtual) {
      toast({
        title: "Erro",
        description: "Não há orçamento para exportar neste mês.",
        variant: "destructive",
      })
      return
    }

    const dadosExport = orcamentoAtual.itens.map((item) => ({
      Departamento: item.departamento,
      "Valor Previsto": item.valorPrevisto.toFixed(2),
      "Valor Realizado": (valoresRealizados[item.departamento] || 0).toFixed(2),
      "% Execução": valoresRealizados[item.departamento]
        ? Math.round((valoresRealizados[item.departamento] / item.valorPrevisto) * 100) + "%"
        : "0%",
      Descrição: item.descricao,
    }))

    // Adicionar linha de total
    dadosExport.push({
      Departamento: "TOTAL",
      "Valor Previsto": totalPrevisto.toFixed(2),
      "Valor Realizado": totalRealizado.toFixed(2),
      "% Execução": percentualTotal + "%",
      Descrição: "",
    })

    const ws = XLSX.utils.json_to_sheet(dadosExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Orçamento")

    // Gerar arquivo Excel e iniciar download
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.download = `orcamento-${format(mesSelecionado, "yyyy-MM")}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <PrintLayout title="Previsão e Orçamento">
      <Card className="w-full">
        <CardHeader className="bg-red-600 text-white">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Previsão e Orçamento</CardTitle>
              <CardDescription className="text-gray-100">
                Gerencie o orçamento mensal e acompanhe a execução
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handlePrint} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleExportExcel} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Navegação entre meses */}
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={handleMesAnterior}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Mês Anterior
            </Button>
            <h2 className="text-xl font-bold">{format(mesSelecionado, "MMMM yyyy")}</h2>
            <Button variant="outline" onClick={handleProximoMes}>
              Próximo Mês
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Tabs para alternar entre visualizações */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
              <TabsTrigger value="grafico">Gráfico de Execução</TabsTrigger>
            </TabsList>

            {/* Conteúdo da Tab Orçamento */}
            <TabsContent value="orcamento" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Itens do Orçamento</h3>
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>

              {orcamentoAtual && orcamentoAtual.itens.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Valor Previsto</TableHead>
                      <TableHead>Valor Realizado</TableHead>
                      <TableHead>% Execução</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orcamentoAtual.itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.departamento}</TableCell>
                        <TableCell>
                          {item.valorPrevisto.toLocaleString("pt-BR", { style: "currency", currency: "MZN" })}
                        </TableCell>
                        <TableCell>
                          {(valoresRealizados[item.departamento] || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "MZN",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={
                                valoresRealizados[item.departamento]
                                  ? Math.min(
                                      100,
                                      Math.round((valoresRealizados[item.departamento] / item.valorPrevisto) * 100),
                                    )
                                  : 0
                              }
                              className="h-2 w-[60px]"
                            />
                            <span>
                              {valoresRealizados[item.departamento]
                                ? Math.round((valoresRealizados[item.departamento] / item.valorPrevisto) * 100)
                                : 0}
                              %
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setItemEditando(item)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Linha de total */}
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell>TOTAL</TableCell>
                      <TableCell>
                        {totalPrevisto.toLocaleString("pt-BR", { style: "currency", currency: "MZN" })}
                      </TableCell>
                      <TableCell>
                        {totalRealizado.toLocaleString("pt-BR", { style: "currency", currency: "MZN" })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={percentualTotal} className="h-2 w-[60px]" />
                          <span>{percentualTotal}%</span>
                        </div>
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <BarChart4 className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum item no orçamento</h3>
                  <p className="text-gray-500 mb-4">
                    Adicione itens ao orçamento para começar a acompanhar a execução.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Item
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Conteúdo da Tab Gráfico */}
            <TabsContent value="grafico">
              {orcamentoAtual && orcamentoAtual.itens.length > 0 ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Execução do Orçamento por Departamento</h3>

                  <div className="space-y-4">
                    {dadosGrafico.map((item) => (
                      <div key={item.departamento} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.departamento}</span>
                          <span>{item.percentual}%</span>
                        </div>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block text-gray-600">
                                Realizado:{" "}
                                {item.realizado.toLocaleString("pt-BR", { style: "currency", currency: "MZN" })}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-gray-600">
                                Previsto:{" "}
                                {item.previsto.toLocaleString("pt-BR", { style: "currency", currency: "MZN" })}
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                            <div
                              style={{ width: `${Math.min(100, item.percentual)}%` }}
                              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                item.percentual > 100
                                  ? "bg-red-500"
                                  : item.percentual > 80
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="pt-4 border-t border-gray-200 mt-6">
                      <div className="flex justify-between">
                        <span className="font-bold">TOTAL</span>
                        <span className="font-bold">{percentualTotal}%</span>
                      </div>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block text-gray-600">
                              Realizado:{" "}
                              {totalRealizado.toLocaleString("pt-BR", { style: "currency", currency: "MZN" })}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-gray-600">
                              Previsto: {totalPrevisto.toLocaleString("pt-BR", { style: "currency", currency: "MZN" })}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-3 mb-4 text-xs flex rounded bg-gray-200">
                          <div
                            style={{ width: `${Math.min(100, percentualTotal)}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                              percentualTotal > 100
                                ? "bg-red-500"
                                : percentualTotal > 80
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <BarChart4 className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum dado para exibir</h3>
                  <p className="text-gray-500 mb-4">
                    Adicione itens ao orçamento para visualizar o gráfico de execução.
                  </p>
                  <Button
                    onClick={() => {
                      setActiveTab("orcamento")
                      setIsAddDialogOpen(true)
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item ao Orçamento
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Diálogo para adicionar item */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Item ao Orçamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departamento" className="text-right">
                Departamento
              </Label>
              <Input
                id="departamento"
                value={novoItem.departamento || ""}
                onChange={(e) => setNovoItem({ ...novoItem, departamento: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="valorPrevisto" className="text-right">
                Valor Previsto
              </Label>
              <Input
                id="valorPrevisto"
                type="number"
                value={novoItem.valorPrevisto || ""}
                onChange={(e) => setNovoItem({ ...novoItem, valorPrevisto: Number.parseFloat(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descricao" className="text-right">
                Descrição
              </Label>
              <Input
                id="descricao"
                value={novoItem.descricao || ""}
                onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddItem} className="bg-red-600 hover:bg-red-700">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar item */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Item do Orçamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-departamento" className="text-right">
                Departamento
              </Label>
              <Input
                id="edit-departamento"
                value={itemEditando?.departamento || ""}
                onChange={(e) =>
                  setItemEditando(itemEditando ? { ...itemEditando, departamento: e.target.value } : null)
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-valorPrevisto" className="text-right">
                Valor Previsto
              </Label>
              <Input
                id="edit-valorPrevisto"
                type="number"
                value={itemEditando?.valorPrevisto || ""}
                onChange={(e) =>
                  setItemEditando(
                    itemEditando ? { ...itemEditando, valorPrevisto: Number.parseFloat(e.target.value) } : null,
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-descricao" className="text-right">
                Descrição
              </Label>
              <Input
                id="edit-descricao"
                value={itemEditando?.descricao || ""}
                onChange={(e) => setItemEditando(itemEditando ? { ...itemEditando, descricao: e.target.value } : null)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditItem} className="bg-red-600 hover:bg-red-700">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrintLayout>
  )
}

