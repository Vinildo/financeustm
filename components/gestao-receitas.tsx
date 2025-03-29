"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useAppContext } from "@/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { format, isWithinInterval, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { pt } from "date-fns/locale"
import { Printer, Download, Plus, Edit, Trash2, Search, FileText, CheckCircle, AlertCircle, Clock } from "lucide-react"
import type { DateRange } from "react-day-picker"
import type { Receita } from "@/types/receita"

export function GestaoReceitas() {
  const { receitas, adicionarReceita, atualizarReceita, removerReceita, currentUser } = useAppContext()
  const hoje = new Date()

  // Estados para filtros
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>("mes")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(hoje),
    to: endOfMonth(hoje),
  })
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("todas")
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>("todos")
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("todos")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Estados para o formulário de receita
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [receitaAtual, setReceitaAtual] = useState<Receita | null>(null)
  const [formData, setFormData] = useState({
    id: "",
    descricao: "",
    valor: 0,
    dataRecebimento: "",
    dataPrevisao: format(hoje, "yyyy-MM-dd"),
    estado: "prevista",
    metodo: "transferência",
    categoria: "",
    observacoes: "",
    documentoFiscal: false,
    cliente: "",
    reconciliado: false,
  })

  // Calcular período com base na seleção
  const periodo = useMemo(() => {
    if (periodoSelecionado === "mes") {
      return {
        from: startOfMonth(hoje),
        to: endOfMonth(hoje),
      }
    } else if (periodoSelecionado === "trimestre") {
      return {
        from: subMonths(hoje, 3),
        to: hoje,
      }
    } else if (periodoSelecionado === "semestre") {
      return {
        from: subMonths(hoje, 6),
        to: hoje,
      }
    } else if (periodoSelecionado === "ano") {
      return {
        from: new Date(hoje.getFullYear(), 0, 1),
        to: new Date(hoje.getFullYear(), 11, 31),
      }
    } else {
      return dateRange
    }
  }, [periodoSelecionado, dateRange, hoje])

  // Obter listas de categorias e clientes únicos
  const categorias = useMemo(() => {
    const cats = new Set<string>()
    receitas.forEach((receita) => {
      if (receita.categoria) {
        cats.add(receita.categoria)
      }
    })
    return Array.from(cats)
  }, [receitas])

  const clientes = useMemo(() => {
    const clients = new Set<string>()
    receitas.forEach((receita) => {
      if (receita.cliente) {
        clients.add(receita.cliente)
      }
    })
    return Array.from(clients)
  }, [receitas])

  // Filtrar receitas com base nos critérios
  const receitasFiltradas = useMemo(() => {
    if (!periodo.from || !periodo.to) return []

    return receitas
      .filter((receita) => {
        const dataParaFiltro = receita.dataRecebimento || receita.dataPrevisao
        const isWithinPeriod = isWithinInterval(dataParaFiltro, {
          start: periodo.from!,
          end: periodo.to!,
        })
        const matchesCategoria = categoriaSelecionada === "todas" || receita.categoria === categoriaSelecionada
        const matchesEstado = estadoSelecionado === "todos" || receita.estado === estadoSelecionado
        const matchesCliente = clienteSelecionado === "todos" || receita.cliente === clienteSelecionado
        const matchesSearch =
          searchTerm === "" ||
          receita.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
          receita.cliente.toLowerCase().includes(searchTerm.toLowerCase())

        return isWithinPeriod && matchesCategoria && matchesEstado && matchesCliente && matchesSearch
      })
      .sort((a, b) => {
        const dataA = a.dataRecebimento || a.dataPrevisao
        const dataB = b.dataRecebimento || b.dataPrevisao
        return dataB.getTime() - dataA.getTime() // Ordenar por data, mais recente primeiro
      })
  }, [receitas, periodo, categoriaSelecionada, estadoSelecionado, clienteSelecionado, searchTerm])

  // Calcular totais
  const totais = useMemo(() => {
    const total = receitasFiltradas.reduce((acc, curr) => acc + curr.valor, 0)
    const totalRecebido = receitasFiltradas
      .filter((r) => r.estado === "recebida")
      .reduce((acc, curr) => acc + curr.valor, 0)
    const totalPrevisto = receitasFiltradas
      .filter((r) => r.estado === "prevista")
      .reduce((acc, curr) => acc + curr.valor, 0)
    const totalAtrasado = receitasFiltradas
      .filter((r) => r.estado === "atrasada")
      .reduce((acc, curr) => acc + curr.valor, 0)

    return { total, totalRecebido, totalPrevisto, totalAtrasado }
  }, [receitasFiltradas])

  // Função para exportar dados em CSV
  const exportarCSV = () => {
    // Cabeçalho do CSV
    let csv =
      "Descrição,Valor,Data Previsão,Data Recebimento,Estado,Método,Categoria,Cliente,Documento Fiscal,Reconciliado,Observações\n"

    // Adicionar receitas
    receitasFiltradas.forEach((receita) => {
      csv += `"${receita.descricao}",${receita.valor},"${format(receita.dataPrevisao, "dd/MM/yyyy")}","${
        receita.dataRecebimento ? format(receita.dataRecebimento, "dd/MM/yyyy") : ""
      }","${receita.estado}","${receita.metodo}","${receita.categoria}","${receita.cliente}","${
        receita.documentoFiscal ? "Sim" : "Não"
      }","${receita.reconciliado ? "Sim" : "Não"}","${receita.observacoes}"\n`
    })

    // Criar blob e link para download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `receitas-${format(hoje, "dd-MM-yyyy")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Função para imprimir o relatório
  const handlePrint = () => {
    window.print()
  }

  // Funções para o formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    if (type === "number") {
      setFormData({ ...formData, [name]: Number.parseFloat(value) || 0 })
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked })
  }

  const resetForm = () => {
    setFormData({
      id: "",
      descricao: "",
      valor: 0,
      dataRecebimento: "",
      dataPrevisao: format(hoje, "yyyy-MM-dd"),
      estado: "prevista",
      metodo: "transferência",
      categoria: "",
      observacoes: "",
      documentoFiscal: false,
      cliente: "",
      reconciliado: false,
    })
    setIsEditMode(false)
    setReceitaAtual(null)
  }

  const handleOpenDialog = (receita?: Receita) => {
    if (receita) {
      setIsEditMode(true)
      setReceitaAtual(receita)
      setFormData({
        id: receita.id,
        descricao: receita.descricao,
        valor: receita.valor,
        dataRecebimento: receita.dataRecebimento ? format(receita.dataRecebimento, "yyyy-MM-dd") : "",
        dataPrevisao: format(receita.dataPrevisao, "yyyy-MM-dd"),
        estado: receita.estado,
        metodo: receita.metodo,
        categoria: receita.categoria,
        observacoes: receita.observacoes,
        documentoFiscal: receita.documentoFiscal,
        cliente: receita.cliente,
        reconciliado: receita.reconciliado,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const novaReceita: Receita = {
      id: isEditMode ? formData.id : Date.now().toString(),
      descricao: formData.descricao,
      valor: formData.valor,
      dataRecebimento: formData.dataRecebimento ? new Date(formData.dataRecebimento) : null,
      dataPrevisao: new Date(formData.dataPrevisao),
      estado: formData.estado as "prevista" | "recebida" | "atrasada" | "cancelada",
      metodo: formData.metodo as "transferência" | "depósito" | "cheque" | "dinheiro" | "outro",
      categoria: formData.categoria,
      observacoes: formData.observacoes,
      documentoFiscal: formData.documentoFiscal,
      cliente: formData.cliente,
      reconciliado: formData.reconciliado,
    }

    if (isEditMode) {
      atualizarReceita(novaReceita)
    } else {
      adicionarReceita(novaReceita)
    }

    handleCloseDialog()
  }

  const handleDelete = (receitaId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta receita?")) {
      removerReceita(receitaId)
    }
  }

  // Verificar status das receitas e atualizar se necessário
  useMemo(() => {
    const receitasParaAtualizar: Receita[] = []

    receitas.forEach((receita) => {
      if (receita.estado === "prevista" && receita.dataPrevisao < hoje && !receita.dataRecebimento) {
        // Se a data prevista já passou e não foi recebida, marcar como atrasada
        receitasParaAtualizar.push({
          ...receita,
          estado: "atrasada",
        })
      } else if (receita.estado === "atrasada" && receita.dataRecebimento) {
        // Se estava atrasada mas foi recebida, atualizar para recebida
        receitasParaAtualizar.push({
          ...receita,
          estado: "recebida",
        })
      }
    })

    // Atualizar receitas com status alterado
    receitasParaAtualizar.forEach((receita) => {
      atualizarReceita(receita)
    })
  }, [receitas, hoje, atualizarReceita])

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full">
        <CardHeader className="bg-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Gestão de Receitas</CardTitle>
              <CardDescription>Controle e acompanhamento de receitas</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleOpenDialog()} className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Receita
              </Button>
              <Button onClick={handlePrint} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={exportarCSV} className="print:hidden bg-blue-600 text-white hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="periodo">Período</Label>
              <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                <SelectTrigger id="periodo" className="w-full">
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Mês Atual</SelectItem>
                  <SelectItem value="trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="semestre">Último Semestre</SelectItem>
                  <SelectItem value="ano">Ano Atual</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {periodoSelecionado === "personalizado" && (
                <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} className="mt-2" />
              )}
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
                <SelectTrigger id="categoria" className="w-full">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select value={estadoSelecionado} onValueChange={setEstadoSelecionado}>
                <SelectTrigger id="estado" className="w-full">
                  <SelectValue placeholder="Selecionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os estados</SelectItem>
                  <SelectItem value="prevista">Prevista</SelectItem>
                  <SelectItem value="recebida">Recebida</SelectItem>
                  <SelectItem value="atrasada">Atrasada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cliente">Cliente</Label>
              <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
                <SelectTrigger id="cliente" className="w-full">
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente} value={cliente}>
                      {cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <Label htmlFor="search">Pesquisar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Pesquisar por descrição ou cliente..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold">
                      {totais.total.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Recebido</p>
                    <p className="text-2xl font-bold text-green-600">
                      {totais.totalRecebido.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Previsto</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {totais.totalPrevisto.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Atrasado</p>
                    <p className="text-2xl font-bold text-red-600">
                      {totais.totalAtrasado.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Receitas */}
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead>Descrição</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data Prevista</TableHead>
                <TableHead>Data Recebimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receitasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    Nenhuma receita encontrada para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                receitasFiltradas.map((receita, index) => (
                  <TableRow key={receita.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell className="font-medium">{receita.descricao}</TableCell>
                    <TableCell>{receita.cliente}</TableCell>
                    <TableCell>{receita.categoria}</TableCell>
                    <TableCell>{format(receita.dataPrevisao, "dd/MM/yyyy", { locale: pt })}</TableCell>
                    <TableCell>
                      {receita.dataRecebimento ? format(receita.dataRecebimento, "dd/MM/yyyy", { locale: pt }) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {receita.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          receita.estado === "recebida"
                            ? "bg-green-100 text-green-800"
                            : receita.estado === "prevista"
                              ? "bg-blue-100 text-blue-800"
                              : receita.estado === "atrasada"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {receita.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(receita)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(receita.id)}
                          className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo para adicionar/editar receita */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Receita" : "Nova Receita"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Edite os detalhes da receita selecionada."
                : "Preencha os detalhes para adicionar uma nova receita."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    name="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    name="cliente"
                    value={formData.cliente}
                    onChange={handleInputChange}
                    required
                    list="clientes-list"
                  />
                  <datalist id="clientes-list">
                    {clientes.map((cliente) => (
                      <option key={cliente} value={cliente} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label htmlFor="dataPrevisao">Data Prevista</Label>
                  <Input
                    id="dataPrevisao"
                    name="dataPrevisao"
                    type="date"
                    value={formData.dataPrevisao}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dataRecebimento">Data de Recebimento</Label>
                  <Input
                    id="dataRecebimento"
                    name="dataRecebimento"
                    type="date"
                    value={formData.dataRecebimento}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={formData.estado} onValueChange={(value) => handleSelectChange("estado", value)}>
                    <SelectTrigger id="estado">
                      <SelectValue placeholder="Selecionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prevista">Prevista</SelectItem>
                      <SelectItem value="recebida">Recebida</SelectItem>
                      <SelectItem value="atrasada">Atrasada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="metodo">Método</Label>
                  <Select value={formData.metodo} onValueChange={(value) => handleSelectChange("metodo", value)}>
                    <SelectTrigger id="metodo">
                      <SelectValue placeholder="Selecionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferência">Transferência</SelectItem>
                      <SelectItem value="depósito">Depósito</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    required
                    list="categorias-list"
                  />
                  <datalist id="categorias-list">
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria} />
                    ))}
                  </datalist>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="documentoFiscal"
                    checked={formData.documentoFiscal}
                    onCheckedChange={(checked) => handleCheckboxChange("documentoFiscal", checked as boolean)}
                  />
                  <Label htmlFor="documentoFiscal">Documento Fiscal Emitido</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reconciliado"
                    checked={formData.reconciliado}
                    onCheckedChange={(checked) => handleCheckboxChange("reconciliado", checked as boolean)}
                  />
                  <Label htmlFor="reconciliado">Reconciliado</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">{isEditMode ? "Salvar Alterações" : "Adicionar Receita"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

