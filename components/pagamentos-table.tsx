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
// Importar utilitários
import {
  adicionarCheque,
  verificarChequeExistente,
  removerReferenciaChequePagamento,
  inicializarSistemaCheques,
} from "@/lib/cheque-utils"

export function PagamentosTable() {
  // Inicializar o sistema de cheques
  useEffect(() => {
    inicializarSistemaCheques()
  }, [])

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
      const filtered = pagamentosDoMes
        .filter(
          (pagamento) =>
            pagamento.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pagamento.fornecedorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pagamento.departamento && pagamento.departamento.toLowerCase().includes(searchTerm.toLowerCase())),
        )
        .map((pagamento) => {
          // Calcular valores para pagamentos parciais
          const pagamentosParciais = pagamento.pagamentosParciais || []
          const valorPago =
            pagamentosParciais.length > 0
              ? pagamentosParciais.reduce((total, p) => total + p.valor, 0)
              : pagamento.estado === "pago"
                ? pagamento.valor
                : 0

          const valorPendente = Math.max(0, pagamento.valor - valorPago)
          const percentualPago = pagamento.valor > 0 ? (valorPago / pagamento.valor) * 100 : 0

          // Determinar status baseado no pagamento parcial
          let status = pagamento.estado
          if (valorPago > 0 && valorPendente > 0) {
            status = "parcialmente pago"
          } else if (valorPendente <= 0 && valorPago > 0) {
            status = "pago"
          }

          return {
            ...pagamento,
            valorPago: valorPago,
            valorPendente: valorPendente,
            percentualPago: percentualPago,
            status: status,
          }
        })

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
          // Redirecionar para emissão de cheque
          setRedirectToChecks(true)
        } else if (novoPagamento.metodo === "fundo de maneio") {
          // Redirecionar para fundo de maneio
          setRedirectToFundoManeio(true)
        } else if (novoPagamento.metodo === "transferência") {
          // Adicionar à reconciliação bancária como transação pendente
          adicionarTransacaoBancariaParaPagamento(pagamentoId, fornecedorId, fornecedorNome, novoPagamento)
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

  // Adicionar esta nova função para criar uma transação bancária pendente para um pagamento por transferência
  const adicionarTransacaoBancariaParaPagamento = (
    pagamentoId: string,
    fornecedorId: string,
    fornecedorNome: string,
    pagamento: any,
  ) => {
    // Criar uma transação bancária pendente para este pagamento
    const transacao = {
      id: `trans-${Date.now()}`,
      data: new Date(),
      descricao: `Transferência pendente - ${fornecedorNome} - ${pagamento.referencia}`,
      valor: pagamento.valor,
      tipo: "debito",
      reconciliado: false,
      pagamentoId: pagamentoId,
      metodo: "transferencia",
      origem: "manual",
      observacoes: "Transferência bancária pendente de reconciliação",
      referencia: pagamento.referencia,
    }

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

    // Adicionar a nova transação
    transacoes.push(transacao)

    // Salvar no localStorage
    localStorage.setItem("transacoesBancarias", JSON.stringify(transacoes))

    toast({
      title: "Transação bancária criada",
      description: "Uma transação bancária pendente foi criada para este pagamento.",
    })
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
        if (fundoManeioRef.current && typeof fundoManeioRef.current.adicionarMovimentoFundoManeio === "function") {
          const movimentoId = fundoManeioRef.current.adicionarMovimentoFundoManeio({
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

  const [isTransferenciaDialogOpen, setIsTransferenciaDialogOpen] = useState(false)
  const [pagamentoParaTransferencia, setPagamentoParaTransferencia] = useState<
    (Pagamento & { fornecedorNome: string; fornecedorId: string }) | null
  >(null)
  const [detalhesTransferencia, setDetalhesTransferencia] = useState({
    dataTransferencia: new Date(),
    referencia: "",
    observacoes: "",
  })

  const handleTransferenciaBancaria = () => {
    console.log("Iniciando transferência bancária...")

    // Check if context functions are available
    if (!updatePagamento) {
      console.error("Função updatePagamento não disponível")
      toast({
        title: "Erro ao processar transferência",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    if (!pagamentoParaTransferencia) {
      console.error("Pagamento para transferência não selecionado")
      toast({
        title: "Erro",
        description: "Pagamento não selecionado.",
        variant: "destructive",
      })
      return
    }

    try {
      // Atualizar o pagamento
      const pagamentoAtualizado = {
        ...pagamentoParaTransferencia,
        estado: "pago",
        dataPagamento: detalhesTransferencia.dataTransferencia,
        metodo: "transferência",
        observacoes: `${pagamentoParaTransferencia.observacoes ? pagamentoParaTransferencia.observacoes + " | " : ""}Transferência bancária realizada em ${format(detalhesTransferencia.dataTransferencia, "dd/MM/yyyy", { locale: pt })}${detalhesTransferencia.referencia ? ` | Ref: ${detalhesTransferencia.referencia}` : ""}${detalhesTransferencia.observacoes ? ` | ${detalhesTransferencia.observacoes}` : ""}`,
      }

      console.log("Atualizando pagamento:", pagamentoAtualizado)
      updatePagamento(pagamentoParaTransferencia.fornecedorId, pagamentoAtualizado)

      // Adicionar à reconciliação bancária
      const transacao = {
        id: `trans-${Date.now()}`,
        data: detalhesTransferencia.dataTransferencia,
        descricao: `Transferência bancária - ${pagamentoParaTransferencia.fornecedorNome} - ${pagamentoParaTransferencia.referencia}`,
        valor: pagamentoParaTransferencia.valor,
        tipo: "debito",
        reconciliado: false,
        pagamentoId: pagamentoParaTransferencia.id,
        metodo: "transferencia",
        origem: "manual",
        observacoes: detalhesTransferencia.observacoes || "Transferência bancária",
        referencia: detalhesTransferencia.referencia || pagamentoParaTransferencia.referencia,
      }

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

      // Adicionar a nova transação
      transacoes.push(transacao)

      // Salvar no localStorage
      localStorage.setItem("transacoesBancarias", JSON.stringify(transacoes))

      setIsTransferenciaDialogOpen(false)
      setPagamentoParaTransferencia(null)
      setDetalhesTransferencia({
        dataTransferencia: new Date(),
        referencia: "",
        observacoes: "",
      })

      toast({
        title: "Transferência realizada",
        description: "A transferência bancária foi registrada e o pagamento foi atualizado.",
      })
    } catch (error) {
      console.error("Erro ao processar transferência bancária:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a transferência. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleMesAnterior = () => {
    setMesSelecionado(subMonths(mesSelecionado, 1))
  }

  const handleProximoMes = () => {
    setMesSelecionado(addMonths(mesSelecionado, 1))
  }

  // Modifique a função getEstadoBadge para incluir o estado "parcialmente pago"
  const getEstadoBadge = (estado: string, valorPago?: number, valorTotal?: number) => {
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
      case "parcialmente pago":
        const percentPago = valorPago && valorTotal ? Math.round((valorPago / valorTotal) * 100) : 0
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Parcial ({percentPago}%)
            </Badge>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${percentPago}%` }}></div>
            </div>
          </div>
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
      case "transferência":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Transferência
          </Badge>
        )
      case "cheque":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Cheque
          </Badge>
        )
      case "débito direto":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Débito Direto
          </Badge>
        )
      case "fundo de maneio":
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
            Fundo de Maneio
          </Badge>
        )
      case "outro":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Outro
          </Badge>
        )
      default:
        return <Badge variant="outline">{metodo}</Badge>
    }
  }

  const handleExportPDF = (pagamento: any) => {
    toast({
      title: "Exportar PDF",
      description: "Funcionalidade em desenvolvimento.",
    })
  }

  const handleExportExcel = (pagamento: any) => {
    toast({
      title: "Exportar Excel",
      description: "Funcionalidade em desenvolvimento.",
    })
  }

  const marcarComoPago = (pagamento: any, fornecedorId: string) => {
    // Check if context functions are available
    if (!updatePagamento) {
      toast({
        title: "Erro ao marcar como pago",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    const dataPagamento = new Date()

    const pagamentoAtualizado = {
      ...pagamento,
      estado: "pago",
      dataPagamento: dataPagamento,
      historico: [
        ...(pagamento.historico || []),
        {
          id: uuidv4(),
          timestamp: new Date(),
          username: user?.username || "sistema",
          action: "update",
          details: `Pagamento marcado como pago por ${user?.username || "sistema"}`,
        },
      ],
    }

    updatePagamento(fornecedorId, pagamentoAtualizado)
    toast({
      title: "Pagamento atualizado",
      description: "O pagamento foi marcado como pago.",
    })
  }

  const handleEmitirCheque = (pagamento: any) => {
    setPagamentoParaCheque(pagamento)
    setIsEmitirChequeDialogOpen(true)
  }

  const handlePagarComFundoManeio = async () => {
    // Check if context functions are available
    if (!updatePagamento) {
      toast({
        title: "Erro ao pagar com fundo de maneio",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    if (!pagamentoParaFundoManeio) {
      toast({
        title: "Erro",
        description: "Pagamento não selecionado.",
        variant: "destructive",
      })
      return
    }

    try {
      // Criar um movimento no fundo de maneio
      const descricao =
        descricaoFundoManeio ||
        `Pagamento a ${pagamentoParaFundoManeio.fornecedorNome} - Ref: ${pagamentoParaFundoManeio.referencia}`

      // Verificar se a função existe antes de chamar
      if (fundoManeioRef.current && typeof fundoManeioRef.current.adicionarMovimentoFundoManeio === "function") {
        const movimentoId = fundoManeioRef.current.adicionarMovimentoFundoManeio({
          data: new Date(),
          tipo: "saida",
          valor: pagamentoParaFundoManeio.valor,
          descricao: descricao,
          pagamentoId: pagamentoParaFundoManeio.id,
          pagamentoReferencia: pagamentoParaFundoManeio.referencia,
          fornecedorNome: pagamentoParaFundoManeio.fornecedorNome,
        })

        if (movimentoId) {
          // Atualizar o pagamento com a referência ao movimento do fundo de maneio
          const pagamentoAtualizado = {
            ...pagamentoParaFundoManeio,
            estado: "pago",
            dataPagamento: new Date(),
            metodo: "fundo de maneio",
            fundoManeioId: movimentoId,
            historico: [
              ...(pagamentoParaFundoManeio.historico || []),
              {
                id: uuidv4(),
                timestamp: new Date(),
                username: user?.username || "sistema",
                action: "update",
                details: `Pagamento realizado com fundo de maneio por ${user?.username || "sistema"}`,
              },
            ],
          }

          updatePagamento(pagamentoParaFundoManeio.fornecedorId, pagamentoAtualizado)

          setIsFundoManeioDialogOpen(false)
          setPagamentoParaFundoManeio(null)
          setDescricaoFundoManeio("")

          toast({
            title: "Pagamento realizado",
            description: "O pagamento foi realizado com sucesso utilizando o fundo de maneio.",
          })
        } else {
          toast({
            title: "Aviso",
            description: "Não foi possível adicionar o movimento ao fundo de maneio. Verifique se há saldo suficiente.",
            variant: "warning",
          })
        }
      } else {
        console.warn("Função adicionarMovimentoFundoManeio não está disponível")
      }
    } catch (error) {
      console.error("Erro ao pagar com fundo de maneio:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao realizar o pagamento. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
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

    if (!pagamentoParaCheque) {
      toast({
        title: "Erro",
        description: "Pagamento não selecionado.",
        variant: "destructive",
      })
      return
    }

    if (!novoCheque.numero || !novoCheque.dataEmissao) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os detalhes do cheque.",
        variant: "destructive",
      })
      return
    }

    try {
      // Adicionar o cheque
      const chequeId = adicionarCheque({
        numero: novoCheque.numero,
        dataEmissao: novoCheque.dataEmissao,
        valor: pagamentoParaCheque.valor,
        beneficiario: pagamentoParaCheque.fornecedorNome,
        pagamentoId: pagamentoParaCheque.id,
        observacoes: `Cheque emitido para pagamento da referência ${pagamentoParaCheque.referencia}`,
      })

      if (chequeId) {
        // Atualizar o pagamento com a referência ao cheque
        const pagamentoAtualizado = {
          ...pagamentoParaCheque,
          chequeId: chequeId,
          historico: [
            ...(pagamentoParaCheque.historico || []),
            {
              id: uuidv4(),
              timestamp: new Date(),
              username: user?.username || "sistema",
              action: "update",
              details: `Cheque emitido por ${user?.username || "sistema"}`,
            },
          ],
        }

        updatePagamento(pagamentoParaCheque.fornecedorId, pagamentoAtualizado)

        setIsEmitirChequeDialogOpen(false)
        setPagamentoParaCheque(null)
        setNovoCheque({ numero: "", dataEmissao: new Date() })

        toast({
          title: "Cheque emitido",
          description: "O cheque foi emitido e associado ao pagamento.",
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível emitir o cheque. Por favor, tente novamente.",
        })
      }
    } catch (error) {
      console.error("Erro ao emitir cheque:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao emitir o cheque. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleDeletePagamento = (fornecedorId: string, pagamentoId: string) => {
    // Check if context functions are available
    if (!deletePagamento) {
      toast({
        title: "Erro ao eliminar pagamento",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    try {
      deletePagamento(fornecedorId, pagamentoId)
      toast({
        title: "Pagamento eliminado",
        description: "O pagamento foi eliminado com sucesso.",
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

  // Adicione estes estados no componente PagamentosTable
  const [isPagamentoParcialDialogOpen, setIsPagamentoParcialDialogOpen] = useState(false)
  const [pagamentoParaPagamentoParcial, setPagamentoParaPagamentoParcial] = useState<
    (Pagamento & { fornecedorNome: string; fornecedorId: string }) | null
  >(null)
  const [detalhesPagamentoParcial, setDetalhesPagamentoParcial] = useState({
    valor: 0,
    dataPagamento: new Date(),
    metodo: "transferência" as "transferência" | "cheque" | "débito direto" | "fundo de maneio" | "outro",
    referencia: "",
    observacoes: "",
  })

  // Adicione esta função para processar pagamentos parciais
  const handlePagamentoParcial = () => {
    console.log("Processando pagamento parcial...")

    // Check if context functions are available
    if (!updatePagamento) {
      console.error("Função updatePagamento não disponível")
      toast({
        title: "Erro ao processar pagamento parcial",
        description: "Serviço indisponível. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    if (!pagamentoParaPagamentoParcial) {
      console.error("Pagamento para pagamento parcial não selecionado")
      toast({
        title: "Erro",
        description: "Pagamento não selecionado.",
        variant: "destructive",
      })
      return
    }

    // Validar valor do pagamento parcial
    if (!detalhesPagamentoParcial.valor || detalhesPagamentoParcial.valor <= 0) {
      toast({
        title: "Erro",
        description: "O valor do pagamento parcial deve ser maior que zero",
        variant: "destructive",
      })
      return
    }

    // Verificar se o valor do pagamento parcial não excede o valor restante
    const pagamentosParciais = pagamentoParaPagamentoParcial.pagamentosParciais || []
    const valorJaPago = pagamentosParciais.reduce((total, p) => total + p.valor, 0)
    const valorRestante = pagamentoParaPagamentoParcial.valor - valorJaPago

    if (detalhesPagamentoParcial.valor > valorRestante) {
      toast({
        title: "Erro",
        description: `O valor do pagamento parcial não pode exceder o valor restante (${valorRestante.toFixed(2)} MZN).`,
        variant: "destructive",
      })
      return
    }

    try {
      // Criar um novo pagamento parcial
      const pagamentoParcial = {
        id: uuidv4(),
        dataPagamento: detalhesPagamentoParcial.dataPagamento,
        valor: detalhesPagamentoParcial.valor,
        metodo: detalhesPagamentoParcial.metodo,
        referencia: detalhesPagamentoParcial.referencia,
        observacoes: detalhesPagamentoParcial.observacoes,
        usuario: user?.username || "sistema",
      }

      // Atualizar o pagamento com o novo pagamento parcial
      const novoValorPago = valorJaPago + detalhesPagamentoParcial.valor
      const novoValorRestante = pagamentoParaPagamentoParcial.valor - novoValorPago

      // Determinar o novo estado do pagamento
      let novoEstado = pagamentoParaPagamentoParcial.estado
      if (novoValorRestante <= 0) {
        novoEstado = "pago"
      } else if (novoValorPago > 0) {
        novoEstado = "parcialmente pago"
      }

      const pagamentoAtualizado = {
        ...pagamentoParaPagamentoParcial,
        valorPago: novoValorPago,
        valorPendente: novoValorRestante,
        estado: novoEstado,
        dataPagamento: novoValorRestante <= 0 ? detalhesPagamentoParcial.dataPagamento : null,
        pagamentosParciais: [...(pagamentoParaPagamentoParcial.pagamentosParciais || []), pagamentoParcial],
        historico: [
          ...(pagamentoParaPagamentoParcial.historico || []),
          {
            id: uuidv4(),
            timestamp: new Date(),
            username: user?.username || "sistema",
            action: "update",
            details: `Pagamento parcial de ${detalhesPagamentoParcial.valor.toFixed(2)} MZN realizado por ${user?.username || "sistema"}`,
          },
        ],
      }

      // Atualizar o pagamento
      updatePagamento(pagamentoParaPagamentoParcial.fornecedorId, pagamentoAtualizado)

      // Adicionar à reconciliação bancária se for transferência ou cheque
      if (detalhesPagamentoParcial.metodo === "transferência") {
        const transacao = {
          id: `trans-parcial-${Date.now()}`,
          data: detalhesPagamentoParcial.dataPagamento,
          descricao: `Pagamento parcial (transferência) - ${pagamentoParaPagamentoParcial.fornecedorNome} - ${pagamentoParaPagamentoParcial.referencia}`,
          valor: detalhesPagamentoParcial.valor,
          tipo: "debito",
          reconciliado: false,
          pagamentoId: pagamentoParaPagamentoParcial.id,
          metodo: "transferencia",
          origem: "manual",
          observacoes: detalhesPagamentoParcial.observacoes || `Pagamento parcial via transferência bancária`,
          referencia: detalhesPagamentoParcial.referencia || pagamentoParaPagamentoParcial.referencia,
        }

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

        // Adicionar a nova transação
        transacoes.push(transacao)

        // Salvar no localStorage
        localStorage.setItem("transacoesBancarias", JSON.stringify(transacoes))
      } else if (detalhesPagamentoParcial.metodo === "cheque") {
        // Lógica para cheque (a ser implementada)
        console.log("Implementar lógica para cheque")
      } else if (detalhesPagamentoParcial.metodo === "fundo de maneio") {
        // Lógica para fundo de maneio (a ser implementada)
        console.log("Implementar lógica para fundo de maneio")
      }

      // Fechar o diálogo e limpar os estados
      setIsPagamentoParcialDialogOpen(false)
      setPagamentoParaPagamentoParcial(null)
      setDetalhesPagamentoParcial({
        valor: 0,
        dataPagamento: new Date(),
        metodo: "transferência" as "transferência" | "cheque" | "débito direto" | "fundo de maneio" | "outro",
        referencia: "",
        observacoes: "",
      })

      toast({
        title: "Pagamento parcial realizado",
        description: `Pagamento parcial de ${detalhesPagamentoParcial.valor.toFixed(2)} MZN realizado com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao processar pagamento parcial:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o pagamento parcial. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Adicione este diálogo no final do componente, antes do return final
  // Coloque-o junto com os outros diálogos

  // Adicione estes estados no componente PagamentosTable
  const [isOpcoesPagamentoDialogOpen, setOpcoesPagamentoDialogOpen] = useState(false)
  const [pagamentoParaOpcoesPagamento, setPagamentoParaOpcoesPagamento] = useState<
    (Pagamento & { fornecedorNome: string; fornecedorId: string }) | null
  >(null)

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
                  <Button onClick={handleAddPagamento} className="bg-red-600 hover:bg-red-700">
                    Adicionar Pagamento
                  </Button>
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
                      <TableCell className="text-right">
                        {pagamento.valor ? pagamento.valor.toFixed(2) : "0,00"} MZN
                      </TableCell>
                      <TableCell>{format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}</TableCell>
                      {/* Modifique a célula da tabela que mostra o estado para incluir os valores pagos e totais */}
                      <TableCell>{getEstadoBadge(pagamento.estado, pagamento.valorPago, pagamento.valor)}</TableCell>
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

                            {/* Opções de Pagamento Agrupadas */}
                            {(pagamento.estado === "pendente" ||
                              pagamento.estado === "atrasado" ||
                              pagamento.estado === "parcialmente pago") && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setOpcoesPagamentoDialogOpen(true)
                                  setPagamentoParaOpcoesPagamento(pagamento)
                                }}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Opções de Pagamento
                              </DropdownMenuItem>
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
              <Button onClick={handleEditPagamento} className="bg-red-600 hover:bg-red-700">
                Salvar Alterações
              </Button>
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
                    {pagamentoParaFundoManeio?.valor
                      ? pagamentoParaFundoManeio.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })
                      : "0,00 MZN"}
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
              <Button onClick={handlePagarComFundoManeio} className="bg-red-600 hover:bg-red-700">
                Confirmar Pagamento
              </Button>
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
                      {pagamentoParaCheque?.valor
                        ? pagamentoParaCheque.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })
                        : "0,00 MZN"}
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
                <Button onClick={handleSalvarCheque} className="bg-red-600 hover:bg-red-700">
                  Emitir Cheque
                </Button>
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
        <Dialog open={isPagamentoParcialDialogOpen} onOpenChange={setIsPagamentoParcialDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Pagamento Parcial</DialogTitle>
              <DialogDescription>
                Realize um pagamento parcial para {pagamentoParaPagamentoParcial?.referencia}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                <div>
                  <p className="font-medium">{pagamentoParaPagamentoParcial?.fornecedorNome}</p>
                  <p className="text-sm text-gray-500">
                    Valor pendente:{" "}
                    {pagamentoParaPagamentoParcial
                      ? (
                          pagamentoParaPagamentoParcial.valor - (pagamentoParaPagamentoParcial.valorPago || 0)
                        ).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })
                      : "0,00 MZN"}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="valor-parcial" className="text-sm font-medium mb-1 block">
                  Valor a pagar
                </Label>
                <Input
                  id="valor-parcial"
                  type="number"
                  step="0.01"
                  min="0"
                  max={
                    pagamentoParaPagamentoParcial
                      ? pagamentoParaPagamentoParcial.valor - (pagamentoParaPagamentoParcial.valorPago || 0)
                      : 0
                  }
                  value={detalhesPagamentoParcial.valor}
                  onChange={(e) =>
                    setDetalhesPagamentoParcial({
                      ...detalhesPagamentoParcial,
                      valor: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full"
                  placeholder="Valor a ser pago"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metodo-pagamento-parcial" className="text-sm font-medium mb-1 block">
                    Método
                  </Label>
                  <Select
                    value={detalhesPagamentoParcial.metodo}
                    onValueChange={(value) =>
                      setDetalhesPagamentoParcial({
                        ...detalhesPagamentoParcial,
                        metodo: value as any,
                      })
                    }
                  >
                    <SelectTrigger id="metodo-pagamento-parcial">
                      <SelectValue placeholder="Selecione" />
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

                <div>
                  <Label htmlFor="data-pagamento-parcial" className="text-sm font-medium mb-1 block">
                    Data
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {format(detalhesPagamentoParcial.dataPagamento, "dd/MM/yyyy", { locale: pt })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={detalhesPagamentoParcial.dataPagamento}
                        onSelect={(date) =>
                          setDetalhesPagamentoParcial({
                            ...detalhesPagamentoParcial,
                            dataPagamento: date || new Date(),
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="referencia-pagamento-parcial" className="text-sm font-medium mb-1 block">
                  Referência
                </Label>
                <Input
                  id="referencia-pagamento-parcial"
                  value={detalhesPagamentoParcial.referencia}
                  onChange={(e) =>
                    setDetalhesPagamentoParcial({
                      ...detalhesPagamentoParcial,
                      referencia: e.target.value,
                    })
                  }
                  className="w-full"
                  placeholder="Referência do pagamento"
                />
              </div>

              <div>
                <Label htmlFor="observacoes-pagamento-parcial" className="text-sm font-medium mb-1 block">
                  Observações
                </Label>
                <Textarea
                  id="observacoes-pagamento-parcial"
                  value={detalhesPagamentoParcial.observacoes}
                  onChange={(e) =>
                    setDetalhesPagamentoParcial({
                      ...detalhesPagamentoParcial,
                      observacoes: e.target.value,
                    })
                  }
                  className="w-full"
                  placeholder="Observações sobre o pagamento"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => setIsPagamentoParcialDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePagamentoParcial} className="bg-red-600 hover:bg-red-700">
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isOpcoesPagamentoDialogOpen} onOpenChange={setOpcoesPagamentoDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Opções de Pagamento</DialogTitle>
              <DialogDescription>Selecione uma opção para realizar o pagamento.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {user?.role === "admin" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    marcarComoPago(pagamentoParaOpcoesPagamento, pagamentoParaOpcoesPagamento.fornecedorId)
                    setOpcoesPagamentoDialogOpen(false)
                  }}
                >
                  Marcar como Pago
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  handleEmitirCheque(pagamentoParaOpcoesPagamento)
                  setOpcoesPagamentoDialogOpen(false)
                }}
              >
                Emitir Cheque
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPagamentoParaTransferencia(pagamentoParaOpcoesPagamento)
                  setDetalhesTransferencia({
                    dataTransferencia: new Date(),
                    referencia: "",
                    observacoes: "",
                  })
                  setIsTransferenciaDialogOpen(true)
                  setOpcoesPagamentoDialogOpen(false)
                }}
              >
                Transferência Bancária
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPagamentoParaPagamentoParcial(pagamentoParaOpcoesPagamento)
                  setDetalhesPagamentoParcial({
                    valor: 0,
                    dataPagamento: new Date(),
                    metodo: "transferência",
                    referencia: "",
                    observacoes: "",
                  })
                  setIsPagamentoParcialDialogOpen(true)
                  setOpcoesPagamentoDialogOpen(false)
                }}
              >
                Pagamento Parcial
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPagamentoParaFundoManeio(pagamentoParaOpcoesPagamento)
                  setIsFundoManeioDialogOpen(true)
                  setOpcoesPagamentoDialogOpen(false)
                }}
              >
                Pagar com Fundo de Maneio
              </Button>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpcoesPagamentoDialogOpen(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PrintLayout>
  )
}

