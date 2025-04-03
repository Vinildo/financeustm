"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PageTransition } from "@/components/page-transition"
import { PagamentosTable } from "@/components/pagamentos-table"
import { RelatorioDivida } from "@/components/relatorio-divida"
import { GraficoDivida } from "@/components/grafico-divida"
import { RelatorioFornecedor } from "@/components/relatorio-fornecedor"
import { ControloCheques } from "@/components/controlo-cheques"
import { FundoManeio } from "@/components/fundo-maneio"
import { UserManagement } from "@/components/user-management"
import { ExtratoFornecedor } from "@/components/extrato-fornecedor"
import { useAppContext } from "@/contexts/AppContext"
import { ReconciliacaoBancaria } from "@/components/reconciliacao-bancaria"
import { ReconciliacaoInterna } from "@/components/reconciliacao-interna"
import { PrevisaoOrcamento } from "@/components/previsao-orcamento"
import { DocumentosPendentes } from "@/components/documentos-pendentes"
import { CalendarioFiscal } from "@/components/calendario-fiscal"
import { DemonstracaoResultados } from "@/components/demonstracao-resultados"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Database } from "lucide-react"
import { WorkflowDashboard } from "@/components/workflow-dashboard"
import { HelpSystem } from "@/components/help-system"

// Componente estático para o cabeçalho do dashboard
const DashboardHeader = memo(({ title }) => <div className="text-2xl font-bold mb-4 sm:mb-0">{title}</div>)

DashboardHeader.displayName = "DashboardHeader"

// Componente estático para o botão de navegação
const NavButton = memo(({ label, isActive, onClick }) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className={`text-white ${isActive ? "bg-red-800" : "bg-red-700"} hover:bg-red-600 transition-colors`}
  >
    {label}
  </Button>
))

NavButton.displayName = "NavButton"

// Componente estático para o dropdown de navegação
const NavDropdown = memo(({ label, isActive, children }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className={`${isActive ? "bg-red-800" : "bg-red-700"} text-white hover:bg-red-600`}>
        {label} <ChevronDown className="ml-1 h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>{children}</DropdownMenuContent>
  </DropdownMenu>
))

NavDropdown.displayName = "NavDropdown"

// Componente estático para o item do dropdown
const DropdownItem = memo(({ label, onClick }) => <DropdownMenuItem onClick={onClick}>{label}</DropdownMenuItem>)

DropdownItem.displayName = "DropdownItem"

// Componente estático para o conteúdo principal
const ContentArea = ({ activeTab, isAdmin }) => {
  // Renderização condicional baseada em um objeto de mapeamento para evitar múltiplas condições
  const contentMap = {
    pagamentos: <PagamentosTable />,
    "relatorio-divida": <RelatorioDivida />,
    "grafico-divida": <GraficoDivida />,
    "relatorio-fornecedor": <RelatorioFornecedor />,
    "extrato-fornecedor": <ExtratoFornecedor />,
    "controlo-cheques": <ControloCheques />,
    "fundo-maneio": <FundoManeio />,
    "reconciliacao-bancaria": <ReconciliacaoBancaria />,
    "reconciliacao-interna": <ReconciliacaoInterna />,
    "calendario-fiscal": <CalendarioFiscal />,
    "documentos-pendentes": <DocumentosPendentes />,
    "previsao-orcamento": <PrevisaoOrcamento />,
    "demonstracao-resultados": <DemonstracaoResultados />,
    workflow: <WorkflowDashboard />,
    "user-management": isAdmin ? <UserManagement /> : null,
  }

  return (
    <main className="flex-grow max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {contentMap[activeTab] || <div>Selecione uma opção no menu</div>}
    </main>
  )
}

// Componente principal do dashboard
export default function Dashboard() {
  return (
    <PageTransition>
      <DashboardContent />
    </PageTransition>
  )
}

