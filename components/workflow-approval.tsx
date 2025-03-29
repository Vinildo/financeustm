"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { useAppContext } from "@/contexts/AppContext"
import type { Pagamento } from "@/types/fornecedor"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Check, X, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface WorkflowApprovalProps {
  pagamento: Pagamento & { fornecedorNome: string; fornecedorId: string }
  isOpen: boolean
  onClose: () => void
}

export function WorkflowApproval({ pagamento, isOpen, onClose }: WorkflowApprovalProps) {
  const { updatePagamento, currentUser, addNotification, fornecedores } = useAppContext()
  const [comments, setComments] = useState("")
  const [localPagamento, setLocalPagamento] = useState<
    (Pagamento & { fornecedorNome: string; fornecedorId: string }) | null
  >(null)

  // Sincronizar o pagamento local com o pagamento recebido por props
  useEffect(() => {
    if (pagamento) {
      setLocalPagamento(pagamento)
    }
  }, [pagamento])

  // Verificar se o pagamento existe no fornecedor atual
  useEffect(() => {
    if (pagamento && fornecedores) {
      const fornecedor = fornecedores.find((f) => f.id === pagamento.fornecedorId)
      if (fornecedor) {
        const pagamentoAtualizado = fornecedor.pagamentos.find((p) => p.id === pagamento.id)
        if (pagamentoAtualizado) {
          setLocalPagamento({
            ...pagamentoAtualizado,
            fornecedorId: pagamento.fornecedorId,
            fornecedorNome: pagamento.fornecedorNome,
          })
        }
      }
    }
  }, [pagamento, fornecedores])

  if (!localPagamento || !localPagamento.workflow) {
    return null
  }

  const currentStepIndex = localPagamento.workflow.currentStep
  const currentStep = localPagamento.workflow.steps[currentStepIndex]

  // Verificar se o usuário atual pode aprovar este passo
  const canApprove =
    currentUser &&
    (currentUser.username === currentStep?.username ||
      currentUser.role === currentStep?.role ||
      currentUser.role === "admin")

  const handleApprove = async () => {
    if (!canApprove) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para aprovar este pagamento.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Iniciando aprovação do pagamento:", localPagamento.id)

      // Verificar se o pagamento ainda existe no fornecedor
      const fornecedor = fornecedores.find((f) => f.id === localPagamento.fornecedorId)
      if (!fornecedor) {
        console.error("Fornecedor não encontrado:", localPagamento.fornecedorId)
        toast({
          title: "Erro",
          description: "Fornecedor não encontrado. Por favor, atualize a página e tente novamente.",
          variant: "destructive",
        })
        return
      }

      const pagamentoAtual = fornecedor.pagamentos.find((p) => p.id === localPagamento.id)
      if (!pagamentoAtual) {
        console.error("Pagamento não encontrado no fornecedor:", localPagamento.id)
        toast({
          title: "Erro",
          description: "Pagamento não encontrado. Por favor, atualize a página e tente novamente.",
          variant: "destructive",
        })
        return
      }

      // Atualizar o passo atual
      const updatedSteps = [...localPagamento.workflow!.steps]
      updatedSteps[currentStepIndex] = {
        ...updatedSteps[currentStepIndex],
        status: "approved",
        date: new Date(),
        comments: comments.trim() || undefined,
      }

      // Verificar se há mais passos
      const nextStepIndex = currentStepIndex + 1
      const isLastStep = nextStepIndex >= updatedSteps.length

      // Atualizar o status do workflow
      const updatedWorkflow = {
        ...localPagamento.workflow!,
        steps: updatedSteps,
        currentStep: isLastStep ? currentStepIndex : nextStepIndex,
        status: isLastStep ? "approved" : "in_progress",
      }

      // Atualizar o pagamento
      const updatedPagamento = {
        ...pagamentoAtual,
        workflow: updatedWorkflow,
      }

      // Se for o último passo (Reitor) e estiver aprovado, marcar o pagamento como pago
      if (isLastStep && currentStep.role === "rector") {
        updatedPagamento.estado = "pago"
        updatedPagamento.dataPagamento = new Date()

        toast({
          title: "Pagamento aprovado e marcado como pago",
          description: "O pagamento foi totalmente aprovado pelo Reitor e foi automaticamente marcado como pago.",
        })
      }

      console.log("Atualizando pagamento:", updatedPagamento)
      await updatePagamento(localPagamento.fornecedorId, updatedPagamento)

      // Notificar o próximo aprovador, se houver
      if (!isLastStep) {
        const nextStep = updatedSteps[nextStepIndex]

        // Mensagem específica para o Reitor quando a Diretora Financeira aprovou
        const message =
          currentStepIndex === 0
            ? `O pagamento ${localPagamento.referencia} para ${localPagamento.fornecedorNome} no valor de ${localPagamento.valor.toFixed(2)} MT foi aprovado pela Diretora Financeira e aguarda sua aprovação final.`
            : `O pagamento ${localPagamento.referencia} para ${localPagamento.fornecedorNome} no valor de ${localPagamento.valor.toFixed(2)} MT aguarda sua aprovação.`

        addNotification({
          userId: nextStep.username,
          title: "Pagamento aguardando aprovação",
          message: message,
          type: "payment_approval",
          relatedId: localPagamento.id,
          actionUrl: `/dashboard?tab=workflow`,
        })
      } else {
        // Notificar que o pagamento foi totalmente aprovado
        addNotification({
          userId: "all", // Notificar todos os usuários relevantes
          title: "Pagamento totalmente aprovado",
          message: `O pagamento ${localPagamento.referencia} para ${localPagamento.fornecedorNome} foi aprovado pelo Reitor e está pronto para ser processado.`,
          type: "payment_approved",
          relatedId: localPagamento.id,
        })

        // Atualizar o estado do pagamento para "aprovado" quando o fluxo de aprovação estiver completo
        const fullyApprovedPagamento = {
          ...updatedPagamento,
          estado: "pago",
          dataPagamento: new Date(),
        }

        await updatePagamento(localPagamento.fornecedorId, fullyApprovedPagamento)
      }

      if (!isLastStep) {
        toast({
          title: "Pagamento aprovado",
          description: "O pagamento foi aprovado e enviado para o próximo nível de aprovação.",
        })
      }

      onClose()
    } catch (error) {
      console.error("Erro ao aprovar pagamento:", error)
      toast({
        title: "Erro ao aprovar pagamento",
        description: "Ocorreu um erro ao aprovar o pagamento. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleReject = async () => {
    if (!canApprove) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para rejeitar este pagamento.",
        variant: "destructive",
      })
      return
    }

    if (!comments.trim()) {
      toast({
        title: "Comentário obrigatório",
        description: "Por favor, forneça um motivo para a rejeição do pagamento.",
        variant: "destructive",
      })
      return
    }

    try {
      // Verificar se o pagamento ainda existe no fornecedor
      const fornecedor = fornecedores.find((f) => f.id === localPagamento.fornecedorId)
      if (!fornecedor) {
        toast({
          title: "Erro",
          description: "Fornecedor não encontrado. Por favor, atualize a página e tente novamente.",
          variant: "destructive",
        })
        return
      }

      const pagamentoAtual = fornecedor.pagamentos.find((p) => p.id === localPagamento.id)
      if (!pagamentoAtual) {
        toast({
          title: "Erro",
          description: "Pagamento não encontrado. Por favor, atualize a página e tente novamente.",
          variant: "destructive",
        })
        return
      }

      // Atualizar o passo atual
      const updatedSteps = [...localPagamento.workflow!.steps]
      updatedSteps[currentStepIndex] = {
        ...updatedSteps[currentStepIndex],
        status: "rejected",
        date: new Date(),
        comments: comments,
      }

      // Atualizar o status do workflow
      const updatedWorkflow = {
        ...localPagamento.workflow!,
        steps: updatedSteps,
        status: "rejected",
      }

      // Atualizar o pagamento
      const updatedPagamento = {
        ...pagamentoAtual,
        workflow: updatedWorkflow,
      }

      await updatePagamento(localPagamento.fornecedorId, updatedPagamento)

      // Notificar o solicitante que o pagamento foi rejeitado
      addNotification({
        userId: "all", // Notificar todos os usuários relevantes
        title: "Pagamento rejeitado",
        message: `O pagamento ${localPagamento.referencia} para ${localPagamento.fornecedorNome} foi rejeitado. Motivo: ${comments}`,
        type: "payment_rejected",
        relatedId: localPagamento.id,
      })

      toast({
        title: "Pagamento rejeitado",
        description: "O pagamento foi rejeitado e o solicitante foi notificado.",
      })

      onClose()
    } catch (error) {
      console.error("Erro ao rejeitar pagamento:", error)
      toast({
        title: "Erro ao rejeitar pagamento",
        description: "Ocorreu um erro ao rejeitar o pagamento. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const getStepStatusBadge = (status: string) => {
    switch (status) {
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
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center">
            <Clock className="mr-1 h-3 w-3" /> Pendente
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aprovação de Pagamento</DialogTitle>
          <DialogDescription>
            Revise os detalhes do pagamento e aprove ou rejeite conforme necessário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Detalhes do Pagamento</h3>
            <div className="space-y-1">
              <p>
                <span className="font-medium">Referência:</span> {localPagamento.referencia}
              </p>
              <p>
                <span className="font-medium">Fornecedor:</span> {localPagamento.fornecedorNome}
              </p>
              <p>
                <span className="font-medium">Valor:</span> {localPagamento.valor.toFixed(2)} MT
              </p>
              <p>
                <span className="font-medium">Vencimento:</span>{" "}
                {format(new Date(localPagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}
              </p>
              <p>
                <span className="font-medium">Departamento:</span> {localPagamento.departamento}
              </p>
              <p>
                <span className="font-medium">Descrição:</span> {localPagamento.descricao}
              </p>
              {localPagamento.observacoes && (
                <p>
                  <span className="font-medium">Observações:</span> {localPagamento.observacoes}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Fluxo de Aprovação</h3>
            <div className="space-y-2">
              {localPagamento.workflow.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-md border ${index === currentStepIndex ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{step.role}</p>
                      <p className="text-sm text-gray-500">{step.username}</p>
                    </div>
                    <div>{getStepStatusBadge(step.status)}</div>
                  </div>
                  {step.date && (
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(step.date), "dd/MM/yyyy HH:mm", { locale: pt })}
                    </p>
                  )}
                  {step.comments && <p className="text-sm mt-1 bg-gray-100 p-2 rounded">{step.comments}</p>}
                </div>
              ))}
            </div>
          </div>

          {canApprove && currentStep.status === "pending" && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Sua Decisão</h3>
              <Textarea
                placeholder="Adicione comentários ou observações (obrigatório para rejeição)"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <div className="space-x-2">
                  <Button variant="destructive" onClick={handleReject}>
                    <X className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
                  <Button variant="default" onClick={handleApprove}>
                    <Check className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {(!canApprove || currentStep.status !== "pending") && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

