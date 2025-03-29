export type PermissionType =
  // Permissões de visualização
  | "view_pagamentos"
  | "view_relatorio_divida"
  | "view_relatorio_fornecedor"
  | "view_relatorio_financeiro"
  | "view_fundo_maneio"
  | "view_reconciliacao_bancaria"
  | "view_reconciliacao_interna"
  | "view_controlo_cheques"
  | "view_previsao_orcamento"
  | "view_workflow"
  | "view_calendario_fiscal"
  | "view_documentos_pendentes"

  // Permissões de edição
  | "edit_pagamentos"
  | "edit_fundo_maneio"
  | "edit_reconciliacao_bancaria"
  | "edit_reconciliacao_interna"
  | "edit_controlo_cheques"
  | "edit_previsao_orcamento"

  // Permissões de aprovação
  | "approve_pagamentos"
  | "approve_fundo_maneio"

  // Permissões de administração
  | "manage_users"
  | "manage_permissions"
  | "manage_workflow"
  | "manage_backup"
  | "manage_system"

export interface PermissionGroup {
  id: string
  name: string
  description: string
  permissions: PermissionType[]
}

// Permissões padrão para cada função
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionType[]> = {
  admin: [
    "view_pagamentos",
    "edit_pagamentos",
    "approve_pagamentos",
    "view_relatorio_divida",
    "view_relatorio_fornecedor",
    "view_relatorio_financeiro",
    "view_fundo_maneio",
    "edit_fundo_maneio",
    "approve_fundo_maneio",
    "view_reconciliacao_bancaria",
    "edit_reconciliacao_bancaria",
    "view_reconciliacao_interna",
    "edit_reconciliacao_interna",
    "view_controlo_cheques",
    "edit_controlo_cheques",
    "view_previsao_orcamento",
    "edit_previsao_orcamento",
    "view_workflow",
    "view_calendario_fiscal",
    "view_documentos_pendentes",
    "manage_users",
    "manage_permissions",
    "manage_workflow",
    "manage_backup",
    "manage_system",
  ],
  financial_director: [
    "view_pagamentos",
    "edit_pagamentos",
    "approve_pagamentos",
    "view_relatorio_divida",
    "view_relatorio_fornecedor",
    "view_relatorio_financeiro",
    "view_fundo_maneio",
    "edit_fundo_maneio",
    "approve_fundo_maneio",
    "view_reconciliacao_bancaria",
    "edit_reconciliacao_bancaria",
    "view_reconciliacao_interna",
    "edit_reconciliacao_interna",
    "view_controlo_cheques",
    "edit_controlo_cheques",
    "view_previsao_orcamento",
    "edit_previsao_orcamento",
    "view_workflow",
    "view_calendario_fiscal",
    "view_documentos_pendentes",
  ],
  rector: ["view_pagamentos", "approve_pagamentos", "view_relatorio_financeiro", "view_workflow"],
  user: ["view_pagamentos", "view_relatorio_divida", "view_relatorio_fornecedor"],
}

// Grupos de permissões predefinidos
export const PREDEFINED_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "financial_analyst",
    name: "Analista Financeiro",
    description: "Acesso a relatórios e análises financeiras",
    permissions: [
      "view_pagamentos",
      "view_relatorio_divida",
      "view_relatorio_fornecedor",
      "view_relatorio_financeiro",
      "view_previsao_orcamento",
    ],
  },
  {
    id: "payment_manager",
    name: "Gestor de Pagamentos",
    description: "Gerencia pagamentos e aprovações",
    permissions: ["view_pagamentos", "edit_pagamentos", "view_relatorio_fornecedor", "view_workflow"],
  },
  {
    id: "reconciliation_manager",
    name: "Gestor de Reconciliações",
    description: "Gerencia reconciliações bancárias e internas",
    permissions: [
      "view_reconciliacao_bancaria",
      "edit_reconciliacao_bancaria",
      "view_reconciliacao_interna",
      "edit_reconciliacao_interna",
    ],
  },
  {
    id: "treasury_manager",
    name: "Gestor de Tesouraria",
    description: "Gerencia fundos de maneio e controle de cheques",
    permissions: ["view_fundo_maneio", "edit_fundo_maneio", "view_controlo_cheques", "edit_controlo_cheques"],
  },
  {
    id: "document_manager",
    name: "Gestor de Documentos",
    description: "Gerencia documentos pendentes e calendário fiscal",
    permissions: ["view_documentos_pendentes", "view_calendario_fiscal"],
  },
]

