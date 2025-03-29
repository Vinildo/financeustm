"use client"

import type React from "react"

import { useState } from "react"
import { SupabaseInitializer } from "@/components/supabase-initializer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SupabaseService } from "@/services/supabase-service"
import { useToast } from "@/components/ui/use-toast"
import { Download, Upload, RefreshCw } from "lucide-react"

export default function SupabaseConfigPage() {
  const { toast } = useToast()
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupData, setBackupData] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("initialize")

  // Função para fazer backup dos dados
  const handleBackup = async () => {
    try {
      setIsBackingUp(true)
      const { data, error, timestamp } = await SupabaseService.backupData()

      if (error) {
        throw new Error(error.message || "Erro ao fazer backup dos dados.")
      }

      if (!data) {
        throw new Error("Nenhum dado foi retornado pelo backup.")
      }

      // Converter os dados para JSON e adicionar timestamp
      const backupJson = JSON.stringify(
        {
          data,
          timestamp,
          version: "1.0",
        },
        null,
        2,
      )

      // Criar um blob e um link para download
      const blob = new Blob([backupJson], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `backup-tesouraria-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()

      // Limpar
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

      toast({
        title: "Backup concluído",
        description: "Os dados foram salvos com sucesso.",
        variant: "default",
      })

      setBackupData(backupJson)
    } catch (err: any) {
      console.error("Erro ao fazer backup:", err)
      toast({
        title: "Erro ao fazer backup",
        description: err.message || "Ocorreu um erro ao fazer backup dos dados.",
        variant: "destructive",
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  // Função para restaurar dados de um backup
  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsRestoring(true)

      // Ler o arquivo
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          const backupData = JSON.parse(content)

          // Verificar se o backup é válido
          if (!backupData.data || !backupData.timestamp) {
            throw new Error("O arquivo de backup é inválido.")
          }

          // Restaurar os dados
          const { success, error } = await SupabaseService.restoreData(backupData.data)

          if (!success) {
            throw new Error(error?.message || "Erro ao restaurar os dados.")
          }

          toast({
            title: "Restauração concluída",
            description: "Os dados foram restaurados com sucesso.",
            variant: "default",
          })
        } catch (err: any) {
          console.error("Erro ao restaurar dados:", err)
          toast({
            title: "Erro ao restaurar dados",
            description: err.message || "Ocorreu um erro ao restaurar os dados.",
            variant: "destructive",
          })
        } finally {
          setIsRestoring(false)
        }
      }

      reader.readAsText(file)
    } catch (err: any) {
      console.error("Erro ao ler arquivo de backup:", err)
      toast({
        title: "Erro ao ler arquivo",
        description: err.message || "Ocorreu um erro ao ler o arquivo de backup.",
        variant: "destructive",
      })
      setIsRestoring(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Configuração do Supabase</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="initialize">Inicialização</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="restore">Restauração</TabsTrigger>
        </TabsList>

        <TabsContent value="initialize" className="space-y-4">
          <SupabaseInitializer />
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup de Dados</CardTitle>
              <CardDescription>Faça um backup de todos os dados do sistema para um arquivo JSON.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleBackup} disabled={isBackingUp} className="w-full">
                {isBackingUp ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Fazendo backup...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Fazer Backup
                  </>
                )}
              </Button>

              {backupData && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <p className="text-sm text-gray-500 mb-2">Backup realizado com sucesso!</p>
                  <p className="text-xs text-gray-400">O download do arquivo de backup deve começar automaticamente.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restore" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Restauração de Dados</CardTitle>
              <CardDescription>Restaure os dados do sistema a partir de um arquivo de backup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button as="label" htmlFor="restore-file" disabled={isRestoring} className="w-full cursor-pointer">
                  {isRestoring ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Restaurando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Selecionar Arquivo de Backup
                    </>
                  )}
                </Button>
                <input
                  id="restore-file"
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  disabled={isRestoring}
                  className="hidden"
                />
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700 font-medium">Atenção!</p>
                <p className="text-xs text-yellow-600 mt-1">
                  A restauração substituirá todos os dados atuais do sistema. Esta ação não pode ser desfeita.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

