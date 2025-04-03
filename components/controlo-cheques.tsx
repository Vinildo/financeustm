"use client"

import { Calendar } from "@/components/ui/calendar"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Check, FileSpreadsheet, Filter, Plus, Printer, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { PrintLayout } from "@/components/print-layout"
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Cheque {
  id: string
  numero: string
  valor: number
  beneficiario: string
  dataEmissao: Date
  dataCompensacao: Date | null
  estado: "pendente" | "emitido" | "compensado" | "cancelado"
  pagamentoId?: string
  pagamentoReferencia?: string
  fornecedorNome?: string
  banco?: string
}

export function ControloCheques() {
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [filteredCheques, setFilteredCheques] = useState<Cheque[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCompensarDialogOpen, setIsCompensarDialogOpen] = useState(false)
  const [chequeSelecionado, setChequeSelecionado] = useState<Cheque | null>(null)
  const [dataCompensacao, setDataCompensacao] = useState<Date | undefined>(new Date())
  const [novoCheque, setNovoCheque] = useState<{
    numero: string
    valor: number
    beneficiario: string
    dataEmissao: Date | undefined
    banco: string
  }>({
    numero: "",
    valor: 0,
    beneficiario: "",
    dataEmissao: new Date(),
    banco: "BIM",
  })
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")

  // Carregar cheques do localStorage
  useEffect(() => {
    try {
      const chequesArmazenados = localStorage.getItem("cheques")
      if (chequesArmazenados) {
        const chequesParsed = JSON.parse(chequesArmazenados)
        // Garantir que todos os cheques tenham um valor válido
        const chequesValidados = chequesParsed.map((cheque: any) => ({
          ...cheque,
          valor: cheque.valor || 0, // Garantir que valor nunca seja undefined
          dataEmissao: cheque.dataEmissao ? new Date(cheque.dataEmissao) : new Date(),
          dataCompensacao: cheque.dataCompensacao ? new Date(cheque.dataCompensacao) : null,
          // Mapear estado "emitido" para "pendente" para compatibilidade
          estado: cheque.estado === "emitido" ? "pendente" : cheque.estado,
        }))
        setCheques(chequesValidados)
      }
    } catch (error) {
      console.error("Erro ao carregar cheques:", error)
      setCheques([])
    }
  }, [])

  // Filtrar cheques com base no termo de pesquisa e filtro de estado
  useEffect(() => {
    let filtered = [...cheques]

    // Aplicar filtro de estado
    if (filtroEstado !== "todos") {
      filtered = filtered.filter((cheque) => cheque.estado === filtroEstado)
    }

    // Aplicar termo de pesquisa
    if (searchTerm) {
      filtered = filtered.filter(
        (cheque) =>
          cheque.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cheque.beneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cheque.fornecedorNome && cheque.fornecedorNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (cheque.pagamentoReferencia && cheque.pagamentoReferencia.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (cheque.banco && cheque.banco.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    setFilteredCheques(filtered)
  }, [cheques, searchTerm, filtroEstado])

  // Adicionar um novo cheque
  const handleAddCheque = () => {
    if (!novoCheque.numero || !novoCheque.beneficiario || novoCheque.valor <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Garantir que o valor seja um número válido
    const valorCheque = isNaN(Number(novoCheque.valor)) ? 0 : Number(novoCheque.valor)

    const novoChequeObj = {
      id: `cheque-${Date.now()}`,
      numero: novoCheque.numero,
      valor: valorCheque, // Usar o valor validado
      beneficiario: novoCheque.beneficiario,
      dataEmissao: novoCheque.dataEmissao || new Date(),
      dataCompensacao: null,
      estado: "pendente" as const,
      banco: novoCheque.banco,
    }

    // Adicionar o novo cheque à lista
    const chequesAtualizados = [...cheques, novoChequeObj]
    setCheques(chequesAtualizados)

    // Salvar no localStorage
    localStorage.setItem("cheques", JSON.stringify(chequesAtualizados))

    // Limpar o formulário e fechar o diálogo
    setNovoCheque({
      numero: "",
      valor: 0,
      beneficiario: "",
      dataEmissao: new Date(),
      banco: "BIM",
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Cheque adicionado",
      description: `O cheque nº ${novoChequeObj.numero} foi adicionado com sucesso.`,
    })
  }

  // Compensar um cheque
  const handleCompensarCheque = () => {
    if (!chequeSelecionado || !dataCompensacao) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data de compensação válida.",
        variant: "destructive",
      })
      return
    }

    // Atualizar o cheque selecionado
    const chequesAtualizados = cheques.map((cheque) =>
      cheque.id === chequeSelecionado.id ? { ...cheque, estado: "compensado" as const, dataCompensacao } : cheque,
    )
    setCheques(chequesAtualizados)

    // Salvar no localStorage
    localStorage.setItem("cheques", JSON.stringify(chequesAtualizados))

    // Fechar o diálogo
    setIsCompensarDialogOpen(false)
    setChequeSelecionado(null)

    toast({
      title: "Cheque compensado",
      description: `O cheque nº ${chequeSelecionado.numero} foi marcado como compensado.`,
    })

    // Adicionar à reconciliação bancária
    adicionarTransacaoBancaria(chequeSelecionado, dataCompensacao)
  }

  // Adicionar transação bancária para o cheque compensado
  const adicionarTransacaoBancaria = (cheque: Cheque, dataCompensacao: Date) => {
    // Carregar transações existentes
    const transacoesArmazenadas = localStorage.getItem("transacoesBancarias")
    let transacoes = []

    if (transacoesArmazenadas) {
      try {
        transacoes = JSON.parse(transacoesArmazenadas)
      } catch (error) {
        console.error("Erro ao carregar transações bancárias:", error)
        transacoes = []
      }
    }

    // Verificar se já existe uma transação para este cheque
    const transacaoExistente = transacoes.find((t: any) => t.chequeId === cheque.id)

    if (transacaoExistente) {
      // Atualizar a transação existente
      const transacoesAtualizadas = transacoes.map((t: any) =>
        t.chequeId === cheque.id
          ? {
              ...t,
              data: dataCompensacao,
              reconciliado: true,
            }
          : t,
      )
      localStorage.setItem("transacoesBancarias", JSON.stringify(transacoesAtualizadas))
    } else {
      // Criar uma nova transação
      const novaTransacao = {
        id: `cheque-${cheque.id}`,
        data: dataCompensacao,
        descricao: `Cheque nº ${cheque.numero} - ${cheque.beneficiario}`,
        valor: cheque.valor,
        tipo: "debito",
        reconciliado: true,
        chequeId: cheque.id,
        chequeNumero: cheque.numero,
        pagamentoId: cheque.pagamentoId,
        metodo: "cheque",
      }

      // Adicionar a nova transação
      transacoes.push(novaTransacao)
      localStorage.setItem("transacoesBancarias", JSON.stringify(transacoes))
    }
  }

  // Cancelar um cheque
  const handleCancelarCheque = (chequeId: string) => {
    // Atualizar o cheque selecionado
    const chequesAtualizados = cheques.map((cheque) =>
      cheque.id === chequeId ? { ...cheque, estado: "cancelado" as const } : cheque,
    )
    setCheques(chequesAtualizados)

    // Salvar no localStorage
    localStorage.setItem("cheques", JSON.stringify(chequesAtualizados))

    toast({
      title: "Cheque cancelado",
      description: `O cheque foi marcado como cancelado.`,
    })
  }

  // Exportar para Excel
  const handleExportExcel = () => {
    try {
      // Criar os dados para o CSV
      const headers = [
        "Número",
        "Beneficiário",
        "Valor (MZN)",
        "Banco",
        "Data de Emissão",
        "Data de Compensação",
        "Estado",
        "Referência de Pagamento",
        "Fornecedor",
      ]

      const rows = filteredCheques.map((cheque) => [
        cheque.numero,
        cheque.beneficiario,
        typeof cheque.valor === "number" ? cheque.valor.toFixed(2) : "0.00",
        cheque.banco || "Não especificado",
        format(new Date(cheque.dataEmissao), "dd/MM/yyyy", { locale: pt }),
        cheque.dataCompensacao
          ? format(new Date(cheque.dataCompensacao), "dd/MM/yyyy", { locale: pt })
          : "Não compensado",
        cheque.estado === "pendente" ? "Pendente" : cheque.estado === "compensado" ? "Compensado" : "Cancelado",
        cheque.pagamentoReferencia || "",
        cheque.fornecedorNome || "",
      ])

      // Criar o conteúdo CSV
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n")

      // Criar um Blob com o conteúdo CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)

      // Criar um link para download
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `controlo_cheques_${format(new Date(), "yyyyMMdd")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Excel exportado",
        description: "Os dados dos cheques foram exportados para CSV com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Imprimir relatório
  const handlePrint = () => {
    window.print()
  }

  // Calcular totais
  const totalPendente = filteredCheques
    .filter((cheque) => cheque.estado === "pendente")
    .reduce((acc, cheque) => acc + (Number(cheque.valor) || 0), 0)

  const totalCompensado = filteredCheques
    .filter((cheque) => cheque.estado === "compensado")
    .reduce((acc, cheque) => acc + (Number(cheque.valor) || 0), 0)

  // Obter badge de estado
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendente":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendente
          </Badge>
        )
      case "compensado":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Compensado
          </Badge>
        )
      case "cancelado":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  return (
    <PrintLayout title="Controlo de Cheques">
      <div className="space-y-4">
        <CardHeader className="bg-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Controlo de Cheques</CardTitle>
              <CardDescription>Gerencie os cheques emitidos</CardDescription>
            </div>
            <div className="space-x-2">
              <Button onClick={handlePrint} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar cheques..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os estados</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="compensado">Compensados</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cheque
              </Button>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Cheque</DialogTitle>
                  <DialogDescription>Preencha os detalhes do cheque a ser adicionado.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="numero" className="text-right">
                      Número
                    </Label>
                    <Input
                      id="numero"
                      value={novoCheque.numero}
                      onChange={(e) => setNovoCheque({ ...novoCheque, numero: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="valor" className="text-right">
                      Valor (MT)
                    </Label>
                    <Input
                      id="valor"
                      type="number"
                      min="0"
                      step="0.01"
                      value={isNaN(novoCheque.valor) ? "" : novoCheque.valor}
                      onChange={(e) =>
                        setNovoCheque({
                          ...novoCheque,
                          valor: e.target.value === "" ? 0 : Number(e.target.value),
                        })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="beneficiario" className="text-right">
                      Beneficiário
                    </Label>
                    <Input
                      id="beneficiario"
                      value={novoCheque.beneficiario}
                      onChange={(e) => setNovoCheque({ ...novoCheque, beneficiario: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="banco" className="text-right">
                      Banco
                    </Label>
                    <Input
                      id="banco"
                      value={novoCheque.banco}
                      onChange={(e) => setNovoCheque({ ...novoCheque, banco: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dataEmissao" className="text-right">
                      Data de Emissão
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="col-span-3 justify-start text-left font-normal">
                          {novoCheque.dataEmissao ? (
                            format(novoCheque.dataEmissao, "dd/MM/yyyy", { locale: pt })
                          ) : (
                            <span>Selecionar data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={novoCheque.dataEmissao}
                          onSelect={(date) => setNovoCheque({ ...novoCheque, dataEmissao: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddCheque} className="bg-red-600 hover:bg-red-700">
                    Adicionar Cheque
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportExcel} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Total de Cheques</h3>
            <p className="text-2xl font-bold">{filteredCheques.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Valor Pendente</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {typeof totalPendente === "number" ? totalPendente.toFixed(2) : "0.00"} MZN
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Valor Compensado</h3>
            <p className="text-2xl font-bold text-green-600">
              {typeof totalCompensado === "number" ? totalCompensado.toFixed(2) : "0.00"} MZN
            </p>
          </div>
        </div>

        <div className="rounded-md border">
          {filteredCheques.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Nenhum cheque encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-red-600 text-white">
                  <TableHead className="font-semibold text-white">Número</TableHead>
                  <TableHead className="font-semibold text-white">Beneficiário</TableHead>
                  <TableHead className="font-semibold text-white text-right">Valor</TableHead>
                  <TableHead className="font-semibold text-white">Banco</TableHead>
                  <TableHead className="font-semibold text-white">Data de Emissão</TableHead>
                  <TableHead className="font-semibold text-white">Data de Compensação</TableHead>
                  <TableHead className="font-semibold text-white">Estado</TableHead>
                  <TableHead className="font-semibold text-white">Referência</TableHead>
                  <TableHead className="font-semibold text-white text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCheques.map((cheque, index) => (
                  <TableRow key={cheque.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell className="font-medium">{cheque.numero}</TableCell>
                    <TableCell>{cheque.beneficiario}</TableCell>
                    <TableCell className="text-right">
                      {typeof cheque.valor === "number" ? cheque.valor.toFixed(2) : "0.00"} MZN
                    </TableCell>
                    <TableCell>{cheque.banco || "Não especificado"}</TableCell>
                    <TableCell>{format(new Date(cheque.dataEmissao), "dd/MM/yyyy", { locale: pt })}</TableCell>
                    <TableCell>
                      {cheque.dataCompensacao
                        ? format(new Date(cheque.dataCompensacao), "dd/MM/yyyy", { locale: pt })
                        : "-"}
                    </TableCell>
                    <TableCell>{getEstadoBadge(cheque.estado)}</TableCell>
                    <TableCell>
                      {cheque.pagamentoReferencia ? (
                        <div>
                          <p className="text-sm font-medium">{cheque.pagamentoReferencia}</p>
                          {cheque.fornecedorNome && <p className="text-xs text-gray-500">{cheque.fornecedorNome}</p>}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {cheque.estado === "pendente" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setChequeSelecionado(cheque)
                                setDataCompensacao(new Date())
                                setIsCompensarDialogOpen(true)
                              }}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Compensar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => handleCancelarCheque(cheque.id)}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Dialog open={isCompensarDialogOpen} onOpenChange={setIsCompensarDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Compensar Cheque</DialogTitle>
              <DialogDescription>
                Informe a data de compensação do cheque nº {chequeSelecionado?.numero}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dataCompensacao" className="text-right">
                  Data de Compensação
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="col-span-3 justify-start text-left font-normal">
                      {dataCompensacao ? (
                        format(dataCompensacao, "dd/MM/yyyy", { locale: pt })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dataCompensacao} onSelect={setDataCompensacao} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCompensarDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCompensarCheque} className="bg-red-600 hover:bg-red-700">
                Confirmar Compensação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PrintLayout>
  )
}

