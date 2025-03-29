import { TabelaEditorUsuario } from "@/components/tabela-editor-usuario"

export default function EditorUsuarioPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Editor de Usuários</h1>
      <TabelaEditorUsuario />
    </div>
  )
}

