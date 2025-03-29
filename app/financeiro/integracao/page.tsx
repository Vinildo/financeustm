import IntegracaoFinanceira from "@/components/financeiro/IntegracaoFinanceira"

export default function IntegracaoFinanceiraPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Integração Financeira</h1>
      <p className="text-muted-foreground mb-8">
        Esta página demonstra como os diferentes módulos financeiros se integram no sistema. Você pode simular o fluxo
        completo de um pagamento e ver como ele afeta os outros módulos.
      </p>

      <IntegracaoFinanceira />
    </div>
  )
}

