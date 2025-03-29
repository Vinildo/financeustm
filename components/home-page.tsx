"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface HomePageProps {
  onSelectUserType: (userType: "user" | "admin") => void
}

export function HomePage({ onSelectUserType }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">FINANCE-VM</CardTitle>
          <CardDescription className="text-center">Selecione o tipo de acesso para continuar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={() => onSelectUserType("user")}>
            Acesso Usuário
          </Button>
          <Button className="w-full" onClick={() => onSelectUserType("admin")}>
            Acesso Administrador
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

