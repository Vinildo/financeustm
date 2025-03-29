"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppContext } from "@/contexts/AppContext"
import { format, isAfter, isBefore, addDays, startOfMonth, endOfMonth } from "date-fns"
import { pt } from "date-fns/locale"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { AlertCircle, CreditCard, Receipt, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function DashboardOverview() {
  const { fornecedores } = useAppContext()
  const router = useRouter()
  const [cheques, setCheques] = useState<any[]>([])

  // Carregar dados de cheques do localStorage
  useEffect(() => {
    const chequesData = localStorage.getItem("cheques")
    if (chequesData) {
      try {
        const chequesParsed = JSON.parse(chequesData)
        // Converter as datas de string para objeto Date
        const chequesFormatados = chequesParsed.map((cheque: any) => ({
          ...cheque,
          dataEmissao: new Date(cheque.dataEmissao),
          dataCompensacao: cheque.dataCompensacao ? new Date(cheque.dataCompensacao) : null,
        }))
        setCheques(chequesFormatados)
      } catch (error) {
        console.error("Erro ao carregar cheques:", error)
        setCheques([])
      }
    }
  }, [])

  // Calcular estatísticas
  const hoje = new Date()
  const pagamentosProximos = fornecedores.flatMap((fornecedor) =>
    fornecedor.pagamentos
      .filter(
        (pagamento) =>
          pagamento.estado === "pendente" &&
          isAfter(new Date(pagamento.dataVencimento), hoje) &&
          isBefore(new Date(pagamento.dataVencimento), addDays(hoje, 7)),
      )
      .map((pagamento) => ({
        ...pagamento,
        fornecedorNome: fornecedor.nome,
        fornecedorId: fornecedor.id,
      })),
  )

  const pagamentosAtrasados = fornecedores.flatMap((fornecedor) =>
    fornecedor.pagamentos
      .filter(
        (pagamento) =>
          (pagamento.estado === "pendente" || pagamento.estado === "atrasado") &&
          isBefore(new Date(pagamento.dataVencimento), hoje),
      )
      .map((pagamento) => ({
        ...pagamento,
        fornecedorNome: fornecedor.nome,
        fornecedorId: fornecedor.id,
      })),
  )

  const pagamentosPendentesDocumentos = fornecedores.flatMap((fornecedor) =>
    fornecedor.pagamentos
      .filter(
        (pagamento) =>
          pagamento.estado === "pago" && (pagamento.facturaRecebida !== true || pagamento.reciboRecebido !== true),
      )
      .map((pagamento) => ({
        ...pagamento,
        fornecedorNome: fornecedor.nome,
        fornecedorId: fornecedor.id,
      })),
  )

  const chequesPendentes = cheques.filter((cheque) => cheque.estado === "pendente")

  // Dados para o gráfico de pagamentos por estado
  const pagamentosPorEstado = [
    {
      name: "Pendentes",
      value: fornecedores.flatMap((f) => f.pagamentos.filter((p) => p.estado === "pendente")).length,
    },
    { name: "Pagos", value: fornecedores.flatMap((f) => f.pagamentos.filter((p) => p.estado === "pago")).length },
    {
      name: "Atrasados",
      value: fornecedores.flatMap((f) => f.pagamentos.filter((p) => p.estado === "atrasado")).length,
    },
    {
      name: "Cancelados",
      value: fornecedores.flatMap((f) => f.pagamentos.filter((p) => p.estado === "cancelado")).length,
    },
  ]

  // Cores para o gráfico de pizza
  const COLORS = ["#FFBB28", "#00C49F", "#FF8042", "#AAAAAA"]

  // Dados para o gráfico de pagamentos do mês atual
  const mesAtual = startOfMonth(hoje)
  const fimMesAtual = endOfMonth(hoje)

  const pagamentosMesAtual = fornecedores.flatMap((fornecedor) =>
    fornecedor.pagamentos.filter((pagamento) => {
      const dataPagamento = pagamento.dataPagamento
        ? new Date(pagamento.dataPagamento)
        : new Date(pagamento.dataVencimento)
      return isAfter(dataPagamento, mesAtual) && isBefore(dataPagamento, fimMesAtual)
    }),
  )

  const totalMesAtual = pagamentosMesAtual.reduce((acc, curr) => acc + curr.valor, 0)
  const totalPagoMesAtual = pagamentosMesAtual
    .filter((p) => p.estado === "pago")
    .reduce((acc, curr) => acc + curr.valor, 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Visão Geral</CardTitle>
            <CardDescription>Resumo das operações financeiras</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {format(hoje, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Pagamentos Próximos (7 dias)</CardTitle>
            <CardDescription>Vencimentos nos próximos 7 dias</CardDescription>
          </div>
          <div className="h-10 w-10 rounded-full bg-yellow-100 p-2">
            <TrendingUp className="h-6 w-6 text-yellow-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pagamentosProximos.length}</div>
          <p className="text-xs text-muted-foreground">
            Total:{" "}
            {pagamentosProximos
              .reduce((acc, curr) => acc + curr.valor, 0)
              .toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard?tab=pagamentos")}>
              Ver detalhes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Pagamentos Atrasados</CardTitle>
            <CardDescription>Vencimentos não pagos</CardDescription>
          </div>
          <div className="h-10 w-10 rounded-full bg-red-100 p-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pagamentosAtrasados.length}</div>
          <p className="text-xs text-muted-foreground">
            Total:{" "}
            {pagamentosAtrasados
              .reduce((acc, curr) => acc + curr.valor, 0)
              .toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard?tab=pagamentos")}>
              Ver detalhes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Documentos Pendentes</CardTitle>
            <CardDescription>Facturas/Recibos a receber</CardDescription>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 p-2">
            <Receipt className="h-6 w-6 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pagamentosPendentesDocumentos.length}</div>
          <p className="text-xs text-muted-foreground">
            Total:{" "}
            {pagamentosPendentesDocumentos
              .reduce((acc, curr) => acc + curr.valor, 0)
              .toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard?tab=documentos-pendentes")}>
              Ver detalhes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Cheques Pendentes</CardTitle>
            <CardDescription>Cheques não compensados</CardDescription>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-100 p-2">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{chequesPendentes.length}</div>
          <p className="text-xs text-muted-foreground">
            Total:{" "}
            {chequesPendentes
              .reduce((acc, curr) => acc + curr.valor, 0)
              .toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard?tab=controlo-cheques")}>
              Ver detalhes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle>Pagamentos do Mês</CardTitle>
          <CardDescription>{format(mesAtual, "MMMM yyyy", { locale: pt })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Total", valor: totalMesAtual },
                  { name: "Pago", valor: totalPagoMesAtual },
                  { name: "Pendente", valor: totalMesAtual - totalPagoMesAtual },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })} />
                <Legend />
                <Bar dataKey="valor" fill="#e11d48" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado dos Pagamentos</CardTitle>
          <CardDescription>Distribuição por estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pagamentosPorEstado}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pagamentosPorEstado.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

