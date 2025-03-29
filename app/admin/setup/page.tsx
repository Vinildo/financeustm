import { AdminSetup } from "@/components/admin-setup"

export default function AdminSetupPage() {
  return (
    <div className="container mx-auto py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Configuração do Administrador</h1>
      <AdminSetup />
    </div>
  )
}

