"use client"

import { TableCell } from "@/components/ui/table"

import { TableBody } from "@/components/ui/table"

import { TableHead } from "@/components/ui/table"

import { TableRow } from "@/components/ui/table"

import { TableHeader } from "@/components/ui/table"

import { Table } from "@/components/ui/table"

import { useState, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isBefore,
  isToday,
  addDays,
} from "date-fns"
import { pt } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { PrintLayout } from "@/components/print-layout"
import {
  Printer,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarIcon,
  AlertTriangle,
  Clock,
  FileText,
  Trash2,
  Edit,
} from "lucide-react"
import * as XLSX from "xlsx"
import { useAppContext } from "@/contexts/AppContext"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

// Tipos para eventos do calendário
type EventoCalendario = {
  id: string
  titulo: string
  data: Date
  tipo: "fiscal" | "pagamento" | "lembrete"
  descricao: string
  prioridade: "baixa" | "media" | "alta"
  concluido: boolean
  pagamentoId?: string
  fornecedorId?: string
  fornecedorNome?: string
  valor?: number
  recorrente?: boolean
  recorrenciaMeses?: number[]
}

export function CalendarioFiscal() {
  const { fornecedores, atualizarPagamento } = useAppContext()
  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [mesSelecionado, setMesSelecionado] = useState<Date>(new Date())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetalhesDialogOpen, setIsDetalhesDialogOpen] = useState(false)
  const [novoEvento, setNovoEvento] = useState<Partial<EventoCalendario>>({
    tipo: "fiscal",
    prioridade: "media",
    data: new Date(),
    recorrente: false,
    recorrenciaMeses: [],
  })
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoCalendario | null>(null)
  const [activeTab, setActiveTab] = useState("calendario")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroConcluido, setFiltroConcluido] = useState<string>("todos")

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const dadosSalvos = localStorage.getItem("eventosFiscais")
    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos, (key, value) => {
          if (key === "data") {
            return new Date(value)
          }
          return value
        })
        setEventos(dados)
      } catch (error) {
        console.error("Erro ao carregar eventos fiscais:", error)
        setEventos([])
      }
    }

    // Verificar se fornecedores existe antes de sincronizar
    if (fornecedores && Array.isArray(fornecedores)) {
      // Sincronizar com pagamentos
      sincronizarComPagamentos()
    }
  }, [fornecedores])

  // Adicionar esta função após o useEffect acima:

  // Função para sincronizar eventos com pagamentos
  const sincronizarComPagamentos = () => {
    // Check if fornecedores is defined before trying to map over it
    if (!fornecedores || !Array.isArray(fornecedores)) {
      return // Exit early if fornecedores is undefined or not an array
    }

    // Obter todos os pagamentos
    const pagamentosImportantes = fornecedores.flatMap((fornecedor) => {
      // Check if fornecedor and fornecedor.pagamentos exist
      if (!fornecedor || !fornecedor.pagamentos || !Array.isArray(fornecedor.pagamentos)) {
        return [] // Return empty array for this fornecedor if pagamentos is missing
      }

      return fornecedor.pagamentos.map((pagamento) => ({
        id: `pagamento-${pagamento.id}`,
        titulo: `Pagamento: ${pagamento.referencia}`,
        data: new Date(pagamento.dataVencimento),
        tipo: "pagamento" as const,
        descricao: `Pagamento para ${fornecedor.nome} no valor de ${pagamento.valor.toFixed(2)} MT`,
        prioridade: isBefore(new Date(pagamento.dataVencimento), new Date()) ? "alta" : "media",
        concluido: pagamento.estado === "pago",
        pagamentoId: pagamento.id,
        fornecedorId: fornecedor.id,
        fornecedorNome: fornecedor.nome,
        valor: pagamento.valor,
      }))
    })

    // Atualizar eventos existentes e adicionar novos
    setEventos((eventosAtuais) => {
      // Filtrar eventos que não são de pagamento
      const eventosNaoPagamento = eventosAtuais.filter((evento) => !evento.id.startsWith("pagamento-"))

      // Combinar com os pagamentos atualizados
      return [...eventosNaoPagamento, ...pagamentosImportantes]
    })
  }

  // Salvar eventos no localStorage sempre que houver mudanças
  useEffect(() => {
    // Filtrar eventos de pagamentos antes de salvar
    const eventosFiscais = eventos.filter((evento) => !evento.id.startsWith("pagamento-"))
    localStorage.setItem("eventosFiscais", JSON.stringify(eventosFiscais))
  }, [eventos])

  // Obter dias do mês atual
  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesSelecionado),
    end: endOfMonth(mesSelecionado),
  })

  // Obter eventos do mês atual
  const eventosDoMes = eventos.filter((evento) => {
    const dataEvento = new Date(evento.data)
    return (
      dataEvento.getMonth() === mesSelecionado.getMonth() && dataEvento.getFullYear() === mesSelecionado.getFullYear()
    )
  })

  // Adicionar novo evento
  const handleAddEvento = () => {
    if (!novoEvento.titulo || !novoEvento.data || !novoEvento.tipo || !novoEvento.prioridade) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const novoId = Date.now().toString()
    const eventoCompleto: EventoCalendario = {
      id: novoId,
      titulo: novoEvento.titulo!,
      data: novoEvento.data!,
      tipo: novoEvento.tipo as "fiscal" | "pagamento" | "lembrete",
      descricao: novoEvento.descricao || "",
      prioridade: novoEvento.prioridade as "baixa" | "media" | "alta",
      concluido: false,
      recorrente: novoEvento.recorrente || false,
      recorrenciaMeses: novoEvento.recorrenciaMeses || [],
    }

    // Se for recorrente, criar eventos para os meses selecionados
    if (eventoCompleto.recorrente && eventoCompleto.recorrenciaMeses && eventoCompleto.recorrenciaMeses.length > 0) {
      const eventosRecorrentes: EventoCalendario[] = []

      // Adicionar o evento original
      eventosRecorrentes.push(eventoCompleto)

      // Adicionar eventos recorrentes para os meses selecionados
      const anoAtual = new Date().getFullYear()
      eventoCompleto.recorrenciaMeses.forEach((mes) => {
        // Pular o mês atual (já adicionado acima)
        if (mes === eventoCompleto.data!.getMonth() + 1) return

        const dataRecorrente = new Date(anoAtual, mes - 1, eventoCompleto.data!.getDate())

        // Se a data já passou este ano, usar o próximo ano
        if (isBefore(dataRecorrente, new Date())) {
          dataRecorrente.setFullYear(anoAtual + 1)
        }

        eventosRecorrentes.push({
          ...eventoCompleto,
          id: `${novoId}-${mes}`,
          data: dataRecorrente,
        })
      })

      setEventos((prev) => [...prev, ...eventosRecorrentes])
    } else {
      setEventos((prev) => [...prev, eventoCompleto])
    }

    setIsAddDialogOpen(false)
    setNovoEvento({
      tipo: "fiscal",
      prioridade: "media",
      data: new Date(),
      recorrente: false,
      recorrenciaMeses: [],
    })

    toast({
      title: "Evento adicionado",
      description: "O novo evento foi adicionado com sucesso.",
    })
  }

  // Editar evento
  const handleEditEvento = () => {
    if (!eventoSelecionado) return

    setEventos((prev) => prev.map((evento) => (evento.id === eventoSelecionado.id ? eventoSelecionado : evento)))

    setIsEditDialogOpen(false)
    setEventoSelecionado(null)

    toast({
      title: "Evento atualizado",
      description: "O evento foi atualizado com sucesso.",
    })
  }

  // Excluir evento
  const handleDeleteEvento = (id: string) => {
    setEventos((prev) => prev.filter((evento) => evento.id !== id))

    toast({
      title: "Evento excluído",
      description: "O evento foi excluído com sucesso.",
    })
  }

  // Adicionar função para atualizar pagamento quando evento for marcado como concluído
  // Modifique a função handleToggleConcluido:

  const handleToggleConcluido = (id: string) => {
    const evento = eventos.find((e) => e.id === id)
    if (!evento) return

    // Verificar se é um evento de pagamento
    if (evento.pagamentoId) {
      // Atualizar o pagamento correspondente
      atualizarPagamentoDoEvento(evento.pagamentoId, evento.fornecedorId!, !evento.concluido)
    }

    setEventos((prev) =>
      prev.map((evento) => (evento.id === id ? { ...evento, concluido: !evento.concluido } : evento)),
    )

    toast({
      title: "Status atualizado",
      description: "O status do evento foi atualizado.",
    })
  }

  // Adicionar esta nova função após handleToggleConcluido:

  // Função para atualizar pagamento quando evento for marcado como concluído
  const atualizarPagamentoDoEvento = (pagamentoId: string, fornecedorId: string, concluido: boolean) => {
    // Encontrar o fornecedor e o pagamento
    const fornecedor = fornecedores.find((f) => f.id === fornecedorId)
    if (!fornecedor) return

    const pagamento = fornecedor.pagamentos.find((p) => p.id === pagamentoId)
    if (!pagamento) return

    // Atualizar o estado do pagamento
    const pagamentoAtualizado = {
      ...pagamento,
      estado: concluido ? "pago" : "pendente",
      dataPagamento: concluido ? new Date() : null,
    }

    // Chamar a função de atualização do contexto
    atualizarPagamento(fornecedorId, pagamentoAtualizado)
  }

  // Navegar para o mês anterior
  const handleMesAnterior = () => {
    setMesSelecionado((mesAtual) => subMonths(mesAtual, 1))
  }

  // Navegar para o próximo mês
  const handleProximoMes = () => {
    setMesSelecionado((mesAtual) => addMonths(mesAtual, 1))
  }

  // Exportar para Excel
  const handleExportExcel = () => {
    const dados = eventos.map((evento) => ({
      Título: evento.titulo,
      Data: format(new Date(evento.data), "dd/MM/yyyy", { locale: pt }),
      Tipo: evento.tipo === "fiscal" ? "Fiscal" : evento.tipo === "pagamento" ? "Pagamento" : "Lembrete",
      Descrição: evento.descricao,
      Prioridade: evento.prioridade === "baixa" ? "Baixa" : evento.tipo === "media" ? "Média" : "Alta",
      Status: evento.concluido ? "Concluído" : "Pendente",
      Fornecedor: evento.fornecedorNome || "",
      Valor: evento.valor ? `${evento.valor.toFixed(2)} MT` : "",
    }))

    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Calendário Fiscal")

    // Gerar arquivo Excel e iniciar download
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.download = "calendario-fiscal.xlsx"
    link.click()
    window.URL.revokeObjectURL(url)
  }

  // Imprimir
  const handlePrint = () => {
    window.print()
  }

  // Filtrar eventos para a lista
  const filtrarEventos = () => {
    return eventos.filter((evento) => {
      // Filtrar por tipo
      if (filtroTipo !== "todos" && evento.tipo !== filtroTipo) {
        return false
      }

      // Filtrar por status
      if (filtroConcluido === "concluidos" && !evento.concluido) {
        return false
      }
      if (filtroConcluido === "pendentes" && evento.concluido) {
        return false
      }

      return true
    })
  }

  // Obter cor de fundo com base no tipo e prioridade do evento
  const getEventoBackgroundColor = (evento: EventoCalendario) => {
    if (evento.concluido) {
      return "bg-gray-200"
    }

    if (evento.tipo === "fiscal") {
      return evento.prioridade === "alta"
        ? "bg-red-100 border-red-300"
        : evento.prioridade === "media"
          ? "bg-orange-100 border-orange-300"
          : "bg-blue-100 border-blue-300"
    } else if (evento.tipo === "pagamento") {
      return evento.prioridade === "alta" ? "bg-red-100 border-red-300" : "bg-green-100 border-green-300"
    } else {
      return "bg-purple-100 border-purple-300"
    }
  }

  // Obter ícone com base no tipo do evento
  const getEventoIcon = (evento: EventoCalendario) => {
    if (evento.tipo === "fiscal") {
      return <CalendarIcon className="h-4 w-4 mr-1" />
    } else if (evento.tipo === "pagamento") {
      return <FileText className="h-4 w-4 mr-1" />
    } else {
      return <Clock className="h-4 w-4 mr-1" />
    }
  }

  // Verificar se um dia tem eventos
  const getDiaEventos = (dia: Date) => {
    return eventos.filter((evento) => isSameDay(new Date(evento.data), dia))
  }

  // Verificar se um dia tem eventos importantes (alta prioridade)
  const temEventoImportante = (dia: Date) => {
    return eventos.some(
      (evento) => isSameDay(new Date(evento.data), dia) && evento.prioridade === "alta" && !evento.concluido,
    )
  }

  // Verificar se um dia tem eventos de pagamento
  const temEventoPagamento = (dia: Date) => {
    return eventos.some(
      (evento) => isSameDay(new Date(evento.data), dia) && evento.tipo === "pagamento" && !evento.concluido,
    )
  }

  // Verificar se um dia tem eventos fiscais
  const temEventoFiscal = (dia: Date) => {
    return eventos.some(
      (evento) => isSameDay(new Date(evento.data), dia) && evento.tipo === "fiscal" && !evento.concluido,
    )
  }

  // Verificar se um dia tem eventos de lembrete
  const temEventoLembrete = (dia: Date) => {
    return eventos.some(
      (evento) => isSameDay(new Date(evento.data), dia) && evento.tipo === "lembrete" && !evento.concluido,
    )
  }

  // Verificar se um dia tem eventos concluídos
  const temEventoConcluido = (dia: Date) => {
    return eventos.some((evento) => isSameDay(new Date(evento.data), dia) && evento.concluido)
  }

  // Obter classe para o dia com base nos eventos
  const getDiaClasses = (dia: Date) => {
    let classes = "h-24 border p-1 relative"

    if (isToday(dia)) {
      classes += " bg-blue-50 border-blue-300"
    }

    if (temEventoImportante(dia)) {
      classes += " border-red-500 border-2"
    } else if (temEventoPagamento(dia)) {
      classes += " border-green-500"
    } else if (temEventoFiscal(dia)) {
      classes += " border-blue-500"
    } else if (temEventoLembrete(dia)) {
      classes += " border-purple-500"
    }

    return classes
  }

  // Verificar se há eventos próximos (nos próximos 7 dias)
  const eventosProximos = eventos.filter((evento) => {
    const dataEvento = new Date(evento.data)
    const hoje = new Date()
    const em7Dias = addDays(hoje, 7)

    return !evento.concluido && isBefore(dataEvento, em7Dias) && !isBefore(dataEvento, hoje)
  })

  // Verificar se há eventos atrasados
  const eventosAtrasados = eventos.filter((evento) => {
    const dataEvento = new Date(evento.data)
    const hoje = new Date()

    return !evento.concluido && isBefore(dataEvento, hoje)
  })

  return (
    <PrintLayout title="Calendário Fiscal">
      <Card>
        <CardHeader className="bg-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Calendário Fiscal</CardTitle>
              <CardDescription>Gerencie eventos fiscais, pagamentos importantes e lembretes</CardDescription>
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
              <div className="flex items-center space-x-2">
                <Button onClick={handleMesAnterior}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold">{format(mesSelecionado, "MMMM yyyy", { locale: pt })}</span>
                <Button onClick={handleProximoMes}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Evento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Evento</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes do novo evento fiscal, pagamento ou lembrete
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="titulo" className="text-right">
                          Título
                        </Label>
                        <Input
                          id="titulo"
                          value={novoEvento.titulo || ""}
                          onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="data" className="text-right">
                          Data
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="col-span-3 justify-start text-left font-normal">
                              {novoEvento.data ? (
                                format(novoEvento.data, "dd/MM/yyyy", { locale: pt })
                              ) : (
                                <span>Selecionar data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={novoEvento.data}
                              onSelect={(date) => setNovoEvento({ ...novoEvento, data: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tipo" className="text-right">
                          Tipo
                        </Label>
                        <Select
                          value={novoEvento.tipo}
                          onValueChange={(value) => setNovoEvento({ ...novoEvento, tipo: value as any })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fiscal">Fiscal</SelectItem>
                            <SelectItem value="pagamento">Pagamento</SelectItem>
                            <SelectItem value="lembrete">Lembrete</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="prioridade" className="text-right">
                          Prioridade
                        </Label>
                        <Select
                          value={novoEvento.prioridade}
                          onValueChange={(value) => setNovoEvento({ ...novoEvento, prioridade: value as any })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecionar prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="media">Média</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="descricao" className="text-right">
                          Descrição
                        </Label>
                        <Textarea
                          id="descricao"
                          value={novoEvento.descricao || ""}
                          onChange={(e) => setNovoEvento({ ...novoEvento, descricao: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="recorrente" className="text-right">
                          Recorrente
                        </Label>
                        <div className="col-span-3 flex items-center space-x-2">
                          <Switch
                            id="recorrente"
                            checked={novoEvento.recorrente}
                            onCheckedChange={(checked) => setNovoEvento({ ...novoEvento, recorrente: checked })}
                          />
                          <Label htmlFor="recorrente">Este evento se repete</Label>
                        </div>
                      </div>
                      {novoEvento.recorrente && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="recorrenciaMeses" className="text-right">
                            Meses
                          </Label>
                          <div className="col-span-3 grid grid-cols-4 gap-2">
                            {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map(
                              (mes, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`mes-${index + 1}`}
                                    checked={novoEvento.recorrenciaMeses?.includes(index + 1)}
                                    onChange={(e) => {
                                      const meses = novoEvento.recorrenciaMeses || []
                                      if (e.target.checked) {
                                        setNovoEvento({
                                          ...novoEvento,
                                          recorrenciaMeses: [...meses, index + 1],
                                        })
                                      } else {
                                        setNovoEvento({
                                          ...novoEvento,
                                          recorrenciaMeses: meses.filter((m) => m !== index + 1),
                                        })
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                  <Label htmlFor={`mes-${index + 1}`} className="text-sm">
                                    {mes}
                                  </Label>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddEvento}>Adicionar Evento</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calendario">Calendário</TabsTrigger>
                <TabsTrigger value="lista">Lista de Eventos</TabsTrigger>
              </TabsList>

              <TabsContent value="calendario" className="pt-4">
                {/* Alertas para eventos próximos e atrasados */}
                {eventosAtrasados.length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-md">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <h3 className="font-medium text-red-800">Eventos Atrasados</h3>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {eventosAtrasados.slice(0, 3).map((evento) => (
                        <li key={evento.id} className="text-sm text-red-700">
                          {evento.titulo} - {format(new Date(evento.data), "dd/MM/yyyy", { locale: pt })}
                        </li>
                      ))}
                      {eventosAtrasados.length > 3 && (
                        <li className="text-sm text-red-700">
                          E mais {eventosAtrasados.length - 3} evento(s) atrasado(s)...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {eventosProximos.length > 0 && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                      <h3 className="font-medium text-yellow-800">Eventos Próximos (7 dias)</h3>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {eventosProximos.slice(0, 3).map((evento) => (
                        <li key={evento.id} className="text-sm text-yellow-700">
                          {evento.titulo} - {format(new Date(evento.data), "dd/MM/yyyy", { locale: pt })}
                        </li>
                      ))}
                      {eventosProximos.length > 3 && (
                        <li className="text-sm text-yellow-700">
                          E mais {eventosProximos.length - 3} evento(s) próximo(s)...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Legenda */}
                <div className="mb-4 flex flex-wrap gap-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 mr-2"></div>
                    <span className="text-sm">Alta Prioridade</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 mr-2"></div>
                    <span className="text-sm">Pagamento</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-300 mr-2"></div>
                    <span className="text-sm">Fiscal</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-100 border border-purple-300 mr-2"></div>
                    <span className="text-sm">Lembrete</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 mr-2"></div>
                    <span className="text-sm">Concluído</span>
                  </div>
                </div>

                {/* Calendário */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Cabeçalho dos dias da semana */}
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                    <div key={dia} className="text-center font-medium py-2 bg-gray-100">
                      {dia}
                    </div>
                  ))}

                  {/* Dias do mês */}
                  {diasDoMes.map((dia) => (
                    <div key={dia.toISOString()} className={getDiaClasses(dia)}>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isToday(dia) ? "font-bold" : ""}`}>{format(dia, "d")}</span>
                        {getDiaEventos(dia).length > 0 && (
                          <span className="text-xs bg-gray-200 rounded-full px-1">{getDiaEventos(dia).length}</span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1 max-h-16 overflow-y-auto">
                        {getDiaEventos(dia)
                          .slice(0, 2)
                          .map((evento) => (
                            <div
                              key={evento.id}
                              className={`text-xs p-1 rounded cursor-pointer ${getEventoBackgroundColor(evento)}`}
                              onClick={() => {
                                setEventoSelecionado(evento)
                                setIsDetalhesDialogOpen(true)
                              }}
                            >
                              <div className="flex items-center truncate">
                                {getEventoIcon(evento)}
                                <span className={evento.concluido ? "line-through" : ""}>{evento.titulo}</span>
                              </div>
                            </div>
                          ))}
                        {getDiaEventos(dia).length > 2 && (
                          <div className="text-xs text-center text-gray-500">+{getDiaEventos(dia).length - 2} mais</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="lista" className="pt-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                  <div className="flex space-x-2">
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os tipos</SelectItem>
                        <SelectItem value="fiscal">Fiscal</SelectItem>
                        <SelectItem value="pagamento">Pagamento</SelectItem>
                        <SelectItem value="lembrete">Lembrete</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filtroConcluido} onValueChange={setFiltroConcluido}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="pendentes">Pendentes</SelectItem>
                        <SelectItem value="concluidos">Concluídos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="font-semibold">Título</TableHead>
                        <TableHead className="font-semibold">Data</TableHead>
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold">Prioridade</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtrarEventos().length > 0 ? (
                        filtrarEventos()
                          .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                          .map((evento, index) => (
                            <TableRow key={evento.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  {getEventoIcon(evento)}
                                  <span className={evento.concluido ? "line-through" : ""}>{evento.titulo}</span>
                                </div>
                              </TableCell>
                              <TableCell>{format(new Date(evento.data), "dd/MM/yyyy", { locale: pt })}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    evento.tipo === "fiscal"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : evento.tipo === "pagamento"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-purple-50 text-purple-700 border-purple-200"
                                  }
                                >
                                  {evento.tipo === "fiscal"
                                    ? "Fiscal"
                                    : evento.tipo === "pagamento"
                                      ? "Pagamento"
                                      : "Lembrete"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    evento.prioridade === "alta"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : evento.prioridade === "media"
                                        ? "bg-orange-50 text-orange-700 border-orange-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                  }
                                >
                                  {evento.prioridade === "alta"
                                    ? "Alta"
                                    : evento.prioridade === "media"
                                      ? "Média"
                                      : "Baixa"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={evento.concluido}
                                    onChange={() => handleToggleConcluido(evento.id)}
                                    className="mr-2 rounded border-gray-300"
                                  />
                                  <span>{evento.concluido ? "Concluído" : "Pendente"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEventoSelecionado(evento)
                                      setIsDetalhesDialogOpen(true)
                                    }}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEventoSelecionado(evento)
                                      setIsEditDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteEvento(evento.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            Nenhum evento encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de detalhes do evento */}
      <Dialog open={isDetalhesDialogOpen} onOpenChange={setIsDetalhesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
            <DialogDescription>Informações detalhadas sobre o evento selecionado</DialogDescription>
          </DialogHeader>
          {eventoSelecionado && (
            <div className="py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Título:</p>
                    <p>{eventoSelecionado.titulo}</p>
                  </div>
                  <div>
                    <p className="font-medium">Data:</p>
                    <p>{format(new Date(eventoSelecionado.data), "dd/MM/yyyy", { locale: pt })}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Tipo:</p>
                    <p>
                      {eventoSelecionado.tipo === "fiscal"
                        ? "Fiscal"
                        : eventoSelecionado.tipo === "pagamento"
                          ? "Pagamento"
                          : "Lembrete"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Prioridade:</p>
                    <p>
                      {eventoSelecionado.prioridade === "alta"
                        ? "Alta"
                        : eventoSelecionado.prioridade === "media"
                          ? "Média"
                          : "Baixa"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="font-medium">Descrição:</p>
                  <p>{eventoSelecionado.descricao || "Sem descrição"}</p>
                </div>
                <div>
                  <p className="font-medium">Status:</p>
                  <div className="flex items-center mt-1">
                    <input
                      type="checkbox"
                      checked={eventoSelecionado.concluido}
                      onChange={() => {
                        handleToggleConcluido(eventoSelecionado.id)
                        setEventoSelecionado({
                          ...eventoSelecionado,
                          concluido: !eventoSelecionado.concluido,
                        })
                      }}
                      className="mr-2 rounded border-gray-300"
                    />
                    <span>{eventoSelecionado.concluido ? "Concluído" : "Pendente"}</span>
                  </div>
                </div>
                {eventoSelecionado.fornecedorNome && (
                  <div>
                    <p className="font-medium">Fornecedor:</p>
                    <p>{eventoSelecionado.fornecedorNome}</p>
                  </div>
                )}
                {eventoSelecionado.valor && (
                  <div>
                    <p className="font-medium">Valor:</p>
                    <p>{eventoSelecionado.valor.toFixed(2)} MT</p>
                  </div>
                )}
                {eventoSelecionado.recorrente && (
                  <div>
                    <p className="font-medium">Recorrência:</p>
                    <p>
                      {eventoSelecionado.recorrenciaMeses
                        ?.map((mes) => {
                          const nomesMeses = [
                            "Jan",
                            "Fev",
                            "Mar",
                            "Abr",
                            "Mai",
                            "Jun",
                            "Jul",
                            "Ago",
                            "Set",
                            "Out",
                            "Nov",
                            "Dez",
                          ]
                          return nomesMeses[mes - 1]
                        })
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEventoSelecionado(eventoSelecionado)
                setIsDetalhesDialogOpen(false)
                setIsEditDialogOpen(true)
              }}
            >
              Editar
            </Button>
            <Button onClick={() => setIsDetalhesDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de edição do evento */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>Atualize os detalhes do evento selecionado</DialogDescription>
          </DialogHeader>
          {eventoSelecionado && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-titulo" className="text-right">
                  Título
                </Label>
                <Input
                  id="edit-titulo"
                  value={eventoSelecionado.titulo}
                  onChange={(e) => setEventoSelecionado({ ...eventoSelecionado, titulo: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-data" className="text-right">
                  Data
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="col-span-3 justify-start text-left font-normal">
                      {format(new Date(eventoSelecionado.data), "dd/MM/yyyy", { locale: pt })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(eventoSelecionado.data)}
                      onSelect={(date) => setEventoSelecionado({ ...eventoSelecionado, data: date || new Date() })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tipo" className="text-right">
                  Tipo
                </Label>
                <Select
                  value={eventoSelecionado.tipo}
                  onChange={(value) => setEventoSelecionado({ ...eventoSelecionado, tipo: value as any })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fiscal">Fiscal</SelectItem>
                    <SelectItem value="pagamento">Pagamento</SelectItem>
                    <SelectItem value="lembrete">Lembrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-prioridade" className="text-right">
                  Prioridade
                </Label>
                <Select
                  value={eventoSelecionado.prioridade}
                  onValueChange={(value) => setEventoSelecionado({ ...eventoSelecionado, prioridade: value as any })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-descricao" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="edit-descricao"
                  value={eventoSelecionado.descricao}
                  onChange={(e) => setEventoSelecionado({ ...eventoSelecionado, descricao: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-concluido" className="text-right">
                  Status
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-concluido"
                    checked={eventoSelecionado.concluido}
                    onChange={(e) => setEventoSelecionado({ ...eventoSelecionado, concluido: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-concluido">Concluído</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditEvento}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrintLayout>
  )
}

