"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState } from "react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Check, X, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAppContext } from "@/contexts/AppContext"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/components/ui/use-toast"

interface WorkflowApprovalProps {
  pagamento: any
  isOpen: boolean
  onClose: () => void
}

export function WorkflowApproval({ pagamento, isOpen, onClose }: WorkflowApprovalProps) {
  const { user } = useAuth()
  const { updateWorkflowStatus, fornecedores, updatePagamento } = useAppContext()
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verificar se o usuário atual pode aprovar/rejeitar o pagamento atual
  const canApprove = () => {
    if (!pagamento || !pagamento.workflow || !user) return false

    // Se o workflow já foi concluído, não permitir mais aprovações/rejeições
    if (pagamento.workflow.status === "approved" || pagamento.workflow.status === "rejected") {
      return false
    }

    const currentStep = pagamento.workflow.currentStep
    const currentStepData = pagamento.workflow.steps[currentStep]

    if (!currentStepData) return false

    // Verificar se o usuário atual é o aprovador do passo atual
    // Ou se o usuário é admin (pode aprovar qualquer passo)
    return (
      user.role === "admin" ||
      currentStepData.username === user.username ||
      (currentStepData.role && currentStepData.role === user.role)
    )
  }

  // Corrigir as funções handleApprove e handleReject para permitir aprovar e rejeitar no workflow

  const handleApprove = async () => {
    if (!pagamento || !pagamento.workflow) {
      toast({
        title: "Erro",
        description: "Dados do pagamento não disponíveis.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Aprovando pagamento:", pagamento.id)

      // Obter o fornecedor e o pagamento atual
      const fornecedor = fornecedores.find((f) => f.id === pagamento.fornecedorId)
      if (!fornecedor) {
        toast({
          title: "Erro",
          description: "Fornecedor não encontrado.",
          variant: "destructive",
        })
        return
      }

      const pagamentoAtual = fornecedor.pagamentos.find((p) => p.id === pagamento.id)
      if (!pagamentoAtual) {
        toast({
          title: "Erro",
          description: "Pagamento não encontrado.",
          variant: "destructive",
        })
        return
      }

      // Atualizar o passo atual
      const updatedSteps = [...pagamento.workflow.steps]
      const currentStepIndex = pagamento.workflow.currentStep
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
        ...pagamento.workflow,
        steps: updatedSteps,
        currentStep: isLastStep ? currentStepIndex : nextStepIndex,
        status: isLastStep ? "approved" : "in_progress",
      }

      // Atualizar o pagamento
      const updatedPagamento = {
        ...pagamentoAtual,
        workflow: updatedWorkflow,
      }

      // Se for o último passo e estiver aprovado, marcar o pagamento como pago
      if (isLastStep && updatedWorkflow.status === "approved") {
        updatedPagamento.estado = "pago"
        updatedPagamento.dataPagamento = new Date()
      }

      // Atualizar o pagamento no fornecedor
      await updatePagamento(pagamento.fornecedorId, updatedPagamento)

      toast({
        title: "Pagamento aprovado",
        description: isLastStep
          ? "O pagamento foi totalmente aprovado."
          : "O pagamento foi aprovado e enviado para o próximo nível de aprovação.",
      })

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
    if (!pagamento || !pagamento.workflow) {
      toast({
        title: "Erro",
        description: "Dados do pagamento não disponíveis.",
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
      console.log("Rejeitando pagamento:", pagamento.id)

      // Obter o fornecedor e o pagamento atual
      const fornecedor = fornecedores.find((f) => f.id === pagamento.fornecedorId)
      if (!fornecedor) {
        toast({
          title: "Erro",
          description: "Fornecedor não encontrado.",
          variant: "destructive",
        })
        return
      }

      const pagamentoAtual = fornecedor.pagamentos.find((p) => p.id === pagamento.id)
      if (!pagamentoAtual) {
        toast({
          title: "Erro",
          description: "Pagamento não encontrado.",
          variant: "destructive",
        })
        return
      }

      // Atualizar o passo atual
      const updatedSteps = [...pagamento.workflow.steps]
      const currentStepIndex = pagamento.workflow.currentStep
      updatedSteps[currentStepIndex] = {
        ...updatedSteps[currentStepIndex],
        status: "rejected",
        date: new Date(),
        comments: comments,
      }

      // Atualizar o status do workflow
      const updatedWorkflow = {
        ...pagamento.workflow,
        steps: updatedSteps,
        status: "rejected",
      }

      // Atualizar o pagamento
      const updatedPagamento = {
        ...pagamentoAtual,
        workflow: updatedWorkflow,
      }

      // Atualizar o pagamento no fornecedor
      await updatePagamento(pagamento.fornecedorId, updatedPagamento)

      toast({
        title: "Pagamento rejeitado",
        description: "O pagamento foi rejeitado.",
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

  if (!pagamento || !pagamento.workflow) {
    return null
  }

  const getStepStatusIcon = (step: any, index: number) => {
    if (step.status === "approved") {
      return <Check className="h-5 w-5 text-green-500" />
    } else if (step.status === "rejected") {
      return <X className="h-5 w-5 text-red-500" />
    } else if (index === pagamento.workflow.currentStep) {
      return <Clock className="h-5 w-5 text-yellow-500" />
    } else {
      return <Clock className="h-5 w-5 text-gray-300" />
    }
  }

  const getStepStatusClass = (step: any, index: number) => {
    if (step.status === "approved") {
      return "text-green-700 bg-green-50 border-green-200"
    } else if (step.status === "rejected") {
      return "text-red-700 bg-red-50 border-red-200"
    } else if (index === pagamento.workflow.currentStep) {
      return "text-yellow-700 bg-yellow-50 border-yellow-200"
    } else {
      return "text-gray-500 bg-gray-50 border-gray-200"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aprovação de Pagamento</DialogTitle>
          <DialogDescription>
            Revise os detalhes do pagamento e aprove ou rejeite conforme necessário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Detalhes do pagamento */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Detalhes do Pagamento</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Referência:</p>
                <p className="font-medium">{pagamento.referencia}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fornecedor:</p>
                <p className="font-medium">{pagamento.fornecedorNome}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor:</p>
                <p className="font-medium">{pagamento.valor.toFixed(2)} MT</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vencimento:</p>
                <p className="font-medium">
                  {format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Departamento:</p>
                <p className="font-medium">{pagamento.departamento || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Descrição:</p>
                <p className="font-medium">{pagamento.descricao || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Status do workflow */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Status de Aprovação</h3>
            <div className="space-y-3">
              {pagamento.workflow.steps.map((step: any, index: number) => {
                const roleName = step.role === "financial_director" ? "Diretora Financeira" : "Reitor"
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-md border flex items-start ${getStepStatusClass(step, index)}`}
                  >
                    <div className="mr-3 mt-0.5">{getStepStatusIcon(step, index)}</div>
                    <div className="flex-1">
                      <div className="font-medium">
                        Passo {index + 1}: {roleName}
                      </div>
                      <div className="text-sm">Aprovador: {step.username}</div>
                      {step.date && (
                        <div className="text-sm">
                          Data: {format(new Date(step.date), "dd/MM/yyyy HH:mm", { locale: pt })}
                        </div>
                      )}
                      {step.comments && <div className="text-sm mt-1 italic">"{step.comments}"</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Comentários */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Comentários</h3>
            <Textarea
              placeholder="Adicione comentários sobre sua decisão (obrigatório para rejeição)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>

          {/* Aviso se não puder aprovar */}
          {!canApprove() && pagamento.workflow.status === "in_progress" && (
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-700">
                Você não tem permissão para aprovar ou rejeitar este pagamento neste momento. Apenas o aprovador
                designado para o passo atual pode realizar esta ação.
              </div>
            </div>
          )}

          {/* Aviso se workflow já concluído */}
          {(pagamento.workflow.status === "approved" || pagamento.workflow.status === "rejected") && (
            <div
              className={`p-3 rounded-md border flex items-start ${
                pagamento.workflow.status === "approved"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {pagamento.workflow.status === "approved" ? (
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              ) : (
                <X className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              )}
              <div className="text-sm">
                Este pagamento já foi {pagamento.workflow.status === "approved" ? "aprovado" : "rejeitado"} e o workflow
                foi concluído.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {canApprove() && (
            <>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                Rejeitar
              </Button>
              <Button onClick={handleApprove} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                Aprovar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

