import { GerenciadorPermissoes } from "@/components/gerenciador-permissoes"

export default function GerenciarPermissoesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Permissões</h1>
      <GerenciadorPermissoes />
    </div>
  )
}

