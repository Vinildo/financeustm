"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect, useRef } from "react"
import {
  Check,
  CreditCard,
  Download,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
  Printer,
  Bell,
  Edit,
  ChevronLeft,
  ChevronRight,
  History,
  Wallet,
  FileSpreadsheet,
  Clock,
  AlertCircle,
  X,
} from "lucide-react"
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { pt } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PrintLayout } from "@/components/print-layout"
import { useAppContext } from "@/contexts/AppContext"
import type { Pagamento } from "@/types/fornecedor"
import type { WorkflowStep } from "@/types/workflow"
import { DetalhesPagamento } from "@/components/detalhes-pagamento"
import { NotificarFornecedor } from "@/components/notificar-fornecedor"
import { useAuth } from "@/hooks/use-auth"
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentHistory } from "@/components/payment-history"
import { LembreteDocumentos } from "@/components/lembrete-documentos"
// Adicione estas importações no topo do arquivo
import { WorkflowApproval } from "@/components/workflow-approval"
import { v4 as uuidv4 } from "uuid"
import { Textarea } from "@/components/ui/textarea"
import type { Movimento } from "@/components/fundo-maneio"

export function PagamentosTable() {
  const { user } = useAuth()
  const {
    fornecedores = [],
    addFornecedor,
    updateFornecedor,
    deleteFornecedor,
    addPagamento,
    updatePagamento,
    deletePagamento,
    hasPermission,
    initializeWorkflow,
    workflowConfig,
  } = useAppContext() || {}

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isFundoManeioDialogOpen, setIsFundoManeioDialogOpen] = useState(false)
  // Adicione este estado no componente PagamentosTable
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false)
  const [pagamentoParaWorkflow, setPagamentoParaWorkflow] = useState<
    (Pagamento & { fornecedorNome: string; fornecedorId: string }) | null
  >(null)
  const [newPagamento, setNewPagamento] = useState<Partial<Pagamento>>({
    estado: "pendente",
    metodo: "transferência",
    tipo: "fatura",
  })
  const [fornecedorNome, setFornecedorNome] = useState("")
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<
    (Pagamento & { fornecedorNome: string; fornecedorId: string }) | null
  >(null)
  const [pagamentoParaNotificar, setPagamentoParaNotificar] = useState<(Pagamento & { fornecedorNome: string }) | null>(
    null,
  )
  const [mesSelecionado, setMesSelecionado] = useState<Date>(startOfMonth(new Date()))
  const [pagamentoParaDocumentos, setPagamentoParaDocumentos] = useState<
    (Pagamento & { fornecedorNome: string; fornecedorId: string }) | null
  >(null)
  const [pagamentoParaFundoManeio, setPagamentoParaFundoManeio] = useState<
    (Pagamento & { fornecedorNome: string; fornecedorId: string }) | null
  >(null)
  const [descricaoFundoManeio, setDescricaoFundoManeio] = useState("")

  const [isEmitirChequeDialogOpen, setIsEmitirChequeDialogOpen] = useState(false)
  const [pagamentoParaCheque, setPagamentoParaCheque] = useState<
    (Pagamento & { fornecedorNome: string; fornecedorId: string }) | null
  >(null)
  const [novoCheque, setNovoCheque] = useState<{ numero: string; dataEmissao: Date | undefined }>({
    numero: "",
    dataEmissao: new Date(),
  })

  const [fornecedorSelecionado, setFornecedorSelecionado] = useState("")
  const [novoPagamento, setNovoPagamento] = useState({
    referencia: "",
    valor: 0,
    dataVencimento: new Date(),
    metodo: "transferência",
    departamento: "",
    tipo: "fatura",
    descricao: "",
    observacoes: "",
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showWorkflowColumn, setShowWorkflowColumn] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [todosOsPagamentos, setTodosOsPagamentos] = useState<
    Array<Pagamento & { fornecedorId: string; fornecedorNome: string }>
  >([])
  const [pagamentosDoMes, setPagamentosDoMes] = useState<
    Array<Pagamento & { fornecedorId: string; fornecedorNome: string }>
  >([])
  const [filteredPagamentos, setFilteredPagamentos] = useState<
    Array<Pagamento & { fornecedorId: string; fornecedorNome: string }>
  >([])

  // Primeiro, vamos adicionar estados para controlar o redirecionamento após adicionar um pagamento
  // Adicione estes estados logo após os estados existentes (por volta da linha 100)

  const [redirectToChecks, setRedirectToChecks] = useState(false)
  const [redirectToFundoManeio, setRedirectToFundoManeio] = useState(false)
  const [novoPagamentoAdicionado, setNovoPagamentoAdicionado] = useState<{
    id: string
    fornecedorId: string
    fornecedorNome: string
    referencia: string
    valor: number
  } | null>(null)

  // Referência para a função adicionarMovimentoFundoManeio do componente FundoManeio
  const fundoManeioRef = useRef<{
    adicionarMovimentoFundoManeio: (movimento: Partial<Movimento>) => string | null
  } | null>(null)

  // Atualizar a referência quando o componente FundoManeio estiver disponível
  useEffect(() => {
    // @ts-ignore
    if (window.fundoManeio) {
      // @ts-ignore
      fundoManeioRef.current = window.fundoManeio
    }
  }, [])

  // Process payments when fornecedores changes
  useEffect(() => {
    if (!fornecedores || fornecedores.length === 0) {
      setTodosOsPagamentos([])
      setIsLoading(false)
      return
    }

    try {
      const allPayments = fornecedores.flatMap((fornecedor) =>
        (fornecedor.pagamentos || []).map((pagamento) => ({
          ...pagamento,
          fornecedorId: fornecedor.id,
          fornecedorNome: fornecedor.nome,
        })),
      )
      setTodosOsPagamentos(allPayments)
      setIsLoading(false)
    } catch (error) {
      console.error("Error processing payments:", error)
      setTodosOsPagamentos([])
      setIsLoading(false)
    }
  }, [fornecedores])

  // Filter payments by month
  useEffect(() => {
    if (!todosOsPagamentos || todosOsPagamentos.length === 0) {
      setPagamentosDoMes([])
      return
    }

    try {
      const filtered = todosOsPagamentos.filter((pagamento) => {
        const dataPagamento = pagamento.dataPagamento
          ? new Date(pagamento.dataPagamento)
          : new Date(pagamento.dataVencimento)
        return dataPagamento >= startOfMonth(mesSelecionado) && dataPagamento <= endOfMonth(mesSelecionado)
      })
      setPagamentosDoMes(filtered)
    } catch (error) {
      console.error("Error filtering payments by month:", error)
      setPagamentosDoMes([])
    }
  }, [todosOsPagamentos, mesSelecionado])

  // Filter payments by search term
  useEffect(() => {
    if (!pagamentosDoMes || pagamentosDoMes.length === 0) {
      setFilteredPagamentos([])
      return
    }

    try {
      const filtered = pagamentosDoMes.filter(
        (pagamento) =>
          pagamento.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pagamento.fornecedorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (pagamento.departamento && pagamento.departamento.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredPagamentos(filtered)
    } catch (error) {
      console.error("Error filtering payments by search term:", error)
      setFilteredPagamentos([])
    }
  }, [pagamentosDoMes, searchTerm])

  // Função para obter o status de aprovação de um pagamento
  const getWorkflowStatusBadge = (pagamento: any) => {
    if (!pagamento || !pagamento.workflow) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center">
          <Clock className="mr-1 h-3 w-3" /> Não iniciado
        </Badge>
      )
    }

    switch (pagamento.workflow.status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
            <Check className="mr-1 h-3 w-3" /> Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
            <X className="mr-1 h-3 w-3" /> Rejeitado
          </Badge>
        )
      case "in_progress":
        if (!pagamento.workflow.steps || !pagamento.workflow.steps[pagamento.workflow.currentStep]) {
          return (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center">
              <Clock className="mr-1 h-3 w-3" /> Em progresso
            </Badge>
          )
        }
        const currentStep = pagamento.workflow.steps[pagamento.workflow.currentStep]
        const approverRole = currentStep.role === "financial_director" ? "Diretora Financeira" : "Reitor"
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center">
            <Clock className="mr-1 h-3 w-3" /> Aguardando {approverRole}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center">
            <AlertCircle className="mr-1 h-3 w-3" /> Desconhecido
          </Badge>
        )
    }
  }

  // Função para obter detalhes do progresso de aprovação
  const getWorkflowProgress = (pagamento: any) => {
    if (!pagamento || !pagamento.workflow || !pagamento.workflow.steps) return null

    const totalSteps = pagamento.workflow.steps.length
    const completedSteps = pagamento.workflow.steps.filter((step: WorkflowStep) => step.status !== "pending").length
    const progress = `${completedSteps}/${totalSteps}`

    return (
      <div className="flex flex-col">
        <div className="flex items-center space-x-1">
          <span className="text-xs font-medium">{progress}</span>
          <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                pagamento.workflow.status === "approved"
                  ? "bg-green-500"
                  : pagamento.workflow.status === "rejected"
                    ? "bg-red-500"
                    : "bg-yellow-500"
              }`}
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  // Função para obter detalhes completos do workflow para tooltip
  const getWorkflowDetails = (pagamento: any) => {
    if (!pagamento || !pagamento.workflow || !pagamento.workflow.steps) return "Aprovação não iniciada"

    return (
      <div className="space-y-2 p-1">
        <p className="font-semibold text-sm">
          Status:{" "}
          {pagamento.workflow.status === "in_progress"
            ? "Em andamento"
            : pagamento.workflow.status === "approved"
              ? "Aprovado"
              : "Rejeitado"}
        </p>
        <div className="space-y-1.5">
          {pagamento.workflow.steps.map((step: WorkflowStep, index: number) => {
            const isCurrentStep = index === pagamento.workflow.currentStep
            const roleName = step.role === "financial_director" ? "Diretora Financeira" : "Reitor"

            return (
              <div key={step.id} className={`text-xs ${isCurrentStep ? "font-medium" : ""}`}>
                <div className="flex items-center">
                  {step.status === "approved" ? (
                    <Check className="h-3 w-3 text-green-500 mr-1" />
                  ) : step.status === "rejected" ? (
                    <X className="h-3 w-3 text-red-500 mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 text-yellow-500 mr-1" />
                  )}
                  <span>
                    {roleName} ({step.username}):{" "}
                  </span>
                  <span className="ml-1">
                    {step.status === "approved"
                      ? "Aprovado"
                      : step.status === "rejected"
                        ? "Rejeitado"
                        : isCurrentStep
                          ? "Pendente (atual)"
                          : "Aguardando"}
                  </span>
                </div>
                {step.date && (
                  <div className="ml-4 text-gray-500">
                    {format(new Date(step.date), "dd/MM/yyyy HH:mm", { locale: pt })}
                  </div>
                )}
                {step.comments && <div className="ml-4 text-gray-600 italic">"{step.comments}"</div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Modificar a função handleAddPagamento para incluir o nome do fornecedor no ID

  // Localizar a função handleAddPagamento e modificar a parte que cria o fornecedor:

  const handleAddPagamento = () => {
    console.log("Iniciando adição de pagamento...")
    console.log("Dados do pagamento:", novoPagamento)
    console.log("Nome do fornecedor:", fornecedorNome)

    // Check if context functions are available
    if (!addFornecedor || !addPagamento) {
      console.error("Funções do contexto não disponíveis:", { addFornecedor, addPagamento })
      toast({
        title: "Erro ao adicionar pagamento",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    // Validar campos obrigatórios
    if (!novoPagamento.referencia || !novoPagamento.valor || !novoPagamento.dataVencimento) {
      console.error("Campos obrigatórios não preenchidos:", {
        referencia: novoPagamento.referencia,
        valor: novoPagamento.valor,
        dataVencimento: novoPagamento.dataVencimento,
      })
      toast({
        title: "Erro ao adicionar pagamento",
        description: "Por favor, preencha todos os campos obrigatórios (referência, valor e data de vencimento).",
        variant: "destructive",
      })
      return
    }

    try {
      // Garantir que o fornecedor existe
      if (!fornecedorNome) {
        console.error("Nome do fornecedor não fornecido")
        toast({
          title: "Erro ao adicionar pagamento",
          description: "Por favor, selecione um fornecedor.",
          variant: "destructive",
        })
        return
      }

      // Verificar se o fornecedor já existe pelo nome
      console.log("Verificando se o fornecedor já existe...")
      const fornecedor = fornecedores.find((f) => f.nome.toLowerCase() === fornecedorNome.toLowerCase())
      let fornecedorId = ""

      if (!fornecedor) {
        // Criar um novo fornecedor com ID único que inclui o nome
        // Remover espaços e caracteres especiais do nome para usar no ID
        const nomeParaId = fornecedorNome.replace(/[^a-zA-Z0-9]/g, "")
        fornecedorId = `fornecedor-${Date.now()}-${nomeParaId}`

        // Criar o objeto do novo fornecedor
        const novoFornecedor = {
          id: fornecedorId,
          nome: fornecedorNome,
          pagamentos: [],
        }

        console.log("Criando novo fornecedor:", novoFornecedor)

        // Adicionar o fornecedor
        try {
          addFornecedor(novoFornecedor)
          console.log("Fornecedor adicionado com sucesso:", fornecedorId)
        } catch (fornecedorError) {
          console.error("Erro ao adicionar fornecedor:", fornecedorError)
          throw fornecedorError
        }
      } else {
        fornecedorId = fornecedor.id
        console.log("Fornecedor existente encontrado:", fornecedorId)
      }

      // Adicionar o pagamento
      const pagamentoId = `pagamento-${Date.now()}`
      const pagamentoParaAdicionar = {
        ...novoPagamento,
        id: pagamentoId,
        estado: "pendente",
        dataPagamento: null,
        facturaRecebida: false,
        reciboRecebido: false,
        vdRecebido: false,
        fornecedorNome: fornecedorNome, // Adicionar o nome do fornecedor ao pagamento
        historico: [
          {
            id: uuidv4(),
            timestamp: new Date(),
            username: user?.username || "sistema",
            action: "create",
            details: "Pagamento criado",
          },
        ],
        reconciliado: false,
      }

      console.log("Tentando adicionar pagamento:", pagamentoParaAdicionar)
      console.log("ID do fornecedor:", fornecedorId)

      // Adicionar o pagamento ao fornecedor
      try {
        const resultado = addPagamento(fornecedorId, pagamentoParaAdicionar as Pagamento)
        console.log("Resultado da adição do pagamento:", resultado)

        // Armazenar informações do pagamento adicionado para uso posterior
        setNovoPagamentoAdicionado({
          id: pagamentoId,
          fornecedorId: fornecedorId,
          fornecedorNome: fornecedorNome,
          referencia: novoPagamento.referencia,
          valor: novoPagamento.valor,
        })

        // Verificar o método de pagamento e configurar o redirecionamento
        if (novoPagamento.metodo === "cheque") {
          setRedirectToChecks(true)
        } else if (novoPagamento.metodo === "fundo de maneio") {
          setRedirectToFundoManeio(true)
        }
      } catch (pagamentoError) {
        console.error("Erro ao adicionar pagamento:", pagamentoError)
        throw pagamentoError
      }

      // Limpar o formulário
      setNovoPagamento({
        referencia: "",
        valor: 0,
        dataVencimento: new Date(),
        metodo: "transferência",
        departamento: "",
        tipo: "fatura",
        descricao: "",
        observacoes: "",
      })
      setFornecedorNome("")
      setIsAddDialogOpen(false)

      console.log("Pagamento adicionado com sucesso!")
      toast({
        title: "Pagamento adicionado",
        description: "O pagamento foi adicionado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao adicionar pagamento:", error)
      toast({
        title: "Erro ao adicionar pagamento",
        description: "Ocorreu um erro ao adicionar o pagamento. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Modificar a função handleEditPagamento para sincronizar com fundo de maneio e outros métodos de pagamento

  // Substituir a função handleEditPagamento existente with this versão atualizada:

  const handleEditPagamento = () => {
    // Check if context functions are available
    if (!updatePagamento || !addFornecedor || !deletePagamento || !addPagamento) {
      toast({
        title: "Erro ao editar pagamento",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    if (pagamentoSelecionado) {
      console.log("Editando pagamento:", pagamentoSelecionado)

      // Verificar se o fornecedor existe
      const oldFornecedor = fornecedores.find((f) => f.id === pagamentoSelecionado.fornecedorId)
      if (!oldFornecedor) {
        console.error("Fornecedor original não encontrado:", pagamentoSelecionado.fornecedorId)
        toast({
          title: "Erro",
          description: "Fornecedor original não encontrado.",
          variant: "destructive",
        })
        return
      }

      // Verificar se o nome do fornecedor mudou
      let newFornecedor = fornecedores.find(
        (f) => f.nome.toLowerCase() === pagamentoSelecionado.fornecedorNome.toLowerCase(),
      )

      // Se o nome do fornecedor mudou e o novo fornecedor não existe, criar um novo
      if (!newFornecedor) {
        console.log("Criando novo fornecedor:", pagamentoSelecionado.fornecedorNome)
        newFornecedor = {
          id: `fornecedor-${Date.now()}`,
          nome: pagamentoSelecionado.fornecedorNome,
          pagamentos: [],
        }
        addFornecedor(newFornecedor)
      }

      // Certifique-se de que o usuário atual está definido
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para editar pagamentos.",
          variant: "destructive",
        })
        return
      }

      // Obter o pagamento original para comparação
      const pagamentoOriginal = oldFornecedor?.pagamentos.find((p) => p.id === pagamentoSelecionado.id)

      if (!pagamentoOriginal) {
        toast({
          title: "Erro",
          description: "Pagamento original não encontrado.",
          variant: "destructive",
        })
        return
      }

      // Criar cópias sem a propriedade historico para evitar referência circular
      const pagamentoOriginalParaHistorico = { ...pagamentoOriginal }
      delete pagamentoOriginalParaHistorico.historico

      const pagamentoSelecionadoParaHistorico = { ...pagamentoSelecionado }
      delete pagamentoSelecionadoParaHistorico.historico

      // Criar entrada de histórico
      const historicoEntry = {
        id: `historico-${Date.now()}`,
        timestamp: new Date(),
        username: user.username || "Admin",
        action: "update",
        details: `Pagamento editado por ${user.username || "Admin"}`,
        previousState: pagamentoOriginalParaHistorico,
        newState: pagamentoSelecionadoParaHistorico,
      }

      // Adicionar histórico ao pagamento
      if (!pagamentoSelecionado.historico) {
        pagamentoSelecionado.historico = []
      }

      pagamentoSelecionado.historico.push(historicoEntry)

      // Verificar se o método de pagamento foi alterado para fundo de maneio
      // Se o pagamento foi alterado para "fundo de maneio" e está marcado como pago
      if (
        pagamentoSelecionado.metodo === "fundo de maneio" &&
        pagamentoSelecionado.estado === "pago" &&
        (!pagamentoOriginal?.metodo ||
          pagamentoOriginal.metodo !== "fundo de maneio" ||
          !pagamentoOriginal.fundoManeioId)
      ) {
        // Criar um movimento no fundo de maneio
        const descricao = `Pagamento a ${pagamentoSelecionado.fornecedorNome} - Ref: ${pagamentoSelecionado.referencia}`

        // Verificar se a função existe antes de chamar
        if (typeof adicionarMovimentoFundoManeio === "function") {
          const movimentoId = adicionarMovimentoFundoManeio({
            data: pagamentoSelecionado.dataPagamento || new Date(),
            tipo: "saida",
            valor: pagamentoSelecionado.valor,
            descricao: descricao,
            pagamentoId: pagamentoSelecionado.id,
            pagamentoReferencia: pagamentoSelecionado.referencia,
            fornecedorNome: pagamentoSelecionado.fornecedorNome,
          })

          if (movimentoId) {
            // Atualizar o pagamento com a referência ao movimento do fundo de maneio
            pagamentoSelecionado.fundoManeioId = movimentoId
          } else {
            toast({
              title: "Aviso",
              description:
                "Não foi possível adicionar o movimento ao fundo de maneio. Verifique se há saldo suficiente.",
              variant: "warning",
            })
          }
        } else {
          console.warn("Função adicionarMovimentoFundoManeio não está disponível")
        }
      }

      // Se o método foi alterado de "fundo de maneio" para outro, remover a referência no fundo de maneio
      if (
        pagamentoOriginal?.metodo === "fundo de maneio" &&
        pagamentoSelecionado.metodo !== "fundo de maneio" &&
        pagamentoOriginal.fundoManeioId
      ) {
        // Remover o movimento do fundo de maneio ou marcá-lo como não relacionado ao pagamento
        removerReferenciaFundoManeio(pagamentoOriginal.fundoManeioId)

        // Remover a referência ao fundo de maneio no pagamento
        pagamentoSelecionado.fundoManeioId = undefined
      }

      // Verificar se o método de pagamento foi alterado para cheque
      if (
        pagamentoSelecionado.metodo === "cheque" &&
        pagamentoSelecionado.estado === "pago" &&
        (!pagamentoOriginal?.metodo || pagamentoOriginal.metodo !== "cheque")
      ) {
        // Verificar se já existe um cheque para este pagamento
        const chequeExistente = verificarChequeExistente(pagamentoSelecionado.id)

        if (!chequeExistente) {
          // Mostrar mensagem informando que é necessário emitir um cheque
          toast({
            title: "Ação necessária",
            description:
              "Este pagamento foi marcado como pago por cheque. Use a opção 'Emitir Cheque' para registrar os detalhes do cheque.",
          })
        }
      }

      // Verificar se o método foi alterado de "cheque" para outro
      if (pagamentoOriginal?.metodo === "cheque" && pagamentoSelecionado.metodo !== "cheque") {
        // Remover a referência ao pagamento no cheque
        removerReferenciaChequePagamento(pagamentoSelecionado.id)
      }

      console.log("Atualizando pagamento...")
      console.log("Fornecedor original:", oldFornecedor.id)
      console.log("Novo fornecedor:", newFornecedor.id)
      console.log("Pagamento:", pagamentoSelecionado)

      try {
        // Se o fornecedor mudou, mover o pagamento para o novo fornecedor
        if (oldFornecedor?.id !== newFornecedor.id) {
          console.log("Movendo pagamento para novo fornecedor")
          deletePagamento(oldFornecedor!.id, pagamentoSelecionado.id)
          addPagamento(newFornecedor.id, {
            ...pagamentoSelecionado,
            fornecedorId: newFornecedor.id,
          })
        } else {
          // Atualizar o pagamento no mesmo fornecedor
          console.log("Atualizando pagamento no mesmo fornecedor")
          updatePagamento(newFornecedor.id, pagamentoSelecionado)
        }

        setIsEditDialogOpen(false)
        setPagamentoSelecionado(null)

        toast({
          title: "Pagamento atualizado",
          description: "O pagamento foi atualizado com sucesso.",
        })
      } catch (error) {
        console.error("Erro ao atualizar pagamento:", error)
        toast({
          title: "Erro ao atualizar pagamento",
          description: "Ocorreu um erro ao atualizar o pagamento. Por favor, tente novamente.",
          variant: "destructive",
        })
      }
    }
  }

  // Adicionar estas novas funções auxiliares após handleEditPagamento

  // Função para remover referência no fundo de maneio
  const removerReferenciaFundoManeio = (fundoManeioId: string) => {
    try {
      const fundosManeio = JSON.parse(localStorage.getItem("fundosManeio") || "[]", (key, value) => {
        if (key === "mes" || key === "data") {
          return new Date(value)
        }
        return value
      })

      let atualizado = false

      // Procurar o movimento e remover a referência ao pagamento
      for (const fundo of fundosManeio) {
        if (!fundo.movimentos) continue
        const movimentoIndex = fundo.movimentos.findIndex((m: any) => m.id === fundoManeioId)
        if (movimentoIndex !== -1) {
          // Remover apenas as referências ao pagamento, mantendo o movimento
          fundo.movimentos[movimentoIndex].pagamentoId = undefined
          fundo.movimentos[movimentoIndex].pagamentoReferencia = undefined
          atualizado = true
          break
        }
      }

      if (atualizado) {
        localStorage.setItem("fundosManeio", JSON.stringify(fundosManeio))
      }
    } catch (error) {
      console.error("Erro ao remover referência no fundo de maneio:", error)
    }
  }

  // Função para verificar se já existe um cheque para o pagamento
  const verificarChequeExistente = (pagamentoId: string) => {
    try {
      const cheques = JSON.parse(localStorage.getItem("cheques") || "[]")
      return cheques.some((cheque: any) => cheque.pagamentoId === pagamentoId)
    } catch (error) {
      console.error("Erro ao verificar cheque existente:", error)
      return false
    }
  }

  // Função para remover referência ao pagamento no cheque
  const removerReferenciaChequePagamento = (pagamentoId: string) => {
    try {
      const cheques = JSON.parse(localStorage.getItem("cheques") || "[]")

      let atualizado = false

      // Procurar o cheque e remover a referência ao pagamento
      for (const cheque of cheques) {
        if (cheque.pagamentoId === pagamentoId) {
          cheque.pagamentoId = undefined
          cheque.pagamentoReferencia = undefined
          atualizado = true
        }
      }

      if (atualizado) {
        localStorage.setItem("cheques", JSON.stringify(cheques))
      }
    } catch (error) {
      console.error("Erro ao remover referência ao pagamento no cheque:", error)
    }
  }

  // Corrigir a função handleDeletePagamento para permitir a eliminação de operações
  const handleDeletePagamento = (fornecedorId: string, pagamentoId: string) => {
    console.log("Tentando eliminar pagamento:", { fornecedorId, pagamentoId })

    // Check if context functions are available
    if (!deletePagamento) {
      console.error("Função deletePagamento não disponível")
      toast({
        title: "Erro ao eliminar pagamento",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    try {
      // Remover quaisquer referências em outros sistemas
      const pagamento = todosOsPagamentos.find((p) => p.id === pagamentoId)

      if (pagamento) {
        // Se for um pagamento com fundo de maneio, remover a referência
        if (pagamento.metodo === "fundo de maneio" && pagamento.fundoManeioId) {
          removerReferenciaFundoManeio(pagamento.fundoManeioId)
        }

        // Se for um pagamento com cheque, remover a referência
        if (pagamento.metodo === "cheque") {
          removerReferenciaChequePagamento(pagamentoId)
        }
      }

      // Executar a eliminação do pagamento
      deletePagamento(fornecedorId, pagamentoId)

      toast({
        title: "Pagamento eliminado",
        description: "O pagamento foi removido com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao eliminar pagamento:", error)
      toast({
        title: "Erro ao eliminar pagamento",
        description: "Ocorreu um erro ao eliminar o pagamento. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Adicionar sincronização com o calendário fiscal ao marcar pagamento como pago
  // Modifique a função handleMarkAsPaid:

  const handleMarkAsPaid = (fornecedorId: string, pagamentoId: string) => {
    // Check if context functions are available
    if (!updatePagamento) {
      toast({
        title: "Erro ao marcar pagamento como pago",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    const pagamento = todosOsPagamentos.find((p) => p.id === pagamentoId)
    if (pagamento) {
      const pagamentoAtualizado = {
        ...pagamento,
        estado: "pago",
        dataPagamento: new Date(),
        facturaRecebida: false,
        reciboRecebido: false,
        vdRecebido: false,
      }
      updatePagamento(fornecedorId, pagamentoAtualizado)

      // Atualizar evento correspondente no calendário fiscal
      atualizarEventoCalendarioFiscal(pagamentoId)

      // Mostrar o lembrete de documentos
      setPagamentoParaDocumentos({
        ...pagamentoAtualizado,
        fornecedorId,
        fornecedorNome: pagamento.fornecedorNome,
      })

      toast({
        title: "Pagamento atualizado",
        description: "O pagamento foi marcado como pago.",
      })
    }
  }

  // Adicionar esta nova função após handleMarkAsPaid:

  // Função para atualizar evento no calendário fiscal
  const atualizarEventoCalendarioFiscal = (pagamentoId: string) => {
    // Carregar eventos do calendário fiscal
    const eventosFiscaisString = localStorage.getItem("eventosFiscais")
    if (!eventosFiscaisString) return

    try {
      const eventosFiscais = JSON.parse(eventosFiscaisString, (key, value) => {
        if (key === "data") {
          return new Date(value)
        }
        return value
      })

      // Atualizar eventos relacionados ao pagamento
      const eventosAtualizados = eventosFiscais.map((evento) => {
        if (evento.pagamentoId === pagamentoId) {
          return { ...evento, concluido: true }
        }
        return evento
      })

      // Salvar eventos atualizados
      localStorage.setItem("eventosFiscais", JSON.stringify(eventosAtualizados))
    } catch (error) {
      console.error("Erro ao atualizar evento no calendário fiscal:", error)
    }
  }

  // Implementação simplificada da função adicionarMovimentoFundoManeio
  const adicionarMovimentoFundoManeio = (movimento: any) => {
    try {
      // Carregar fundos de maneio existentes
      const fundosManeio = JSON.parse(localStorage.getItem("fundosManeio") || "[]")

      // Verificar se há pelo menos um fundo de maneio
      if (fundosManeio.length === 0) {
        toast({
          title: "Erro",
          description: "Não há fundos de maneio disponíveis.",
          variant: "destructive",
        })
        return null
      }

      // Usar o primeiro fundo de maneio disponível
      const fundo = fundosManeio[0]

      // Criar ID para o novo movimento
      const movimentoId = Date.now().toString()

      // Adicionar o movimento ao fundo
      const novoMovimento = {
        ...movimento,
        id: movimentoId,
        data: new Date(),
      }

      if (!fundo.movimentos) {
        fundo.movimentos = []
      }

      fundo.movimentos.push(novoMovimento)

      // Salvar fundos atualizados
      localStorage.setItem("fundosManeio", JSON.stringify(fundosManeio))

      return movimentoId
    } catch (error) {
      console.error("Erro ao adicionar movimento ao fundo de maneio:", error)
      return null
    }
  }

  // Vamos melhorar a função handlePagarComFundoManeio para garantir que funcione corretamente

  // Substitua a função handlePagarComFundoManeio existente por esta versão melhorada:
  const handlePagarComFundoManeio = () => {
    console.log("Iniciando pagamento com fundo de maneio...")

    // Check if context functions are available
    if (!updatePagamento) {
      console.error("Função updatePagamento não disponível")
      toast({
        title: "Erro ao pagar com fundo de maneio",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    if (!pagamentoParaFundoManeio) {
      console.error("Pagamento para fundo de maneio não selecionado")
      toast({
        title: "Erro",
        description: "Pagamento não selecionado.",
        variant: "destructive",
      })
      return
    }

    console.log("Pagamento selecionado:", pagamentoParaFundoManeio)

    // Usar uma descrição padrão se não for fornecida
    const descricaoEfetiva =
      descricaoFundoManeio ||
      `Pagamento a ${pagamentoParaFundoManeio.fornecedorNome} - Ref: ${pagamentoParaFundoManeio.referencia}`

    console.log("Descrição do movimento:", descricaoEfetiva)

    try {
      // Carregar fundos de maneio existentes
      const fundosManeioString = localStorage.getItem("fundosManeio")
      const fundosManeio = fundosManeioString
        ? JSON.parse(fundosManeioString, (key, value) => {
            if (key === "mes" || key === "data") {
              return new Date(value)
            }
            return value
          })
        : []

      // Verificar se há pelo menos um fundo de maneio
      if (fundosManeio.length === 0) {
        console.error("Não há fundos de maneio disponíveis")
        toast({
          title: "Erro",
          description: "Não há fundos de maneio disponíveis.",
          variant: "destructive",
        })
        return
      }

      // Usar o primeiro fundo de maneio disponível
      const fundo = fundosManeio[0]

      // Criar ID para o novo movimento
      const movimentoId = Date.now().toString()

      // Adicionar o movimento ao fundo
      const novoMovimento = {
        id: movimentoId,
        data: new Date(),
        tipo: "saida",
        valor: pagamentoParaFundoManeio.valor,
        descricao: descricaoEfetiva,
        pagamentoId: pagamentoParaFundoManeio.id,
        pagamentoReferencia: pagamentoParaFundoManeio.referencia,
        fornecedorNome: pagamentoParaFundoManeio.fornecedorNome,
      }

      if (!fundo.movimentos) {
        fundo.movimentos = []
      }

      // Verificar se há saldo suficiente
      const saldoAtual = fundo.saldoFinal || fundo.saldoInicial || 0
      if (saldoAtual < pagamentoParaFundoManeio.valor) {
        console.error("Saldo insuficiente no fundo de maneio")
        toast({
          title: "Erro",
          description: `Saldo insuficiente no fundo de maneio. Saldo atual: ${saldoAtual.toFixed(2)} MZN`,
          variant: "destructive",
        })
        return
      }

      // Adicionar o movimento e atualizar o saldo
      fundo.movimentos.push(novoMovimento)
      fundo.saldoFinal = saldoAtual - pagamentoParaFundoManeio.valor

      // Salvar fundos atualizados
      localStorage.setItem("fundosManeio", JSON.stringify(fundosManeio))
      console.log("Movimento adicionado ao fundo de maneio:", novoMovimento)

      // Atualizar o pagamento
      const pagamentoAtualizado = {
        ...pagamentoParaFundoManeio,
        estado: "pago",
        dataPagamento: new Date(),
        metodo: "fundo de maneio",
        fundoManeioId: movimentoId,
        observacoes: `${pagamentoParaFundoManeio.observacoes ? pagamentoParaFundoManeio.observacoes + " | " : ""}Pago com Fundo de Maneio em ${format(new Date(), "dd/MM/yyyy", { locale: pt })}`,
      }

      console.log("Atualizando pagamento:", pagamentoAtualizado)
      updatePagamento(pagamentoParaFundoManeio.fornecedorId, pagamentoAtualizado)

      setIsFundoManeioDialogOpen(false)
      setPagamentoParaFundoManeio(null)
      setDescricaoFundoManeio("")

      toast({
        title: "Pagamento realizado",
        description: "O pagamento foi realizado com sucesso utilizando o fundo de maneio.",
      })
    } catch (error) {
      console.error("Erro ao processar pagamento com fundo de maneio:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Substitua a função handleExportPDF existente por esta implementação funcional:

  const handleExportPDF = (pagamento: Pagamento) => {
    try {
      // Criar um elemento temporário para renderizar o conteúdo do PDF
      const element = document.createElement("div")
      element.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333;">Comprovativo de Pagamento</h1>
          </div>
          <div style="border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px;">
            <h2 style="color: #555;">Detalhes do Pagamento</h2>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; width: 40%;"><strong>Referência:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${pagamento.referencia}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Fornecedor:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${pagamento.fornecedorNome}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Valor:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${pagamento.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Data de Vencimento:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Estado:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${pagamento.estado.charAt(0).toUpperCase() + pagamento.estado.slice(1)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Método de Pagamento:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${pagamento.metodo}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Departamento:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${pagamento.departamento || "N/A"}</td>
            </tr>
            ${
              pagamento.dataPagamento
                ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Data de Pagamento:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${format(new Date(pagamento.dataPagamento), "dd/MM/yyyy", { locale: pt })}</td>
            </tr>
            `
                : ""
            }
            ${
              pagamento.observacoes
                ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Observações:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${pagamento.observacoes}</td>
            </tr>
            `
                : ""
            }
          </table>
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #777;">
            <p>Este documento foi gerado automaticamente pelo sistema de Tesouraria.</p>
            <p>Data de emissão: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}</p>
          </div>
        </div>
      `

      // Usar a função de impressão do navegador para gerar um PDF
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Comprovativo de Pagamento - ${pagamento.referencia}</title>
              <style>
                @media print {
                  body { margin: 0; padding: 0; }
                  @page { size: A4; margin: 1cm; }
                }
              </style>
            </head>
            <body>
              ${element.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                  window.setTimeout(function() { window.close(); }, 500);
                };
              </script>
            </body>
          </html>
        `)
        printWindow.document.close()
      } else {
        toast({
          title: "Erro",
          description:
            "Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desativado.",
          variant: "destructive",
        })
      }

      toast({
        title: "PDF gerado",
        description: `O PDF do pagamento ${pagamento.referencia} foi gerado com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Substitua a função handleExportExcel existente por esta implementação funcional:

  const handleExportExcel = (pagamento: Pagamento) => {
    try {
      // Criar os dados para o CSV
      const headers = [
        "Referência",
        "Fornecedor",
        "Valor (MZN)",
        "Data de Vencimento",
        "Estado",
        "Método de Pagamento",
        "Departamento",
        "Data de Pagamento",
        "Observações",
      ]

      const data = [
        pagamento.referencia,
        pagamento.fornecedorNome,
        pagamento.valor.toString(),
        format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt }),
        pagamento.estado,
        pagamento.metodo,
        pagamento.departamento || "",
        pagamento.dataPagamento ? format(new Date(pagamento.dataPagamento), "dd/MM/yyyy", { locale: pt }) : "Não pago",
        pagamento.observacoes || "",
      ]

      // Criar o conteúdo CSV
      const csvContent = [
        headers.join(","),
        data.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(","),
      ].join("\n")

      // Criar um Blob com o conteúdo CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)

      // Criar um link para download
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `pagamento_${pagamento.referencia.replace(/[^a-zA-Z0-9]/g, "_")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Excel exportado",
        description: `Os dados do pagamento ${pagamento.referencia} foram exportados para CSV com sucesso.`,
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

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendente":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendente
          </Badge>
        )
      case "pago":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Pago
          </Badge>
        )
      case "atrasado":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Atrasado
          </Badge>
        )
      case "cancelado":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getMetodoBadge = (metodo: string) => {
    switch (metodo) {
      case "fundo de maneio":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Fundo de Maneio
          </Badge>
        )
      default:
        return metodo
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleMesAnterior = () => {
    setMesSelecionado((mesAtual) => subMonths(mesAtual, 1))
  }

  const handleProximoMes = () => {
    setMesSelecionado((mesAtual) => addMonths(mesAtual, 1))
  }

  const handleEmitirCheque = (pagamento: any) => {
    setPagamentoParaCheque(pagamento)
    setNovoCheque({
      numero: "",
      dataEmissao: new Date(),
    })
    setIsEmitirChequeDialogOpen(true)
  }

  const handleSalvarCheque = () => {
    // Check if context functions are available
    if (!updatePagamento) {
      toast({
        title: "Erro ao emitir cheque",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    if (!pagamentoParaCheque || !novoCheque.numero || !novoCheque.dataEmissao) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Atualizar o pagamento para indicar que está sendo pago por cheque
    updatePagamento(pagamentoParaCheque.fornecedorId, {
      ...pagamentoParaCheque,
      metodo: "cheque",
      observacoes: `${pagamentoParaCheque.observacoes ? pagamentoParaCheque.observacoes + " | " : ""}Cheque nº ${novoCheque.numero} emitido em ${format(novoCheque.dataEmissao, "dd/MM/yyyy", { locale: pt })}`,
    })

    // Adicionar o cheque ao controle de cheques
    const chequeToAdd = {
      id: Date.now().toString(),
      numero: novoCheque.numero,
      valor: pagamentoParaCheque.valor,
      beneficiario: pagamentoParaCheque.fornecedorNome,
      dataEmissao: novoCheque.dataEmissao,
      dataCompensacao: null,
      estado: "pendente",
      pagamentoId: pagamentoParaCheque.id,
      pagamentoReferencia: pagamentoParaCheque.referencia,
      fornecedorNome: pagamentoParaCheque.fornecedorNome,
    }

    // Carregar cheques existentes do localStorage
    const chequesExistentes = JSON.parse(localStorage.getItem("cheques") || "[]")

    // Adicionar o novo cheque
    const chequeAtualizados = [...chequesExistentes, chequeToAdd]

    // Salvar no localStorage
    localStorage.setItem("cheques", JSON.stringify(chequeAtualizados))

    // Fechar o diálogo
    setIsEmitirChequeDialogOpen(false)
    setPagamentoParaCheque(null)

    toast({
      title: "Cheque emitido",
      description: "O cheque foi emitido e adicionado ao controle de cheques.",
    })
  }

  // Modificar a função de marcar pagamento como pago para sincronizar com reconciliação bancária
  // Procurar a função que marca pagamentos como pagos e modificá-la para:

  const marcarComoPago = (pagamento: Pagamento, fornecedorId: string) => {
    // Check if context functions are available
    if (!updatePagamento) {
      toast({
        title: "Erro ao marcar como pago",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    const pagamentoAtualizado = {
      ...pagamento,
      estado: "pago",
      dataPagamento: new Date(),
    }

    updatePagamento(fornecedorId, pagamentoAtualizado)

    // Se o pagamento for por cheque ou transferência, adicionar à reconciliação bancária
    if (pagamentoAtualizado.metodo === "cheque" || pagamentoAtualizado.metodo === "transferencia") {
      adicionarTransacaoBancaria(pagamentoAtualizado, fornecedorId)
    }

    toast({
      title: "Pagamento atualizado",
      description: `O pagamento ${pagamento.referencia} foi marcado como pago.`,
    })
  }

  // Adicionar função para criar uma transação bancária a partir de um pagamento
  // Adicionar após a função marcarComoPago:

  const adicionarTransacaoBancaria = (pagamento: Pagamento, fornecedorId: string) => {
    const fornecedor = fornecedores.find((f) => f.id === fornecedorId)
    if (!fornecedor) return

    // Verificar se já existe uma transação para este pagamento
    const transacoesArmazenadas = localStorage.getItem("transacoesBancarias")

    let descricao = ""
    const metodo = pagamento.metodo || "outro"
    let chequeId = undefined
    let chequeNumero = undefined

    // Extrair número do cheque das observações, se for um pagamento por cheque
    if (pagamento.metodo === "cheque" && pagamento.observacoes) {
      const chequeMatch =
        pagamento.observacoes.match(/cheque\s+n[º°]?\s*(\d+)/i) ||
        pagamento.observacoes.match(/ch\s+n[º°]?\s*(\d+)/i) ||
        pagamento.observacoes.match(/ch\s*(\d+)/i)

      if (chequeMatch && chequeMatch[1]) {
        chequeNumero = chequeMatch[1]

        // Verificar se existe um cheque com este número
        const chequesArmazenados = localStorage.getItem("cheques")
        if (chequesArmazenados) {
          try {
            const chequesParsed = JSON.parse(chequesArmazenados)
            const chequeEncontrado = chequesParsed.find((c: any) => c.numero === chequeNumero)

            if (chequeEncontrado) {
              chequeId = chequeEncontrado.id
            }
          } catch (error) {
            console.error("Erro ao processar cheques:", error)
          }
        }
      }

      descricao = `Pagamento por cheque - ${fornecedor.nome} - ${pagamento.referencia}`
    } else if (pagamento.metodo === "transferencia") {
      descricao = `Transferência bancária - ${fornecedor.nome} - ${pagamento.referencia}`
    } else {
      descricao = `Pagamento - ${fornecedor.nome} - ${pagamento.referencia}`
    }

    const novaTransacao = {
      id: `pag-${pagamento.id}`,
      data: pagamento.dataPagamento || new Date(),
      descricao: descricao,
      valor: pagamento.valor,
      tipo: "debito",
      reconciliado: true,
      pagamentoId: pagamento.id,
      chequeId: chequeId,
      chequeNumero: chequeNumero,
      metodo: metodo,
    }

    if (transacoesArmazenadas) {
      try {
        const transacoesParsed = JSON.parse(transacoesArmazenadas)

        // Verificar se já existe uma transação para este pagamento
        const transacaoExistente = transacoesParsed.find((t: any) => t.pagamentoId === pagamento.id)

        if (transacaoExistente) {
          // Atualizar a transação existente
          const transacoesAtualizadas = transacoesParsed.map((t: any) =>
            t.pagamentoId === pagamento.id ? novaTransacao : t,
          )
          localStorage.setItem("transacoesBancarias", JSON.stringify(transacoesAtualizadas))
        } else {
          // Adicionar nova transação
          const transacoesAtualizadas = [...transacoesParsed, novaTransacao]
          localStorage.setItem("transacoesBancarias", JSON.stringify(transacoesAtualizadas))
        }
      } catch (error) {
        console.error("Erro ao processar transações bancárias:", error)

        // Se houver erro, criar nova lista
        localStorage.setItem("transacoesBancarias", JSON.stringify([novaTransacao]))
      }
    } else {
      // Não existe lista de transações, criar nova
      localStorage.setItem("transacoesBancarias", JSON.stringify([novaTransacao]))
    }
  }

  // Adicione esta função no componente PagamentosTable
  const handleInitiateWorkflow = (pagamento: any) => {
    // Check if context functions are available
    if (!initializeWorkflow) {
      toast({
        title: "Erro ao iniciar workflow",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    if (pagamento.workflow) {
      // Se já existe um workflow, apenas abrir o diálogo
      setPagamentoParaWorkflow(pagamento)
      setIsWorkflowDialogOpen(true)
    } else {
      // Se não existe workflow, inicializar e depois abrir o diálogo
      initializeWorkflow(pagamento.id, pagamento.fornecedorId)

      // Buscar o pagamento atualizado
      const fornecedor = fornecedores.find((f) => f.id === pagamento.fornecedorId)
      if (fornecedor) {
        const updatedPagamento = fornecedor.pagamentos.find((p) => p.id === pagamento.id)
        if (updatedPagamento) {
          setPagamentoParaWorkflow({
            ...updatedPagamento,
            fornecedorId: pagamento.fornecedorId,
            fornecedorNome: pagamento.fornecedorNome,
          })
          setIsWorkflowDialogOpen(true)
        }
      }
    }
  }

  // Agora, vamos adicionar os diálogos de redirecionamento
  // Adicione este código antes do return final do componente (antes de "return (")

  // Efeito para abrir automaticamente o diálogo de cheque quando necessário
  useEffect(() => {
    if (redirectToChecks && novoPagamentoAdicionado) {
      // Configurar o pagamento para cheque
      const pagamentoParaChequeObj = {
        ...todosOsPagamentos.find((p) => p.id === novoPagamentoAdicionado.id),
        fornecedorId: novoPagamentoAdicionado.fornecedorId,
        fornecedorNome: novoPagamentoAdicionado.fornecedorNome,
      }

      if (pagamentoParaChequeObj) {
        setPagamentoParaCheque(pagamentoParaChequeObj)
        setNovoCheque({
          numero: "",
          dataEmissao: new Date(),
        })
        setIsEmitirChequeDialogOpen(true)

        // Resetar o estado de redirecionamento
        setRedirectToChecks(false)
        setNovoPagamentoAdicionado(null)
      }
    }
  }, [redirectToChecks, novoPagamentoAdicionado, todosOsPagamentos])

  // Efeito para abrir automaticamente o diálogo de fundo de maneio quando necessário
  useEffect(() => {
    if (redirectToFundoManeio && novoPagamentoAdicionado) {
      // Configurar o pagamento para fundo de maneio
      const pagamentoParaFundoObj = {
        ...todosOsPagamentos.find((p) => p.id === novoPagamentoAdicionado.id),
        fornecedorId: novoPagamentoAdicionado.fornecedorId,
        fornecedorNome: novoPagamentoAdicionado.fornecedorNome,
      }

      if (pagamentoParaFundoObj) {
        setPagamentoParaFundoManeio(pagamentoParaFundoObj)
        setDescricaoFundoManeio(
          `Pagamento a ${pagamentoParaFundoObj.fornecedorNome} - Ref: ${pagamentoParaFundoObj.referencia}`,
        )
        setIsFundoManeioDialogOpen(true)

        // Resetar o estado de redirecionamento
        setRedirectToFundoManeio(false)
        setNovoPagamentoAdicionado(null)
      }
    }
  }, [redirectToFundoManeio, novoPagamentoAdicionado, todosOsPagamentos])

  if (isLoading) {
    return (
      <PrintLayout title="Relatório de Pagamentos">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-gray-500">Carregando pagamentos...</p>
        </div>
      </PrintLayout>
    )
  }

  return (
    <PrintLayout title="Relatório de Pagamentos">
      <div className="space-y-4">
        {user?.role === "admin" && (
          <Alert>
            <AlertTitle>Modo Administrador Ativo</AlertTitle>
            <AlertDescription>
              Você está operando em nome de VMONDLANE. Todas as ações serão registradas.
            </AlertDescription>
          </Alert>
        )}
        <CardHeader className="bg-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Relatório de Pagamentos</CardTitle>
              <CardDescription>Gerencie os pagamentos do sistema</CardDescription>
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
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar pagamentos..."
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
                  Novo Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="sticky top-0 bg-white z-10 pb-2">
                  <DialogTitle>Adicionar Novo Pagamento</DialogTitle>
                  <DialogDescription>Preencha os detalhes do pagamento a ser adicionado ao sistema.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="fornecedor">Fornecedor</Label>
                      <div className="relative">
                        <Input
                          id="fornecedor"
                          value={fornecedorNome}
                          onChange={(e) => setFornecedorNome(e.target.value)}
                          placeholder="Digite o nome do fornecedor"
                          required
                          className="w-full"
                          list="fornecedores-list"
                        />
                        <datalist id="fornecedores-list">
                          {fornecedores &&
                            fornecedores.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.nome} />)}
                        </datalist>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="referencia">Referência</Label>
                      <Input
                        id="referencia"
                        value={novoPagamento.referencia}
                        onChange={(e) => setNovoPagamento({ ...novoPagamento, referencia: e.target.value })}
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
                        value={isNaN(novoPagamento.valor) ? "" : novoPagamento.valor}
                        onChange={(e) =>
                          setNovoPagamento({
                            ...novoPagamento,
                            valor: e.target.value === "" ? 0 : Number.parseFloat(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                      <Input
                        id="dataVencimento"
                        type="date"
                        value={
                          novoPagamento.dataVencimento instanceof Date
                            ? novoPagamento.dataVencimento.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setNovoPagamento({ ...novoPagamento, dataVencimento: new Date(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="metodo">Método de Pagamento</Label>
                      <select
                        id="metodo"
                        className="w-full p-2 border rounded"
                        value={novoPagamento.metodo}
                        onChange={(e) => setNovoPagamento({ ...novoPagamento, metodo: e.target.value as any })}
                        required
                      >
                        <option value="transferência">Transferência</option>
                        <option value="cheque">Cheque</option>
                        <option value="débito direto">Débito Direto</option>
                        <option value="fundo de maneio">Fundo de Maneio</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="departamento">Departamento</Label>
                      <Input
                        id="departamento"
                        value={novoPagamento.departamento}
                        onChange={(e) => setNovoPagamento({ ...novoPagamento, departamento: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <select
                        id="tipo"
                        className="w-full p-2 border rounded"
                        value={novoPagamento.tipo}
                        onChange={(e) => setNovoPagamento({ ...novoPagamento, tipo: e.target.value as any })}
                        required
                      >
                        <option value="fatura">Fatura</option>
                        <option value="cotacao">Cotação</option>
                        <option value="vd">Venda a Dinheiro (VD)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={novoPagamento.descricao}
                      onChange={(e) => setNovoPagamento({ ...novoPagamento, descricao: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={novoPagamento.observacoes}
                      onChange={(e) => setNovoPagamento({ ...novoPagamento, observacoes: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter className="sticky bottom-0 bg-white pt-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddPagamento}>Adicionar Pagamento</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={handlePrint} className="print:hidden">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowWorkflowColumn(!showWorkflowColumn)}
              className="print:hidden"
            >
              {showWorkflowColumn ? "Ocultar Aprovações" : "Mostrar Aprovações"}
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          {filteredPagamentos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Nenhum pagamento encontrado para o período selecionado.</p>
            </div>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-600 text-white">
                    <TableHead className="font-semibold text-white">Referência</TableHead>
                    <TableHead className="font-semibold text-white">Fornecedor</TableHead>
                    <TableHead className="font-semibold text-white text-right">Valor</TableHead>
                    <TableHead className="font-semibold text-white">Vencimento</TableHead>
                    <TableHead className="font-semibold text-white">Estado</TableHead>
                    <TableHead className="font-semibold text-white">Método</TableHead>
                    {showWorkflowColumn && <TableHead className="font-semibold text-white">Aprovação</TableHead>}
                    <TableHead className="font-semibold text-white">Departamento</TableHead>
                    <TableHead className="font-semibold text-white text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPagamentos.map((pagamento, index) => (
                    <TableRow key={pagamento.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell className="font-medium">{pagamento.referencia}</TableCell>
                      <TableCell>{pagamento.fornecedorNome}</TableCell>
                      <TableCell className="text-right">{pagamento.valor.toFixed(2)} MZN</TableCell>
                      <TableCell>{format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}</TableCell>
                      <TableCell>{getEstadoBadge(pagamento.estado)}</TableCell>
                      <TableCell>{getMetodoBadge(pagamento.metodo)}</TableCell>
                      {showWorkflowColumn && (
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-2 cursor-help">
                                {getWorkflowStatusBadge(pagamento)}
                                {pagamento.workflow && getWorkflowProgress(pagamento)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="w-80 p-3">{getWorkflowDetails(pagamento)}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      )}
                      <TableCell>{pagamento.departamento}</TableCell>
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

                            {/* Ações principais */}
                            <DropdownMenuItem onClick={() => setPagamentoSelecionado(pagamento)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Visualizar detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setPagamentoSelecionado(pagamento)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>

                            {/* Submenu de Pagamento */}
                            {(pagamento.estado === "pendente" || pagamento.estado === "atrasado") && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Opções de Pagamento
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {user?.role === "admin" && (
                                    <DropdownMenuItem onClick={() => marcarComoPago(pagamento, pagamento.fornecedorId)}>
                                      <Check className="mr-2 h-4 w-4" />
                                      Marcar como pago
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleEmitirCheque(pagamento)}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Emitir Cheque
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setPagamentoParaFundoManeio(pagamento)
                                      setIsFundoManeioDialogOpen(true)
                                    }}
                                  >
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Pagar com Fundo de Maneio
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}

                            {/* Submenu de Documentos */}
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <FileText className="mr-2 h-4 w-4" />
                                Documentos
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleExportPDF(pagamento)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Exportar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportExcel(pagamento)}>
                                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                                  Exportar Excel
                                </DropdownMenuItem>
                                {pagamento.estado === "pago" && (
                                  <DropdownMenuItem onClick={() => setPagamentoParaDocumentos(pagamento)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Documentos Fiscais
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            {/* Outras ações */}
                            <DropdownMenuItem
                              onClick={() => {
                                setPagamentoSelecionado(pagamento)
                                setIsHistoryDialogOpen(true)
                              }}
                            >
                              <History className="mr-2 h-4 w-4" />
                              Ver histórico
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleInitiateWorkflow(pagamento)}>
                              <FileText className="mr-2 h-4 w-4" />
                              {pagamento.workflow ? "Ver Aprovações" : "Iniciar Aprovação"}
                            </DropdownMenuItem>

                            {user?.role === "admin" && pagamento.estado === "pendente" && (
                              <DropdownMenuItem onClick={() => setPagamentoParaNotificar(pagamento)}>
                                <Bell className="mr-2 h-4 w-4" />
                                Notificar Fornecedor
                              </DropdownMenuItem>
                            )}

                            {/* Ações administrativas */}
                            {(user?.username === "Vinildo Mondlane" ||
                              user?.username === "Benigna Magaia" ||
                              user?.role === "admin") && (
                              <>
                                <DropdownMenuSeparator />
                                {/* Only show delete option if payment is not approved or user is admin */}
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeletePagamento(pagamento.fornecedorId, pagamento.id)}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
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

        {pagamentoSelecionado && (
          <DetalhesPagamento
            pagamento={pagamentoSelecionado}
            isOpen={!!pagamentoSelecionado}
            onClose={() => setPagamentoSelecionado(null)}
          />
        )}
        {pagamentoParaNotificar && (
          <NotificarFornecedor
            fornecedorNome={pagamentoParaNotificar.fornecedorNome}
            referenciaPagamento={pagamentoParaNotificar.referencia}
            dataVencimento={new Date(pagamentoParaNotificar.dataVencimento)}
            valor={pagamentoParaNotificar.valor}
            isOpen={!!pagamentoParaNotificar}
            onClose={() => setPagamentoParaNotificar(null)}
          />
        )}
        {pagamentoParaDocumentos && (
          <LembreteDocumentos
            pagamento={pagamentoParaDocumentos}
            isOpen={!!pagamentoParaDocumentos}
            onClose={() => setPagamentoParaDocumentos(null)}
          />
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-white z-10 pb-2">
              <DialogTitle>Editar Pagamento</DialogTitle>
              <DialogDescription>Atualize os detalhes do pagamento.</DialogDescription>
            </DialogHeader>
            {pagamentoSelecionado && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-fornecedor">Fornecedor</Label>
                    <Input
                      id="edit-fornecedor"
                      value={pagamentoSelecionado.fornecedorNome}
                      onChange={(e) =>
                        setPagamentoSelecionado({ ...pagamentoSelecionado, fornecedorNome: e.target.value })
                      }
                      placeholder="Digite o nome do fornecedor"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-referencia">Referência</Label>
                    <Input
                      id="edit-referencia"
                      value={pagamentoSelecionado.referencia}
                      onChange={(e) => setPagamentoSelecionado({ ...pagamentoSelecionado, referencia: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-valor">Valor (MT)</Label>
                    <Input
                      id="edit-valor"
                      type="number"
                      step="0.01"
                      value={isNaN(pagamentoSelecionado.valor) ? "" : pagamentoSelecionado.valor}
                      onChange={(e) =>
                        setPagamentoSelecionado({
                          ...pagamentoSelecionado,
                          valor: e.target.value === "" ? 0 : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-dataVencimento">Data de Vencimento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          {format(new Date(pagamentoSelecionado.dataVencimento), "dd/MM/yyyy", { locale: pt })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={new Date(pagamentoSelecionado.dataVencimento)}
                          onSelect={(date) =>
                            setPagamentoSelecionado({ ...pagamentoSelecionado, dataVencimento: date || new Date() })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-estado">Estado</Label>
                    <Select
                      value={pagamentoSelecionado.estado}
                      onValueChange={(value) =>
                        setPagamentoSelecionado({ ...pagamentoSelecionado, estado: value as any })
                      }
                    >
                      <SelectTrigger id="edit-estado">
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-metodo">Método</Label>
                    <Select
                      value={pagamentoSelecionado.metodo}
                      onValueChange={(value) =>
                        setPagamentoSelecionado({ ...pagamentoSelecionado, metodo: value as any })
                      }
                    >
                      <SelectTrigger id="edit-metodo">
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transferência">Transferência</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="débito direto">Débito Direto</SelectItem>
                        <SelectItem value="fundo de maneio">Fundo de Maneio</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-departamento">Departamento</Label>
                  <Input
                    id="edit-departamento"
                    value={pagamentoSelecionado.departamento}
                    onChange={(e) => setPagamentoSelecionado({ ...pagamentoSelecionado, departamento: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  <Input
                    id="edit-descricao"
                    value={pagamentoSelecionado.descricao}
                    onChange={(e) => setPagamentoSelecionado({ ...pagamentoSelecionado, descricao: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-observacoes">Observações</Label>
                  <Input
                    id="edit-observacoes"
                    value={pagamentoSelecionado.observacoes}
                    onChange={(e) => setPagamentoSelecionado({ ...pagamentoSelecionado, observacoes: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="sticky bottom-0 bg-white pt-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditPagamento}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para pagamento com fundo de maneio */}
        <Dialog open={isFundoManeioDialogOpen} onOpenChange={setIsFundoManeioDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Pagar com Fundo de Maneio</DialogTitle>
              <DialogDescription>Este pagamento será realizado utilizando o fundo de maneio.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Detalhes do Pagamento</h3>
                <div className="space-y-1">
                  <p className="font-medium">{pagamentoParaFundoManeio?.referencia}</p>
                  <p className="text-sm text-gray-500">Fornecedor: {pagamentoParaFundoManeio?.fornecedorNome}</p>
                  <p className="text-sm text-gray-500">
                    Valor:{" "}
                    {pagamentoParaFundoManeio?.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao-fundo" className="text-sm font-medium mb-2 block">
                  Descrição (opcional)
                </Label>
                <Input
                  id="descricao-fundo"
                  value={descricaoFundoManeio}
                  onChange={(e) => setDescricaoFundoManeio(e.target.value)}
                  className="w-full"
                  placeholder="Descrição para o movimento no fundo de maneio"
                />
                <p className="mt-2 text-sm text-gray-500 italic">
                  Se não for fornecida uma descrição, será usada uma descrição padrão com os dados do pagamento.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsFundoManeioDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePagarComFundoManeio}>Confirmar Pagamento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {pagamentoSelecionado && (
          <PaymentHistory
            history={pagamentoSelecionado.historico || []}
            isOpen={isHistoryDialogOpen}
            onClose={() => setIsHistoryDialogOpen(false)}
          />
        )}
        {pagamentoParaCheque && (
          <Dialog open={isEmitirChequeDialogOpen} onOpenChange={setIsEmitirChequeDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Emitir Cheque</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do cheque para o pagamento {pagamentoParaCheque.referencia}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pagamento-info" className="text-right">
                    Pagamento
                  </Label>
                  <div className="col-span-3">
                    <p className="font-medium">{pagamentoParaCheque.referencia}</p>
                    <p className="text-sm text-gray-500">{pagamentoParaCheque.fornecedorNome}</p>
                    <p className="text-sm text-gray-500">
                      {pagamentoParaCheque.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="numero-cheque" className="text-right">
                    Número do Cheque
                  </Label>
                  <Input
                    id="numero-cheque"
                    value={novoCheque.numero}
                    onChange={(e) => setNovoCheque({ ...novoCheque, numero: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="data-emissao" className="text-right">
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
                        onChange={(date) => setNovoCheque({ ...novoCheque, dataEmissao: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEmitirChequeDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSalvarCheque}>Emitir Cheque</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {pagamentoParaWorkflow && (
          <WorkflowApproval
            pagamento={pagamentoParaWorkflow}
            isOpen={isWorkflowDialogOpen}
            onClose={() => {
              setIsWorkflowDialogOpen(false)
              setPagamentoParaWorkflow(null)
            }}
          />
        )}
      </div>
    </PrintLayout>
  )
}

