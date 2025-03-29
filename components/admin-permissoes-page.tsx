"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GerenciadorPermissoesSimples } from "@/components/gerenciador-permissoes-simples"
import { ConfigurarAdminRapido } from "@/components/configurar-admin-rapido"

export function AdminPermissoesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Administração de Permissões</h1>

      <Tabs defaultValue="gerenciar">
        <TabsList>
          <TabsTrigger value="gerenciar">Gerenciar Permissões</TabsTrigger>
          <TabsTrigger value="admin">Configurar Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="gerenciar" className="mt-4">
          <GerenciadorPermissoesSimples />
        </TabsContent>

        <TabsContent value="admin" className="mt-4">
          <ConfigurarAdminRapido />
        </TabsContent>
      </Tabs>
    </div>
  )
}

