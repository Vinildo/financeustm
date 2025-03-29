"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/contexts/AppContext"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { WorkflowApproval } from "./workflow-approval"
import { Badge } from "@/components/ui/badge"
import { Check, X, Clock, AlertCircle } from "lucide-react"

export function WorkflowDashboard() {
  const { fornecedores, currentUser } = useAppContext()
  const [selectedPagamento, setSelectedPagamento] = useState<any>(null)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)

  // Obter todos os pagamentos com informações do fornecedor
  const allPagamentos = fornecedores.flatMap((fornecedor) =>
    fornecedor.pagamentos.map((pagamento) => ({
      ...pagamento,
      fornecedorNome: fornecedor.nome,
      fornecedorId: fornecedor.id,
    })),
  )

  // Filtrar pagamentos pendentes para o usuário atual
  const pendingPagamentos = allPagamentos.filter(
    (pagamento) =>
      pagamento.workflow &&
      pagamento.workflow.status === "in_progress" &&
      pagamento.workflow.steps[pagamento.workflow.currentStep] &&
      (pagamento.workflow.steps[pagamento.workflow.currentStep].username === currentUser?.username ||
        pagamento.workflow.steps[pagamento.workflow.currentStep].role === currentUser?.role ||
        currentUser?.role === "admin"),
  )

  // Pagamentos aprovados pelo usuário atual
  const approvedPagamentos = allPagamentos.filter(
    (pagamento) =>
      pagamento.workflow &&
      pagamento.workflow.steps.some(
        (step) =>
          (step.username === currentUser?.username || step.role === currentUser?.role) && step.status === "approved",
      ),
  )

  // Pagamentos rejeitados pelo usuário atual
  const rejectedPagamentos = allPagamentos.filter(
    (pagamento) =>
      pagamento.workflow &&
      pagamento.workflow.steps.some(
        (step) =>
          (step.username === currentUser?.username || step.role === currentUser?.role) && step.status === "rejected",
      ),
  )

  const handleOpenApprovalDialog = (pagamento: any) => {
    setSelectedPagamento(pagamento)
    setIsApprovalDialogOpen(true)
  }

  const handleCloseApprovalDialog = () => {
    setIsApprovalDialogOpen(false)
    setSelectedPagamento(null)
  }

  const getStatusBadge = (status: string) => {
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
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center">
            <Clock className="mr-1 h-3 w-3" /> Em Aprovação
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center">
            <AlertCircle className="mr-1 h-3 w-3" /> {status}
          </Badge>
        )
    }
  }

  const getCurrentApproverInfo = (pagamento: any) => {
    if (!pagamento.workflow) return null

    const currentStep = pagamento.workflow.steps[pagamento.workflow.currentStep]
    if (!currentStep) return null

    // Determinar o nome do papel atual
    let roleName = currentStep.role
    if (currentStep.role === "financial_director") {
      roleName = "Diretora Financeira"
    } else if (currentStep.role === "rector") {
      roleName = "Reitor"
    }

    return `Aguardando: ${roleName} (${currentStep.username})`
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3 bg-red-600">
          <TabsTrigger
            value="pending"
            className="text-white data-[state=active]:bg-red-800 data-[state=active]:text-white"
          >
            Pendentes ({pendingPagamentos.length})
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="text-white data-[state=active]:bg-red-800 data-[state=active]:text-white"
          >
            Aprovados ({approvedPagamentos.length})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="text-white data-[state=active]:bg-red-800 data-[state=active]:text-white"
          >
            Rejeitados ({rejectedPagamentos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingPagamentos.length > 0 ? (
            pendingPagamentos.map((pagamento) => (
              <Card key={pagamento.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{pagamento.referencia}</CardTitle>
                      <CardDescription>{pagamento.fornecedorNome}</CardDescription>
                    </div>
                    {getStatusBadge(pagamento.workflow.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
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
                      <p className="font-medium">{pagamento.departamento}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Descrição:</p>
                      <p className="font-medium">{pagamento.descricao}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Status de Aprovação:</p>
                      <p className="font-medium">{getCurrentApproverInfo(pagamento)}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleOpenApprovalDialog(pagamento)} className="w-full">
                    Revisar e Aprovar
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Não há pagamentos pendentes para sua aprovação.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-4">
          {approvedPagamentos.length > 0 ? (
            approvedPagamentos.map((pagamento) => (
              <Card key={pagamento.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{pagamento.referencia}</CardTitle>
                      <CardDescription>{pagamento.fornecedorNome}</CardDescription>
                    </div>
                    {getStatusBadge(pagamento.workflow.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
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
                      <p className="font-medium">{pagamento.departamento}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Descrição:</p>
                      <p className="font-medium">{pagamento.descricao}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => handleOpenApprovalDialog(pagamento)} className="w-full">
                    Ver Detalhes
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Não há pagamentos aprovados por você.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-4">
          {rejectedPagamentos.length > 0 ? (
            rejectedPagamentos.map((pagamento) => (
              <Card key={pagamento.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{pagamento.referencia}</CardTitle>
                      <CardDescription>{pagamento.fornecedorNome}</CardDescription>
                    </div>
                    {getStatusBadge(pagamento.workflow.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
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
                      <p className="font-medium">{pagamento.departamento}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Descrição:</p>
                      <p className="font-medium">{pagamento.descricao}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => handleOpenApprovalDialog(pagamento)} className="w-full">
                    Ver Detalhes
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Não há pagamentos rejeitados por você.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {selectedPagamento && (
        <WorkflowApproval
          pagamento={selectedPagamento}
          isOpen={isApprovalDialogOpen}
          onClose={handleCloseApprovalDialog}
        />
      )}
    </div>
  )
}