// Componente de conteúdo do dashboard que usa o contexto
function DashboardContent() {
  // Usar useRef para o estado inicial para evitar re-renderizações
  const [activeTab, setActiveTab] = useState("pagamentos")
  const { currentUser, logout } = useAppContext()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Verificar autenticação apenas uma vez na montagem
  useEffect(() => {
    if (!currentUser) {
      router.push("/")
    } else {
      setIsAdmin(currentUser.role === "admin")
      setIsLoading(false)
    }
  }, [currentUser, router])

  // Função de logout estável
  const handleLogout = useCallback(() => {
    logout()
    router.push("/")
  }, [logout, router])

  // Função estável para mudar de aba
  const changeTab = useCallback((tab) => {
    setActiveTab(tab)
  }, [])

  // Função estável para navegar
  const navigate = useCallback(
    (path) => {
      router.push(path)
    },
    [router],
  )

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Redirecionando...</div>
  }

  // Verificar se uma aba está ativa com base em prefixos
  const isTabActive = (prefix) => {
    return activeTab === prefix || activeTab.startsWith(`${prefix}-`)
  }

  // Verificar se alguma aba de relatório está ativa
  const isReportTabActive = () => {
    return activeTab.includes("relatorio") || activeTab === "grafico-divida" || activeTab === "demonstracao-resultados"
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-red-700 text-white p-4 shadow-md print:hidden">
        <div className="max-w-full mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <DashboardHeader title="FINANCE-VM" />

            <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
              <NavButton
                label="Pagamentos"
                isActive={activeTab === "pagamentos"}
                onClick={() => changeTab("pagamentos")}
              />

              <NavDropdown label="Relatórios Financeiros" isActive={isReportTabActive()}>
                <DropdownItem label="Relatório de Dívida" onClick={() => changeTab("relatorio-divida")} />
                <DropdownItem label="Gráfico de Dívida" onClick={() => changeTab("grafico-divida")} />
                <DropdownItem label="Demonstração de Resultados" onClick={() => changeTab("demonstracao-resultados")} />
              </NavDropdown>

              <NavDropdown label="Fornecedores" isActive={isTabActive("fornecedor")}>
                <DropdownItem label="Relatório por Fornecedor" onClick={() => changeTab("relatorio-fornecedor")} />
                <DropdownItem label="Extrato de Fornecedor" onClick={() => changeTab("extrato-fornecedor")} />
              </NavDropdown>

              <NavDropdown
                label="Controle Financeiro"
                isActive={
                  activeTab === "controlo-cheques" || activeTab === "fundo-maneio" || activeTab === "previsao-orcamento"
                }
              >
                <DropdownItem label="Controlo de Cheques" onClick={() => changeTab("controlo-cheques")} />
                <DropdownItem label="Fundo de Maneio" onClick={() => changeTab("fundo-maneio")} />
                <DropdownItem label="Previsão/Orçamento" onClick={() => changeTab("previsao-orcamento")} />
              </NavDropdown>

              <NavDropdown label="Reconciliações" isActive={isTabActive("reconciliacao")}>
                <DropdownItem label="Reconciliação Interna" onClick={() => changeTab("reconciliacao-interna")} />
                <DropdownItem label="Reconciliação Bancária" onClick={() => changeTab("reconciliacao-bancaria")} />
              </NavDropdown>

              <NavButton
                label="Calendário Fiscal"
                isActive={activeTab === "calendario-fiscal"}
                onClick={() => changeTab("calendario-fiscal")}
              />

              <NavButton
                label="Documentos Pendentes"
                isActive={activeTab === "documentos-pendentes"}
                onClick={() => changeTab("documentos-pendentes")}
              />

              <NavButton label="Workflow" isActive={activeTab === "workflow"} onClick={() => changeTab("workflow")} />

              {isAdmin && (
                <NavButton
                  label="Gestão de Usuários"
                  isActive={activeTab === "user-management"}
                  onClick={() => changeTab("user-management")}
                />
              )}

              {isAdmin && (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/admin/backup")}
                  className="bg-red-700 text-white hover:bg-red-600"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Backup do Sistema
                </Button>
              )}

              <span className="text-white">Olá, {currentUser.username}</span>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="bg-red-700 text-white hover:bg-red-600 hover:text-white border-white"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <ContentArea activeTab={activeTab} isAdmin={isAdmin} />
      <HelpSystem />
    </div>
  )
}

