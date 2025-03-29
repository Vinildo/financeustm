"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react"

// Tipos de dados para a demonstração
type Pagamento = {
  id: string
  fornecedor: string
  valor: number
  estado: "pendente" | "pago" | "atrasado" | "cancelado"
  metodo: "transferência" | "cheque" | "fundo de maneio" | "outro"
  dataVencimento: string
  dataPagamento?: string
  chequeId?: string
  fundoManeioId?: string
  transacaoBancariaId?: string
  observacoes?: string
}

type Cheque = {
  id: string
  numero: string
  valor: number
  beneficiario: string
  dataEmissao: string
  dataCompensacao?: string
  estado: "pendente" | "compensado" | "cancelado"
  pagamentoId?: string
}

type MovimentoFundoManeio = {
  id: string
  data: string
  tipo: "entrada" | "saida"
  valor: number
  descricao: string
  pagamentoId?: string
}

type TransacaoBancaria = {
  id: string
  data: string
  descricao: string
  valor: number
  tipo: "credito" | "debito"
  reconciliado: boolean
  pagamentoId?: string
  chequeId?: string
}

// Dados iniciais para demonstração
const pagamentosIniciais: Pagamento[] = [
  {
    id: "pag1",
    fornecedor: "Fornecedor A",
    valor: 5000,
    estado: "pendente",
    metodo: "cheque",
    dataVencimento: "2023-11-15",
    observacoes: "Pagamento de material de escritório",
  },
  {
    id: "pag2",
    fornecedor: "Fornecedor B",
    valor: 1200,
    estado: "pendente",
    metodo: "transferência",
    dataVencimento: "2023-11-20",
    observacoes: "Serviço de manutenção",
  },
  {
    id: "pag3",
    fornecedor: "Fornecedor C",
    valor: 800,
    estado: "pendente",
    metodo: "fundo de maneio",
    dataVencimento: "2023-11-10",
    observacoes: "Compra de consumíveis",
  },
]

const chequesIniciais: Cheque[] = []
const movimentosFundoIniciais: MovimentoFundoManeio[] = []
const transacoesIniciais: TransacaoBancaria[] = []

