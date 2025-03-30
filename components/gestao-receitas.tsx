"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { pt } from "date-fns/locale"
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { TooltipProvider } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { PrintLayout } from "@/components/print-layout"
import { ChevronLeft, ChevronRight, Search, Plus, MoreHorizontal, Edit, Trash } from "lucide-react"
import "jspdf-autotable"
import { useAuth } from "@/hooks/use-auth"
import { useAppContext } from "@/contexts/AppContext"
import type { Receita } from "@/types/receita"
import { v4 as uuidv4 } from "uuid"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function GestaoReceitas() {
  const { user } = useAuth()
  const { receitas = [], addReceita, updateReceita, deleteReceita, hasPermission } = useAppContext() || {}

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [receitaSelecionada, setReceitaSelecionada] = useState<Receita | null>(null)
  const [newReceita, setNewReceita] = useState<Partial<Receita>>({})
  const [mesSelecionado, setMesSelecionado] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [receitasDoMes, setReceitasDoMes] = useState<Receita[]>([])
  const [filteredReceitas, setFilteredReceitas] = useState<Receita[]>([])

  useEffect(() => {
    if (!receitas || receitas.length === 0) {
      setReceitasDoMes([])
      setIsLoading(false)
      return
    }

    try {
      const filtered = receitas.filter((receita) => {
        const dataReceita = new Date(receita.data)
        return dataReceita >= startOfMonth(mesSelecionado) && dataReceita <= endOfMonth(mesSelecionado)
      })
      setReceitasDoMes(filtered)
      setIsLoading(false)
    } catch (error) {
      console.error("Error filtering receitas by month:", error)
      setReceitasDoMes([])
      setIsLoading(false)
    }
  }, [receitas, mesSelecionado])

  useEffect(() => {
    if (!receitasDoMes || receitasDoMes.length === 0) {
      setFilteredReceitas([])
      return
    }

    try {
      const filtered = receitasDoMes.filter(
        (receita) =>
          receita.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
          receita.cliente.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredReceitas(filtered)
    } catch (error) {
      console.error("Error filtering receitas by search term:", error)
      setFilteredReceitas([])
    }
  }, [receitasDoMes, searchTerm])

  const handleAddReceita = () => {
    if (!newReceita.referencia || !newReceita.valor || !newReceita.cliente) {
      toast({
        title: "Erro ao adicionar receita",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      // Garantir que temos uma data válida
      const dataReceita =
        newReceita.data instanceof Date
          ? newReceita.data
          : typeof newReceita.data === "string" && newReceita.data
            ? new Date(newReceita.data)
            : new Date()

      const receitaParaAdicionar = {
        ...newReceita,
        id: uuidv4(),
        data: dataReceita.toISOString(), // Garantir formato ISO para armazenamento
        estado: "pendente",
        historico: [
          {
            id: uuidv4(),
            timestamp: new Date(),
            username: user?.username || "sistema",
            action: "create",
            details: "Receita criada",
          },
        ],
      }

      // Verificar se addReceita existe antes de chamar
      if (!addReceita) {
        throw new Error("Serviço de adição de receitas não disponível")
      }

      addReceita(receitaParaAdicionar as Receita)

      // Limpar o formulário
      setNewReceita({})
      setIsAddDialogOpen(false)

      toast({
        title: "Receita adicionada",
        description: "A receita foi adicionada com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao adicionar receita:", error)
      toast({
        title: "Erro ao adicionar receita",
        description: "Ocorreu um erro ao adicionar a receita. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditReceita = () => {
    if (!receitaSelecionada) {
      toast({
        title: "Erro ao editar receita",
        description: "Nenhuma receita selecionada para editar.",
        variant: "destructive",
      })
      return
    }

    if (!updateReceita) {
      toast({
        title: "Erro ao editar receita",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    try {
      updateReceita(receitaSelecionada.id, receitaSelecionada)
      setIsEditDialogOpen(false)
      setReceitaSelecionada(null)

      toast({
        title: "Receita atualizada",
        description: "A receita foi atualizada com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar receita:", error)
      toast({
        title: "Erro ao atualizar receita",
        description: "Ocorreu um erro ao atualizar a receita. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteReceita = (id: string) => {
    if (!deleteReceita) {
      toast({
        title: "Erro ao eliminar receita",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    deleteReceita(id)
    toast({
      title: "Receita eliminada",
      description: "A receita foi removida com sucesso.",
    })
  }

  const handleMesAnterior = () => {
    setMesSelecionado((mesAtual) => subMonths(mesAtual, 1))
  }

  const handleProximoMes = () => {
    setMesSelecionado((mesAtual) => addMonths(mesAtual, 1))
  }

  if (isLoading) {
    return (
      <PrintLayout title="Gestão de Receitas">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-gray-500">Carregando receitas...</p>
        </div>
      </PrintLayout>
    )
  }

  return (
    <PrintLayout title="Gestão de Receitas">
      <div className="space-y-4">
        <CardHeader className="bg-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestão de Receitas</CardTitle>
              <CardDescription>Gerencie as receitas do sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar receitas..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                <Button className="bg-gray-200 text-gray-800 hover:bg-gray-300 w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Receita
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="sticky top-0 bg-white z-10 pb-2">
                  <DialogTitle>Adicionar Nova Receita</DialogTitle>
                  <DialogDescription>Preencha os detalhes da receita a ser adicionada ao sistema.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="referencia">Referência</Label>
                      <Input
                        id="referencia"
                        value={newReceita.referencia || ""}
                        onChange={(e) => setNewReceita({ ...newReceita, referencia: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="valor">Valor (MT)</Label>
                      <Input
                        id="valor"
                        type="number"
                        min="0"
                        step="0.01"
                        value={isNaN(newReceita.valor as number) ? "" : (newReceita.valor as number)}
                        onChange={(e) =>
                          setNewReceita({
                            ...newReceita,
                            valor: e.target.value === "" ? 0 : Number.parseFloat(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="data">Data</Label>
                      <Input
                        id="data"
                        type="date"
                        value={
                          newReceita.data instanceof Date
                            ? newReceita.data.toISOString().split("T")[0]
                            : typeof newReceita.data === "string"
                              ? newReceita.data.includes("T")
                                ? newReceita.data.split("T")[0]
                                : newReceita.data
                              : ""
                        }
                        onChange={(e) => setNewReceita({ ...newReceita, data: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cliente">Cliente</Label>
                      <Input
                        id="cliente"
                        value={newReceita.cliente || ""}
                        onChange={(e) => setNewReceita({ ...newReceita, cliente: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={newReceita.observacoes || ""}
                      onChange={(e) => setNewReceita({ ...newReceita, observacoes: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter className="sticky bottom-0 bg-white pt-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddReceita}>Adicionar Receita</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="rounded-md border">
          {filteredReceitas.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Nenhuma receita encontrada para o período selecionado.</p>
            </div>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-600 text-white">
                    <TableHead className="font-semibold text-white">Referência</TableHead>
                    <TableHead className="font-semibold text-white">Cliente</TableHead>
                    <TableHead className="font-semibold text-white text-right">Valor</TableHead>
                    <TableHead className="font-semibold text-white">Data</TableHead>
                    <TableHead className="font-semibold text-white">Estado</TableHead>
                    <TableHead className="font-semibold text-white text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceitas.map((receita, index) => (
                    <TableRow key={receita.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell className="font-medium">{receita.referencia}</TableCell>
                      <TableCell>{receita.cliente}</TableCell>
                      <TableCell className="text-right">{receita.valor.toFixed(2)} MZN</TableCell>
                      <TableCell>{format(new Date(receita.data), "dd/MM/yyyy", { locale: pt })}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pendente
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setReceitaSelecionada(receita)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteReceita(receita.id)}>
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Editar Receita</DialogTitle>
              <DialogDescription>Atualize os detalhes da receita.</DialogDescription>
            </DialogHeader>
            {receitaSelecionada && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="edit-referencia">Referência</Label>
                    <Input
                      id="edit-referencia"
                      value={receitaSelecionada.referencia}
                      onChange={(e) => setReceitaSelecionada({ ...receitaSelecionada, referencia: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-valor">Valor (MT)</Label>
                    <Input
                      id="edit-valor"
                      type="number"
                      min="0"
                      step="0.01"
                      value={isNaN(receitaSelecionada.valor) ? "" : receitaSelecionada.valor}
                      onChange={(e) =>
                        setReceitaSelecionada({
                          ...receitaSelecionada,
                          valor: e.target.value === "" ? 0 : Number.parseFloat(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-data">Data</Label>
                    <Input
                      id="edit-data"
                      type="date"
                      value={
                        receitaSelecionada.data instanceof Date
                          ? receitaSelecionada.data.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => setReceitaSelecionada({ ...receitaSelecionada, data: new Date(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-cliente">Cliente</Label>
                    <Input
                      id="edit-cliente"
                      value={receitaSelecionada.cliente}
                      onChange={(e) => setReceitaSelecionada({ ...receitaSelecionada, cliente: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor="edit-observacoes">Observações</Label>
                  <Textarea
                    id="edit-observacoes"
                    value={receitaSelecionada.observacoes}
                    onChange={(e) => setReceitaSelecionada({ ...receitaSelecionada, observacoes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="sticky bottom-0 bg-white pt-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditReceita}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PrintLayout>
  )
}

