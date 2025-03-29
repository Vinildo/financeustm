"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useAppContext } from "@/contexts/AppContext"

export function GraficoDivida() {
  const { fornecedores } = useAppContext()

  const dadosGrafico = useMemo(() => {
    const totais: { [key: string]: { pendente: number; atrasado: number } } = {}

    fornecedores.forEach((fornecedor) => {
      const nome = fornecedor.nome
      if (!totais[nome]) {
        totais[nome] = { pendente: 0, atrasado: 0 }
      }

      fornecedor.pagamentos.forEach((pagamento) => {
        if (pagamento.tipo === "fatura" && (pagamento.estado === "pendente" || pagamento.estado === "atrasado")) {
          totais[nome][pagamento.estado] += pagamento.valor
        }
      })
    })

    return Object.entries(totais)
      .filter(([_, valores]) => valores.pendente > 0 || valores.atrasado > 0)
      .map(([fornecedor, valores]) => ({
        fornecedor,
        pendente: valores.pendente,
        atrasado: valores.atrasado,
        total: valores.pendente + valores.atrasado,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Limitar aos 10 maiores fornecedores por dívida total
  }, [fornecedores])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gráfico de Dívida por Fornecedor</CardTitle>
        <CardDescription>Visão geral das dívidas pendentes e atrasadas por fornecedor (Top 10)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            pendente: {
              label: "Pendente",
              color: "hsl(346, 83%, 70%)",
            },
            atrasado: {
              label: "Atrasado",
              color: "hsl(346, 83%, 50%)",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(value) => value.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
              />
              <YAxis type="category" dataKey="fornecedor" width={120} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="pendente" fill="hsl(346, 83%, 70%)" name="Pendente" />
              <Bar dataKey="atrasado" fill="hsl(346, 83%, 50%)" name="Atrasado" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