export default function IntegracaoFinanceira() {
  // Estados para armazenar os dados
  const [pagamentos, setPagamentos] = useState<Pagamento[]>(pagamentosIniciais)
  const [cheques, setCheques] = useState<Cheque[]>(chequesIniciais)
  const [movimentosFundo, setMovimentosFundo] = useState<MovimentoFundoManeio[]>(movimentosFundoIniciais)
  const [transacoesBancarias, setTransacoesBancarias] = useState<TransacaoBancaria[]>(transacoesIniciais)
  const [passoAtual, setPassoAtual] = useState(1)
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<string | null>(null)
  const [numeroCheque, setNumeroCheque] = useState("")
  const [descricaoMovimento, setDescricaoMovimento] = useState("")
  const [descricaoTransacao, setDescricaoTransacao] = useState("")
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "info" | "alerta"; texto: string } | null>(null)

  // Função para emitir um cheque
  const emitirCheque = () => {
    if (!pagamentoSelecionado || !numeroCheque) return

    const pagamento = pagamentos.find((p) => p.id === pagamentoSelecionado)
    if (!pagamento || pagamento.metodo !== "cheque") return

    const novoCheque: Cheque = {
      id: `cheque-${Date.now()}`,
      numero: numeroCheque,
      valor: pagamento.valor,
      beneficiario: pagamento.fornecedor,
      dataEmissao: new Date().toISOString().split("T")[0],
      estado: "pendente",
      pagamentoId: pagamento.id,
    }

    setCheques([...cheques, novoCheque])

    // Atualizar o pagamento com a referência ao cheque
    const novosPagamentos = pagamentos.map((p) => {
      if (p.id === pagamentoSelecionado) {
        return {
          ...p,
          chequeId: novoCheque.id,
          observacoes: `${p.observacoes || ""} | Cheque nº ${numeroCheque}`,
        }
      }
      return p
    })

    setPagamentos(novosPagamentos)
    setMensagem({
      tipo: "sucesso",
      texto: `Cheque nº ${numeroCheque} emitido com sucesso para o pagamento de ${pagamento.fornecedor}`,
    })
    setNumeroCheque("")
    setPassoAtual(2)
  }

  // Função para pagar com fundo de maneio
  const pagarComFundoManeio = () => {
    if (!pagamentoSelecionado || !descricaoMovimento) return

    const pagamento = pagamentos.find((p) => p.id === pagamentoSelecionado)
    if (!pagamento || pagamento.metodo !== "fundo de maneio") return

    const novoMovimento: MovimentoFundoManeio = {
      id: `mov-${Date.now()}`,
      data: new Date().toISOString().split("T")[0],
      tipo: "saida",
      valor: pagamento.valor,
      descricao: descricaoMovimento,
      pagamentoId: pagamento.id,
    }

    setMovimentosFundo([...movimentosFundo, novoMovimento])

    // Atualizar o pagamento com a referência ao movimento e marcar como pago
    const novosPagamentos = pagamentos.map((p) => {
      if (p.id === pagamentoSelecionado) {
        return {
          ...p,
          fundoManeioId: novoMovimento.id,
          estado: "pago",
          dataPagamento: new Date().toISOString().split("T")[0],
        }
      }
      return p
    })

    setPagamentos(novosPagamentos)
    setMensagem({
      tipo: "sucesso",
      texto: `Pagamento de ${pagamento.fornecedor} realizado com sucesso via Fundo de Maneio`,
    })
    setDescricaoMovimento("")
    setPassoAtual(3)
  }

  // Função para registrar transação bancária
  const registrarTransacaoBancaria = () => {
    if (!pagamentoSelecionado || !descricaoTransacao) return

    const pagamento = pagamentos.find((p) => p.id === pagamentoSelecionado)
    if (!pagamento || (pagamento.metodo !== "transferência" && pagamento.metodo !== "cheque")) return

    const novaTransacao: TransacaoBancaria = {
      id: `trans-${Date.now()}`,
      data: new Date().toISOString().split("T")[0],
      descricao: descricaoTransacao,
      valor: pagamento.valor,
      tipo: "debito",
      reconciliado: true,
      pagamentoId: pagamento.id,
    }

    // Se for um cheque, adicionar a referência ao cheque
    if (pagamento.metodo === "cheque" && pagamento.chequeId) {
      novaTransacao.chequeId = pagamento.chequeId

      // Atualizar o status do cheque para compensado
      const novosCheques = cheques.map((c) => {
        if (c.id === pagamento.chequeId) {
          return {
            ...c,
            estado: "compensado",
            dataCompensacao: new Date().toISOString().split("T")[0],
          }
        }
        return c
      })

      setCheques(novosCheques)
    }

    setTransacoesBancarias([...transacoesBancarias, novaTransacao])

    // Atualizar o pagamento com a referência à transação e marcar como pago
    const novosPagamentos = pagamentos.map((p) => {
      if (p.id === pagamentoSelecionado) {
        return {
          ...p,
          transacaoBancariaId: novaTransacao.id,
          estado: "pago",
          dataPagamento: new Date().toISOString().split("T")[0],
        }
      }
      return p
    })

    setPagamentos(novosPagamentos)
    setMensagem({
      tipo: "sucesso",
      texto: `Transação bancária registrada com sucesso para o pagamento de ${pagamento.fornecedor}`,
    })
    setDescricaoTransacao("")
    setPassoAtual(4)
  }

  // Função para reconciliar internamente
  const reconciliarInternamente = () => {
    setMensagem({
      tipo: "sucesso",
      texto: "Reconciliação interna realizada com sucesso. Todos os registros estão consistentes.",
    })
    setPassoAtual(5)
  }

  // Renderizar o passo atual do fluxo
  const renderizarPasso = () => {
    switch (passoAtual) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Passo 1: Selecionar Pagamento</CardTitle>
              <CardDescription>Selecione um pagamento pendente para iniciar o fluxo de integração</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="pagamento">Pagamento</Label>
                  <Select onValueChange={setPagamentoSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {pagamentos
                        .filter((p) => p.estado === "pendente")
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.fornecedor} - {p.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })} -{" "}
                            {p.metodo}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {pagamentoSelecionado && (
                  <div className="pt-4">
                    <Button
                      onClick={() => {
                        const pagamento = pagamentos.find((p) => p.id === pagamentoSelecionado)
                        if (pagamento?.metodo === "cheque") {
                          setPassoAtual(2)
                        } else if (pagamento?.metodo === "fundo de maneio") {
                          setPassoAtual(3)
                        } else if (pagamento?.metodo === "transferência") {
                          setPassoAtual(4)
                        }
                      }}
                    >
                      Continuar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Passo 2: Emitir Cheque</CardTitle>
              <CardDescription>Emita um cheque para o pagamento selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagamentoSelecionado && (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Pagamento Selecionado</AlertTitle>
                    <AlertDescription>
                      {pagamentos.find((p) => p.id === pagamentoSelecionado)?.fornecedor} -
                      {pagamentos
                        .find((p) => p.id === pagamentoSelecionado)
                        ?.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="numeroCheque">Número do Cheque</Label>
                  <Input
                    id="numeroCheque"
                    value={numeroCheque}
                    onChange={(e) => setNumeroCheque(e.target.value)}
                    placeholder="Ex: 000123"
                  />
                </div>

                <div className="pt-4 flex space-x-2">
                  <Button variant="outline" onClick={() => setPassoAtual(1)}>
                    Voltar
                  </Button>
                  <Button onClick={emitirCheque}>Emitir Cheque</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Passo 3: Pagar com Fundo de Maneio</CardTitle>
              <CardDescription>Registre um movimento no Fundo de Maneio para o pagamento selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagamentoSelecionado && (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Pagamento Selecionado</AlertTitle>
                    <AlertDescription>
                      {pagamentos.find((p) => p.id === pagamentoSelecionado)?.fornecedor} -
                      {pagamentos
                        .find((p) => p.id === pagamentoSelecionado)
                        ?.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="descricaoMovimento">Descrição do Movimento</Label>
                  <Input
                    id="descricaoMovimento"
                    value={descricaoMovimento}
                    onChange={(e) => setDescricaoMovimento(e.target.value)}
                    placeholder="Ex: Pagamento de material de escritório"
                  />
                </div>

                <div className="pt-4 flex space-x-2">
                  <Button variant="outline" onClick={() => setPassoAtual(1)}>
                    Voltar
                  </Button>
                  <Button onClick={pagarComFundoManeio}>Registrar Movimento</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Passo 4: Registrar Transação Bancária</CardTitle>
              <CardDescription>Registre uma transação bancária para o pagamento selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagamentoSelecionado && (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Pagamento Selecionado</AlertTitle>
                    <AlertDescription>
                      {pagamentos.find((p) => p.id === pagamentoSelecionado)?.fornecedor} -
                      {pagamentos
                        .find((p) => p.id === pagamentoSelecionado)
                        ?.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="descricaoTransacao">Descrição da Transação</Label>
                  <Input
                    id="descricaoTransacao"
                    value={descricaoTransacao}
                    onChange={(e) => setDescricaoTransacao(e.target.value)}
                    placeholder="Ex: Pagamento fatura nº 12345"
                  />
                </div>

                <div className="pt-4 flex space-x-2">
                  <Button variant="outline" onClick={() => setPassoAtual(1)}>
                    Voltar
                  </Button>
                  <Button onClick={registrarTransacaoBancaria}>Registrar Transação</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Fluxo Completo</CardTitle>
              <CardDescription>Todos os passos foram concluídos com sucesso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Integração Concluída</AlertTitle>
                  <AlertDescription className="text-green-700">
                    O pagamento foi processado e integrado com sucesso em todos os módulos relevantes.
                  </AlertDescription>
                </Alert>

                <div className="pt-4">
                  <Button
                    onClick={() => {
                      setPassoAtual(1)
                      setPagamentoSelecionado(null)
                      setMensagem(null)
                    }}
                  >
                    Iniciar Novo Fluxo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Demonstração de Integração Financeira</h1>

      {mensagem && (
        <Alert
          className={`mb-6 ${
            mensagem.tipo === "sucesso"
              ? "bg-green-50 border-green-200"
              : mensagem.tipo === "alerta"
                ? "bg-amber-50 border-amber-200"
                : "bg-blue-50 border-blue-200"
          }`}
        >
          {mensagem.tipo === "sucesso" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : mensagem.tipo === "alerta" ? (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          ) : (
            <InfoIcon className="h-4 w-4 text-blue-600" />
          )}
          <AlertTitle>
            {mensagem.tipo === "sucesso" ? "Operação Concluída" : mensagem.tipo === "alerta" ? "Atenção" : "Informação"}
          </AlertTitle>
          <AlertDescription>{mensagem.texto}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Fluxo de Integração</CardTitle>
            <CardDescription>Passos do processo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div
                className={`flex items-center space-x-2 ${passoAtual >= 1 ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${passoAtual >= 1 ? "bg-primary text-white" : "bg-muted"}`}
                >
                  1
                </div>
                <span>Selecionar Pagamento</span>
              </div>
              <div className="ml-3 border-l-2 border-dashed h-4 border-muted-foreground"></div>
              <div
                className={`flex items-center space-x-2 ${passoAtual >= 2 ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${passoAtual >= 2 ? "bg-primary text-white" : "bg-muted"}`}
                >
                  2
                </div>
                <span>Emitir Cheque (se aplicável)</span>
              </div>
              <div className="ml-3 border-l-2 border-dashed h-4 border-muted-foreground"></div>
              <div
                className={`flex items-center space-x-2 ${passoAtual >= 3 ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${passoAtual >= 3 ? "bg-primary text-white" : "bg-muted"}`}
                >
                  3
                </div>
                <span>Fundo de Maneio (se aplicável)</span>
              </div>
              <div className="ml-3 border-l-2 border-dashed h-4 border-muted-foreground"></div>
              <div
                className={`flex items-center space-x-2 ${passoAtual >= 4 ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${passoAtual >= 4 ? "bg-primary text-white" : "bg-muted"}`}
                >
                  4
                </div>
                <span>Reconciliação Bancária</span>
              </div>
              <div className="ml-3 border-l-2 border-dashed h-4 border-muted-foreground"></div>
              <div
                className={`flex items-center space-x-2 ${passoAtual >= 5 ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${passoAtual >= 5 ? "bg-primary text-white" : "bg-muted"}`}
                >
                  5
                </div>
                <span>Reconciliação Interna</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">{renderizarPasso()}</div>
      </div>

      <Tabs defaultValue="pagamentos">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="cheques">Cheques</TabsTrigger>
          <TabsTrigger value="fundoManeio">Fundo de Maneio</TabsTrigger>
          <TabsTrigger value="transacoes">Transações Bancárias</TabsTrigger>
        </TabsList>

        <TabsContent value="pagamentos">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos</CardTitle>
              <CardDescription>Lista de pagamentos no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fornecedor</th>
                      <th className="text-left py-2">Valor</th>
                      <th className="text-left py-2">Método</th>
                      <th className="text-left py-2">Estado</th>
                      <th className="text-left py-2">Vencimento</th>
                      <th className="text-left py-2">Pagamento</th>
                      <th className="text-left py-2">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-muted/50">
                        <td className="py-2">{p.fornecedor}</td>
                        <td className="py-2">
                          {p.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                        </td>
                        <td className="py-2 capitalize">{p.metodo}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              p.estado === "pago"
                                ? "bg-green-100 text-green-800"
                                : p.estado === "pendente"
                                  ? "bg-amber-100 text-amber-800"
                                  : p.estado === "atrasado"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {p.estado}
                          </span>
                        </td>
                        <td className="py-2">{p.dataVencimento}</td>
                        <td className="py-2">{p.dataPagamento || "-"}</td>
                        <td className="py-2">{p.observacoes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cheques">
          <Card>
            <CardHeader>
              <CardTitle>Cheques</CardTitle>
              <CardDescription>Lista de cheques emitidos</CardDescription>
            </CardHeader>
            <CardContent>
              {cheques.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">Nenhum cheque emitido ainda</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Número</th>
                        <th className="text-left py-2">Beneficiário</th>
                        <th className="text-left py-2">Valor</th>
                        <th className="text-left py-2">Data Emissão</th>
                        <th className="text-left py-2">Data Compensação</th>
                        <th className="text-left py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cheques.map((c) => (
                        <tr key={c.id} className="border-b hover:bg-muted/50">
                          <td className="py-2">{c.numero}</td>
                          <td className="py-2">{c.beneficiario}</td>
                          <td className="py-2">
                            {c.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </td>
                          <td className="py-2">{c.dataEmissao}</td>
                          <td className="py-2">{c.dataCompensacao || "-"}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                c.estado === "compensado"
                                  ? "bg-green-100 text-green-800"
                                  : c.estado === "pendente"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {c.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fundoManeio">
          <Card>
            <CardHeader>
              <CardTitle>Fundo de Maneio</CardTitle>
              <CardDescription>Movimentos do fundo de maneio</CardDescription>
            </CardHeader>
            <CardContent>
              {movimentosFundo.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">Nenhum movimento registrado ainda</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Data</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Valor</th>
                        <th className="text-left py-2">Descrição</th>
                        <th className="text-left py-2">Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimentosFundo.map((m) => (
                        <tr key={m.id} className="border-b hover:bg-muted/50">
                          <td className="py-2">{m.data}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                m.tipo === "entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {m.tipo}
                            </span>
                          </td>
                          <td className="py-2">
                            {m.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </td>
                          <td className="py-2">{m.descricao}</td>
                          <td className="py-2">{m.pagamentoId ? "Sim" : "Não"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacoes">
          <Card>
            <CardHeader>
              <CardTitle>Transações Bancárias</CardTitle>
              <CardDescription>Lista de transações bancárias</CardDescription>
            </CardHeader>
            <CardContent>
              {transacoesBancarias.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhuma transação bancária registrada ainda
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Data</th>
                        <th className="text-left py-2">Descrição</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Valor</th>
                        <th className="text-left py-2">Reconciliado</th>
                        <th className="text-left py-2">Pagamento</th>
                        <th className="text-left py-2">Cheque</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transacoesBancarias.map((t) => (
                        <tr key={t.id} className="border-b hover:bg-muted/50">
                          <td className="py-2">{t.data}</td>
                          <td className="py-2">{t.descricao}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                t.tipo === "credito" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {t.tipo}
                            </span>
                          </td>
                          <td className="py-2">
                            {t.valor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                          </td>
                          <td className="py-2">{t.reconciliado ? "Sim" : "Não"}</td>
                          <td className="py-2">{t.pagamentoId ? "Sim" : "Não"}</td>
                          <td className="py-2">{t.chequeId ? "Sim" : "Não"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Diagrama de Integração</CardTitle>
            <CardDescription>Fluxo de dados entre os módulos financeiros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold mb-2">Pagamentos</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Registro inicial</li>
                    <li>• Definição do método</li>
                    <li>• Vencimento</li>
                    <li>• Fornecedor</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold mb-2">Cheques</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Emissão</li>
                    <li>• Compensação</li>
                    <li>• Controle de status</li>
                  </ul>
                  <div className="mt-2 text-xs text-gray-500">
                    <ArrowRight className="inline h-3 w-3 mr-1" />
                    Vinculado ao pagamento
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-amber-50">
                  <h3 className="font-semibold mb-2">Fundo de Maneio</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Movimentos de entrada</li>
                    <li>• Movimentos de saída</li>
                    <li>• Saldo atual</li>
                  </ul>
                  <div className="mt-2 text-xs text-gray-500">
                    <ArrowRight className="inline h-3 w-3 mr-1" />
                    Vinculado ao pagamento
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-purple-50">
                  <h3 className="font-semibold mb-2">Transações Bancárias</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Extratos bancários</li>
                    <li>• Reconciliação</li>
                    <li>• Controle de saldo</li>
                  </ul>
                  <div className="mt-2 text-xs text-gray-500">
                    <ArrowRight className="inline h-3 w-3 mr-1" />
                    Vinculado ao pagamento e cheque
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-2 text-center">Reconciliação Interna</h3>
                <p className="text-sm text-center">
                  Verifica a consistência entre todos os módulos e garante a integridade dos dados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

