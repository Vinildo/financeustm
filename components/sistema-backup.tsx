"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast" // Corrigido: importando toast diretamente
import { Download, Upload, Mail, FileSpreadsheet, Database } from "lucide-react"
import { useAppContext } from "@/contexts/AppContext"
import { formatDateTime } from "@/lib/utils"

export function SistemaBackup() {
  // Removido: const { toast } = useToast()
  const { fornecedores, users, fundosManejo, receitas, notifications, workflowConfig } = useAppContext()
  const [emailDestino, setEmailDestino] = useState("")
  const [arquivoBackup, setArquivoBackup] = useState<File | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Função para gerar o backup completo
  const gerarBackupCompleto = () => {
    try {
      setIsExporting(true)

      // Coletar todos os dados do localStorage
      const dadosBackup = {
        fornecedores,
        users,
        fundosManejo,
        receitas,
        notifications,
        workflowConfig,
        cheques: JSON.parse(localStorage.getItem("cheques") || "[]"),
        reconciliacaoBancaria: JSON.parse(localStorage.getItem("reconciliacaoBancaria") || "[]"),
        reconciliacaoInterna: JSON.parse(localStorage.getItem("reconciliacaoInterna") || "[]"),
        timestamp: new Date().toISOString(),
        versao: "1.0",
      }

      // Converter para JSON
      const dadosJSON = JSON.stringify(dadosBackup, null, 2)

      // Criar blob e link para download
      const blob = new Blob([dadosJSON], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `backup_tesouraria_${formatDateTime(new Date()).replace(/[/:]/g, "-")}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Backup gerado com sucesso",
        description: "O arquivo de backup foi baixado para o seu computador.",
      })
    } catch (error) {
      console.error("Erro ao gerar backup:", error)
      toast({
        title: "Erro ao gerar backup",
        description: "Ocorreu um erro ao gerar o arquivo de backup.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Função para exportar dados para Excel
  const exportarExcel = (tipo: "fornecedores" | "pagamentos" | "receitas" | "cheques") => {
    try {
      setIsExporting(true)

      let dadosCSV = ""
      let nomeArquivo = ""

      // Preparar dados de acordo com o tipo
      switch (tipo) {
        case "fornecedores":
          dadosCSV = "ID,Nome\n" + fornecedores.map((f) => `"${f.id}","${f.nome}"`).join("\n")
          nomeArquivo = "fornecedores"
          break

        case "pagamentos":
          dadosCSV =
            "ID,Fornecedor,Referência,Valor (MZN),Data Vencimento,Estado\n" +
            fornecedores
              .flatMap((f) =>
                f.pagamentos.map(
                  (p) => `"${p.id}","${f.nome}","${p.referencia}","${p.valor}","${p.dataVencimento}","${p.estado}"`,
                ),
              )
              .join("\n")
          nomeArquivo = "pagamentos"
          break

        case "receitas":
          dadosCSV =
            "ID,Descrição,Valor (MZN),Data,Categoria\n" +
            receitas.map((r) => `"${r.id}","${r.descricao}","${r.valor}","${r.data}","${r.categoria}"`).join("\n")
          nomeArquivo = "receitas"
          break

        case "cheques":
          const cheques = JSON.parse(localStorage.getItem("cheques") || "[]")
          dadosCSV =
            "Número,Banco,Valor (MZN),Data Emissão,Beneficiário,Estado\n" +
            cheques
              .map(
                (c: any) =>
                  `"${c.numero}","${c.banco}","${c.valor}","${c.dataEmissao}","${c.beneficiario}","${c.estado}"`,
              )
              .join("\n")
          nomeArquivo = "cheques"
          break
      }

      // Criar blob e link para download
      const blob = new Blob([dadosCSV], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${nomeArquivo}_${formatDateTime(new Date()).replace(/[/:]/g, "-")}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportação concluída",
        description: `Os dados de ${nomeArquivo} foram exportados com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Função para restaurar backup
  const restaurarBackup = async () => {
    if (!arquivoBackup) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo de backup para restaurar.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRestoring(true)

      // Ler o arquivo
      const texto = await arquivoBackup.text()
      const dados = JSON.parse(texto)

      // Verificar se o arquivo tem o formato esperado
      if (!dados.fornecedores || !dados.users) {
        throw new Error("Formato de arquivo inválido")
      }

      // Confirmar com o usuário
      if (!window.confirm("Esta ação substituirá todos os dados atuais. Deseja continuar?")) {
        return
      }

      // Restaurar dados no localStorage
      localStorage.setItem("fornecedores", JSON.stringify(dados.fornecedores))
      localStorage.setItem("users", JSON.stringify(dados.users))
      localStorage.setItem("fundosManejo", JSON.stringify(dados.fundosManejo || []))
      localStorage.setItem("receitas", JSON.stringify(dados.receitas || []))
      localStorage.setItem("notifications", JSON.stringify(dados.notifications || []))
      localStorage.setItem("workflowConfig", JSON.stringify(dados.workflowConfig || {}))
      localStorage.setItem("cheques", JSON.stringify(dados.cheques || []))
      localStorage.setItem("reconciliacaoBancaria", JSON.stringify(dados.reconciliacaoBancaria || []))
      localStorage.setItem("reconciliacaoInterna", JSON.stringify(dados.reconciliacaoInterna || []))

      toast({
        title: "Backup restaurado com sucesso",
        description: "Os dados foram restaurados. A página será recarregada.",
      })

      // Recarregar a página para aplicar as mudanças
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Erro ao restaurar backup:", error)
      toast({
        title: "Erro ao restaurar backup",
        description: "O arquivo selecionado pode estar corrompido ou em formato inválido.",
        variant: "destructive",
      })
    } finally {
      setIsRestoring(false)
    }
  }

  // Função para enviar backup por email
  const enviarBackupPorEmail = () => {
    if (!emailDestino) {
      toast({
        title: "Email não informado",
        description: "Por favor, informe um endereço de email válido.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSending(true)

      // Simulação de envio de email (em uma aplicação real, isso seria feito no servidor)
      setTimeout(() => {
        toast({
          title: "Email enviado com sucesso",
          description: `O backup foi enviado para ${emailDestino}.`,
        })
        setIsSending(false)
      }, 2000)

      // Nota: Em uma implementação real, você precisaria de um backend para processar o envio de emails
      console.log("Enviando backup para:", emailDestino)
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      toast({
        title: "Erro ao enviar email",
        description: "Ocorreu um erro ao tentar enviar o backup por email.",
        variant: "destructive",
      })
      setIsSending(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Sistema de Backup e Recuperação</h1>

      <Tabs defaultValue="backup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backup">Backup de Dados</TabsTrigger>
          <TabsTrigger value="export">Exportação</TabsTrigger>
          <TabsTrigger value="restore">Restauração</TabsTrigger>
        </TabsList>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup Completo do Sistema</CardTitle>
              <CardDescription>
                Gere um arquivo de backup contendo todos os dados do sistema para armazenamento seguro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-gray-500" />
                <span>O backup inclui: fornecedores, pagamentos, usuários, receitas, cheques e configurações.</span>
              </div>

              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="font-medium mb-2">Enviar backup por email</h3>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email de destino</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@dominio.com"
                    value={emailDestino}
                    onChange={(e) => setEmailDestino(e.target.value)}
                  />
                  <Button variant="outline" className="mt-2" onClick={enviarBackupPorEmail} disabled={isSending}>
                    {isSending ? (
                      <>Enviando...</>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar por Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={gerarBackupCompleto} disabled={isExporting} className="w-full">
                {isExporting ? (
                  <>Gerando Backup...</>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Gerar Backup Completo
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Exportação de Dados</CardTitle>
              <CardDescription>Exporte dados específicos do sistema para análise ou relatórios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => exportarExcel("fornecedores")} disabled={isExporting}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar Fornecedores
                </Button>

                <Button variant="outline" onClick={() => exportarExcel("pagamentos")} disabled={isExporting}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar Pagamentos
                </Button>

                <Button variant="outline" onClick={() => exportarExcel("receitas")} disabled={isExporting}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar Receitas
                </Button>

                <Button variant="outline" onClick={() => exportarExcel("cheques")} disabled={isExporting}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar Cheques
                </Button>
              </div>

              <div className="border rounded-md p-4 bg-gray-50 mt-4">
                <h3 className="font-medium mb-2">Enviar exportação por email</h3>
                <div className="grid gap-2">
                  <Label htmlFor="email-export">Email de destino</Label>
                  <Input
                    id="email-export"
                    type="email"
                    placeholder="exemplo@dominio.com"
                    value={emailDestino}
                    onChange={(e) => setEmailDestino(e.target.value)}
                  />
                  <Button variant="outline" className="mt-2" onClick={enviarBackupPorEmail} disabled={isSending}>
                    {isSending ? (
                      <>Enviando...</>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar por Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restore">
          <Card>
            <CardHeader>
              <CardTitle>Restauração de Backup</CardTitle>
              <CardDescription>
                Restaure os dados do sistema a partir de um arquivo de backup previamente gerado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md p-4 bg-yellow-50 text-yellow-800">
                <h3 className="font-medium mb-2">Atenção!</h3>
                <p>
                  A restauração de backup substituirá todos os dados atuais do sistema. Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="backup-file">Arquivo de Backup</Label>
                <Input
                  id="backup-file"
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setArquivoBackup(e.target.files[0])
                    }
                  }}
                />
                {arquivoBackup && <p className="text-sm text-gray-500">Arquivo selecionado: {arquivoBackup.name}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={restaurarBackup}
                disabled={!arquivoBackup || isRestoring}
                className="w-full"
                variant="destructive"
              >
                {isRestoring ? (
                  <>Restaurando...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Restaurar Backup
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

