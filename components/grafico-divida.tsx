"use client"

import { useState, useEffect } from "react"
import { format, isAfter, isBefore, isEqual, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { pt } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react"
import { useAppContext } from "@/contexts/AppContext"
import { PrintLayout } from "@/components/print-layout"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js"
import { Bar, Pie, Line } from "react-chartjs-2"

// Registrar componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

export function GraficoDivida() {
  const { fornecedores = [] } = useAppContext() || {}
  const [mesSelecionado, setMesSelecionado] = useState<Date>(startOfMonth(new Date()))
  const [incluirCotacoes, setIncluirCotacoes] = useState(false)

  // Dados para os gráficos
  const [dadosPorFornecedor, setDadosPorFornecedor] = useState<any>({
    labels: [],
    datasets: [],
  })

  const [dadosPorStatus, setDadosPorStatus] = useState<any>({
    labels: [],
    datasets: [],
  })

  const [dadosPorDia, setDadosPorDia] = useState<any>({
    labels: [],
    datasets: [],
  })

  useEffect(() => {
    if (!fornecedores || fornecedores.length === 0) {
      resetarGraficos()
      return
    }

    try {
      // Processar dados para gráficos
      processarDadosPorFornecedor()
      processarDadosPorStatus()
      processarDadosPorDia()
    } catch (error) {
      console.error("Erro ao processar dados para gráficos:", error)
      resetarGraficos()
    }
  }, [fornecedores, mesSelecionado, incluirCotacoes])

  const resetarGraficos = () => {
    setDadosPorFornecedor({
      labels: [],
      datasets: [],
    })

    setDadosPorStatus({
      labels: [],
      datasets: [],
    })

    setDadosPorDia({
      labels: [],
      datasets: [],
    })
  }

  const processarDadosPorFornecedor = () => {
    // Agrupar valores por fornecedor
    const dadosFornecedores: Record<string, number> = {}

    fornecedores.forEach((fornecedor) => {
      let totalPendente = 0

      // Filtrar pagamentos do mês selecionado
      const pagamentosFiltrados = (fornecedor.pagamentos || []).filter((pagamento) => {
        const dataVencimento = new Date(pagamento.dataVencimento)
        const noMesSelecionado =
          (isAfter(dataVencimento, startOfMonth(mesSelecionado)) &&
            isBefore(dataVencimento, endOfMonth(mesSelecionado))) ||
          isEqual(dataVencimento, startOfMonth(mesSelecionado)) ||
          isEqual(dataVencimento, endOfMonth(mesSelecionado))

        // Excluir cotações se a opção não estiver marcada
        if (!incluirCotacoes && pagamento.tipo === "cotacao") {
          return false
        }

        return noMesSelecionado
      })

      // Calcular total pendente considerando pagamentos parciais
      pagamentosFiltrados.forEach((pagamento) => {
        const valorPago = pagamento.valorPago || 0
        const valorPendente = pagamento.valor - valorPago
        totalPendente += valorPendente
      })

      if (totalPendente > 0) {
        dadosFornecedores[fornecedor.nome] = totalPendente
      }
    })

    // Ordenar por valor e limitar aos 10 maiores
    const fornecedoresOrdenados = Object.entries(dadosFornecedores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Preparar dados para o gráfico
    setDadosPorFornecedor({
      labels: fornecedoresOrdenados.map(([nome]) => nome),
      datasets: [
        {
          label: "Valor Pendente",
          data: fornecedoresOrdenados.map(([, valor]) => valor),
          backgroundColor: "rgba(220, 38, 38, 0.7)",
          borderColor: "rgba(220, 38, 38, 1)",
          borderWidth: 1,
        },
      ],
    })
  }

  const processarDadosPorStatus = () => {
    // Inicializar contadores
    let totalPendente = 0
    let totalParcial = 0
    let totalPago = 0
    let totalAtrasado = 0

    // Processar todos os pagamentos
    fornecedores.forEach((fornecedor) => {
      ;(fornecedor.pagamentos || []).forEach((pagamento) => {
        const dataVencimento = new Date(pagamento.dataVencimento)
        const noMesSelecionado =
          (isAfter(dataVencimento, startOfMonth(mesSelecionado)) &&
            isBefore(dataVencimento, endOfMonth(mesSelecionado))) ||
          isEqual(dataVencimento, startOfMonth(mesSelecionado)) ||
          isEqual(dataVencimento, endOfMonth(mesSelecionado))

        // Excluir cotações se a opção não estiver marcada
        if (!incluirCotacoes && pagamento.tipo === "cotacao") {
          return
        }

        if (noMesSelecionado) {
          const valorPago = pagamento.valorPago || 0
          const valorPendente = pagamento.valor - valorPago

          // Classificar por status
          if (pagamento.estado === "pago" || valorPendente <= 0) {
            totalPago += pagamento.valor
          } else if (valorPago > 0 && valorPendente > 0) {
            totalParcial += valorPendente
          } else if (pagamento.estado === "atrasado") {
            totalAtrasado += valorPendente
          } else if (pagamento.estado === "pendente") {
            totalPendente += valorPendente
          }
        }
      })
    })

    // Preparar dados para o gráfico
    setDadosPorStatus({
      labels: ["Pendente", "Parcial", "Pago", "Atrasado"],
      datasets: [
        {
          label: "Valor por Status",
          data: [totalPendente, totalParcial, totalPago, totalAtrasado],
          backgroundColor: [
            "rgba(234, 179, 8, 0.7)", // Amarelo para pendente
            "rgba(59, 130, 246, 0.7)", // Azul para parcial
            "rgba(34, 197, 94, 0.7)", // Verde para pago
            "rgba(220, 38, 38, 0.7)", // Vermelho para atrasado
          ],
          borderColor: [
            "rgba(234, 179, 8, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(34, 197, 94, 1)",
            "rgba(220, 38, 38, 1)",
          ],
          borderWidth: 1,
        },
      ],
    })
  }

  const processarDadosPorDia = () => {
    // Criar um mapa para armazenar valores por dia
    const valoresPorDia: Record<string, number> = {}

    // Inicializar todos os dias do mês
    const diasNoMes = endOfMonth(mesSelecionado).getDate()
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataFormatada = format(new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth(), dia), "dd/MM")
      valoresPorDia[dataFormatada] = 0
    }

    // Processar pagamentos
    fornecedores.forEach((fornecedor) => {
      ;(fornecedor.pagamentos || []).forEach((pagamento) => {
        const dataVencimento = new Date(pagamento.dataVencimento)
        const noMesSelecionado =
          dataVencimento.getMonth() === mesSelecionado.getMonth() &&
          dataVencimento.getFullYear() === mesSelecionado.getFullYear()

        // Excluir cotações se a opção não estiver marcada
        if (!incluirCotacoes && pagamento.tipo === "cotacao") {
          return
        }

        if (noMesSelecionado) {
          const dataFormatada = format(dataVencimento, "dd/MM")
          const valorPago = pagamento.valorPago || 0
          const valorPendente = pagamento.valor - valorPago

          // Adicionar valor pendente ao dia
          valoresPorDia[dataFormatada] = (valoresPorDia[dataFormatada] || 0) + valorPendente
        }
      })
    })

    // Preparar dados para o gráfico
    const labels = Object.keys(valoresPorDia).sort((a, b) => {
      const [diaA, mesA] = a.split("/").map(Number)
      const [diaB, mesB] = b.split("/").map(Number)
      if (mesA !== mesB) return mesA - mesB
      return diaA - diaB
    })

    setDadosPorDia({
      labels,
      datasets: [
        {
          label: "Valor Pendente por Dia",
          data: labels.map((label) => valoresPorDia[label]),
          borderColor: "rgba(220, 38, 38, 1)",
          backgroundColor: "rgba(220, 38, 38, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    })
  }

  const handleMesAnterior = () => {
    setMesSelecionado(subMonths(mesSelecionado, 1))
  }

  const handleProximoMes = () => {
    setMesSelecionado(addMonths(mesSelecionado, 1))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    // Implementação futura
    alert("Exportação para PDF em desenvolvimento")
  }

  const opcoesBarra = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Dívidas por Fornecedor",
      },
    },
  }

  const opcoesPie = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Distribuição por Status",
      },
    },
  }

  const opcoesLinha = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Dívidas por Dia de Vencimento",
      },
    },
  }

  return (
    <PrintLayout title="Gráficos de Dívidas">
      <Card>
        <CardHeader className="bg-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gráficos de Dívidas</CardTitle>
              <CardDescription>
                {incluirCotacoes
                  ? "Visualização gráfica de dívidas e cotações"
                  : "Visualização gráfica de dívidas (excluindo cotações)"}
              </CardDescription>
            </div>
            <div className="space-x-2">
              <Button onClick={handlePrint} className="print:hidden bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleExportPDF} className="print:hidden bg-red-600 hover:bg-red-700">
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Button onClick={handleMesAnterior} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold">{format(mesSelecionado, "MMMM yyyy", { locale: pt })}</span>
              <Button onClick={handleProximoMes} variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm">
                <input
                  type="checkbox"
                  checked={incluirCotacoes}
                  onChange={() => setIncluirCotacoes(!incluirCotacoes)}
                  className="mr-2"
                />
                Incluir cotações
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Top 10 Fornecedores</h3>
              {dadosPorFornecedor.labels.length > 0 ? (
                <Bar options={opcoesBarra} data={dadosPorFornecedor} height={300} />
              ) : (
                <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-md">
                  <p className="text-gray-500">Sem dados para exibir</p>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Distribuição por Status</h3>
              {dadosPorStatus.labels.length > 0 ? (
                <Pie options={opcoesPie} data={dadosPorStatus} height={300} />
              ) : (
                <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-md">
                  <p className="text-gray-500">Sem dados para exibir</p>
                </div>
              )}
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Dívidas por Dia de Vencimento</h3>
            {dadosPorDia.labels.length > 0 ? (
              <Line options={opcoesLinha} data={dadosPorDia} height={200} />
            ) : (
              <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-md">
                <p className="text-gray-500">Sem dados para exibir</p>
              </div>
            )}
          </Card>
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

