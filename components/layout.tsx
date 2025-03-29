"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAppContext } from "@/contexts/AppContext"
import { NotificationCenter } from "@/components/notification-center"
import { UserSwitch } from "@/components/user-switch"
import { ForcePasswordChange } from "@/components/force-password-change"
import { PageTransition } from "@/components/page-transition"

export function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, hasPermission } = useAppContext()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Verificar se o usuário está logado
  useEffect(() => {
    if (!currentUser && !pathname?.includes("/login") && !pathname?.includes("/register")) {
      router.push("/login")
    }
  }, [currentUser, pathname, router])

  // Se o usuário não estiver logado e não estiver na página de login ou registro, não renderizar o layout
  if (!currentUser && !pathname?.includes("/login") && !pathname?.includes("/register")) {
    return null
  }

  // Se o usuário estiver na página de login ou registro, renderizar apenas o conteúdo
  if (pathname?.includes("/login") || pathname?.includes("/register")) {
    return <>{children}</>
  }

  // Verificar se o usuário precisa alterar a senha
  if (currentUser?.forcePasswordChange) {
    return <ForcePasswordChange />
  }

  // Definir os itens do menu com base nas permissões
  const menuItems = [
    { label: "Dashboard", path: "/dashboard", permission: null },
    { label: "Pagamentos", path: "/pagamentos", permission: "view_pagamentos" },
    { label: "Relatório de Dívida", path: "/relatorio-divida", permission: "view_relatorio_divida" },
    { label: "Relatório de Fornecedor", path: "/relatorio-fornecedor", permission: "view_relatorio_fornecedor" },
    { label: "Relatório Financeiro", path: "/relatorio-financeiro", permission: "view_relatorio_financeiro" },
    { label: "Fundo de Maneio", path: "/fundo-maneio", permission: "view_fundo_maneio" },
    { label: "Reconciliação Bancária", path: "/reconciliacao-bancaria", permission: "view_reconciliacao_bancaria" },
    { label: "Reconciliação Interna", path: "/reconciliacao-interna", permission: "view_reconciliacao_interna" },
    { label: "Controlo de Cheques", path: "/controlo-cheques", permission: "view_controlo_cheques" },
    { label: "Previsão e Orçamento", path: "/previsao-orcamento", permission: "view_previsao_orcamento" },
    { label: "Workflow", path: "/dashboard?tab=workflow", permission: "view_workflow" },
    { label: "Receitas", path: "/receitas", permission: null },
  ]

  // Menu de administração
  const adminMenuItems = [
    { label: "Usuários", path: "/admin/users", permission: "manage_users" },
    { label: "Permissões", path: "/admin/permissoes", permission: "manage_permissions" },
    { label: "Workflow", path: "/admin/workflow", permission: "manage_workflow" },
    { label: "Backup", path: "/admin/backup", permission: "manage_backup" },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-red-700 text-white shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold">
                  FINANCE-VM
                </Link>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-4">
                {menuItems.map((item) => {
                  // Se não requer permissão ou usuário tem permissão
                  if (!item.permission || hasPermission(item.permission)) {
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          pathname === item.path ||
                          (item.path.includes("?tab=") && pathname === item.path.split("?")[0])
                            ? "bg-red-800 text-white"
                            : "text-white hover:bg-red-600"
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  }
                  return null
                })}

                {/* Menu de administração */}
                {adminMenuItems.some((item) => !item.permission || hasPermission(item.permission)) && (
                  <div className="relative group">
                    <button className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-red-600">
                      Administração ▼
                    </button>
                    <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-50">
                      <div className="py-1">
                        {adminMenuItems.map((item) => {
                          if (!item.permission || hasPermission(item.permission)) {
                            return (
                              <Link
                                key={item.path}
                                href={item.path}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {item.label}
                              </Link>
                            )
                          }
                          return null
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center">
              <NotificationCenter />
              <UserSwitch />
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={logout}
                    className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-red-800 hover:bg-red-900"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
            <div className="-mr-2 flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-red-600 focus:outline-none"
              >
                <span className="sr-only">Abrir menu principal</span>
                {isMobileMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu móvel */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {menuItems.map((item) => {
                if (!item.permission || hasPermission(item.permission)) {
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        pathname === item.path ? "bg-red-800 text-white" : "text-white hover:bg-red-600"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                }
                return null
              })}

              {/* Menu de administração móvel */}
              {adminMenuItems.some((item) => !item.permission || hasPermission(item.permission)) && (
                <div className="pt-4 pb-3 border-t border-red-800">
                  <div className="px-2">
                    <p className="text-white font-medium">Administração</p>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    {adminMenuItems.map((item) => {
                      if (!item.permission || hasPermission(item.permission)) {
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-600"
                          >
                            {item.label}
                          </Link>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-red-800">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-red-600">
                    <span className="text-lg font-medium leading-none text-white">
                      {currentUser?.fullName.charAt(0)}
                    </span>
                  </span>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{currentUser?.fullName}</div>
                  <div className="text-sm font-medium text-red-300">{currentUser?.email}</div>
                </div>
                <NotificationCenter />
              </div>
              <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={logout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-600"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow bg-gray-50">
        <PageTransition>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</div>
        </PageTransition>
      </main>
    </div>
  )
}

