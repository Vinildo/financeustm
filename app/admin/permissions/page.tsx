import { PermissionManagement } from "@/components/permission-management"

export default function PermissionsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Permissões</h1>
      <PermissionManagement />
    </div>
  )
}

