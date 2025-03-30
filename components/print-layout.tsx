"use client"

import type { ReactNode } from "react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { useAuth } from "@/hooks/use-auth"

type PrintLayoutProps = {
  children: ReactNode
  title: string
}

export function PrintLayout({ children, title }: PrintLayoutProps) {
  const { user } = useAuth()
  const currentDateTime = new Date()

  return (
    <div className="print-content">
      <div className="print:block hidden">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="text-sm mb-4">
          Gerado em: {format(currentDateTime, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: pt })}
        </p>
      </div>

      {children}

      <div className="print:block hidden mt-8 text-sm text-gray-500 border-t pt-4">
        <p>FINANCE-VM - Criado por Vinildo Mondlane © 2025</p>
        <p>Processado por computador</p>
        <p>Usuário: {user?.username}</p>
        <p>Data e hora: {format(currentDateTime, "dd/MM/yyyy HH:mm:ss", { locale: pt })}</p>
        <div className="mt-4">
          <p>Preparado por: {user?.fullName || "N/A"}</p>
          <p>Assinatura: ____________________</p>
          <p>Data: {format(currentDateTime, "dd/MM/yyyy", { locale: pt })}</p>
        </div>
      </div>
    </div>
  )
}

