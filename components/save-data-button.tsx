"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function SaveDataButton() {
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveData = () => {
    setIsSaving(true)

    try {
      // Forçar um evento de salvamento
      const currentData = {
        fornecedores: JSON.parse(localStorage.getItem("fornecedores") || "[]"),
        users: JSON.parse(localStorage.getItem("users") || "[]"),
        fundosManejo: JSON.parse(localStorage.getItem("fundosManejo") || "[]"),
        receitas: JSON.parse(localStorage.getItem("receitas") || "[]"),
        notifications: JSON.parse(localStorage.getItem("notifications") || "[]"),
        workflowConfig: JSON.parse(localStorage.getItem("workflowConfig") || "{}"),
      }

      // Salvar novamente para garantir
      Object.entries(currentData).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value))
      })

      toast({
        title: "Dados salvos com sucesso",
        description: "Todas as operações foram guardadas localmente.",
      })
    } catch (error) {
      console.error("Erro ao salvar dados:", error)
      toast({
        title: "Erro ao salvar dados",
        description: "Ocorreu um erro ao tentar guardar os dados localmente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSaveData}
      disabled={isSaving}
      className="flex items-center gap-2"
    >
      <Save className="h-4 w-4" />
      {isSaving ? "Salvando..." : "Salvar Dados"}
    </Button>
  )
}

