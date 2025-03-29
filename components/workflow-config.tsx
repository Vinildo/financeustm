"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useAppContext } from "@/contexts/AppContext"
import { Plus, Trash, MoveUp, MoveDown } from "lucide-react"
import type { WorkflowConfig } from "@/types/workflow"

export function WorkflowConfig() {
  const { workflowConfig, updateWorkflowConfig, users } = useAppContext()
  const [config, setConfig] = useState<WorkflowConfig>(workflowConfig)

  useEffect(() => {
    setConfig(workflowConfig)
  }, [workflowConfig])

  const handleToggleEnabled = (enabled: boolean) => {
    setConfig({ ...config, enabled })
  }

  const handleAddStep = () => {
    setConfig({
      ...config,
      steps: [...config.steps, { role: "", username: "", title: "" }],
    })
  }

  const handleRemoveStep = (index: number) => {
    const newSteps = [...config.steps]
    newSteps.splice(index, 1)
    setConfig({ ...config, steps: newSteps })
  }

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === config.steps.length - 1)) {
      return
    }

    const newSteps = [...config.steps]
    const newIndex = direction === "up" ? index - 1 : index + 1
    const step = newSteps[index]
    newSteps[index] = newSteps[newIndex]
    newSteps[newIndex] = step

    setConfig({ ...config, steps: newSteps })
  }

  const handleUpdateStep = (index: number, field: string, value: string) => {
    const newSteps = [...config.steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setConfig({ ...config, steps: newSteps })
  }

  const handleSaveConfig = () => {
    // Validar se todos os passos têm os campos obrigatórios
    const isValid = config.steps.every((step) => step.role && step.username && step.title)

    if (!isValid) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios para cada passo do workflow.",
        variant: "destructive",
      })
      return
    }

    updateWorkflowConfig(config)
    toast({
      title: "Configuração salva",
      description: "A configuração do workflow foi salva com sucesso.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Workflow de Aprovação</CardTitle>
        <CardDescription>Configure o fluxo de aprovação para pagamentos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch id="workflow-enabled" checked={config.enabled} onCheckedChange={handleToggleEnabled} />
          <Label htmlFor="workflow-enabled">Habilitar workflow de aprovação</Label>
        </div>

        {config.enabled && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Passos de Aprovação</h3>
              <Button onClick={handleAddStep} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Passo
              </Button>
            </div>

            {config.steps.map((step, index) => (
              <div key={index} className="border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Passo {index + 1}</h4>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveStep(index, "up")}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveStep(index, "down")}
                      disabled={index === config.steps.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStep(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`step-${index}-title`}>Título</Label>
                    <Input
                      id={`step-${index}-title`}
                      value={step.title}
                      onChange={(e) => handleUpdateStep(index, "title", e.target.value)}
                      placeholder="Ex: Diretora Financeira"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`step-${index}-role`}>Função</Label>
                    <Input
                      id={`step-${index}-role`}
                      value={step.role}
                      onChange={(e) => handleUpdateStep(index, "role", e.target.value)}
                      placeholder="Ex: financial_director"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`step-${index}-username`}>Usuário</Label>
                    <Input
                      id={`step-${index}-username`}
                      value={step.username}
                      onChange={(e) => handleUpdateStep(index, "username", e.target.value)}
                      placeholder="Ex: diretora.financeira"
                      list={`users-${index}`}
                    />
                    <datalist id={`users-${index}`}>
                      {users.map((user) => (
                        <option key={user.id} value={user.username}>
                          {user.fullName}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveConfig}>Salvar Configuração</Button>
      </CardFooter>
    </Card>
  )
}

