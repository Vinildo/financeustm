import { getSupabase } from "@/lib/supabase"

export class SupabaseService {
  static async isDatabaseInitialized(): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return false
      }

      // Verificar se a tabela de usuários existe
      const { data, error } = await supabase.from("users").select("id").limit(1)

      if (error) {
        console.error("Erro ao verificar inicialização do banco de dados:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Erro ao verificar inicialização do banco de dados:", error)
      return false
    }
  }

  static async initializeDatabase(schema: string): Promise<{ success: boolean; error?: any }> {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return { success: false, error: new Error("Cliente Supabase não inicializado") }
      }

      // Executar o esquema SQL
      const { error } = await supabase.rpc("execute_sql", { sql: schema })

      if (error) {
        console.error("Erro ao inicializar banco de dados:", error)
        return { success: false, error }
      }

      return { success: true }
    } catch (error) {
      console.error("Erro ao inicializar banco de dados:", error)
      return { success: false, error }
    }
  }

  static async backupData(): Promise<{ data: any; error?: any; timestamp: string }> {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return {
          data: null,
          error: new Error("Cliente Supabase não inicializado"),
          timestamp: new Date().toISOString(),
        }
      }

      // Obter dados de todas as tabelas
      const tables = [
        "users",
        "fornecedores",
        "pagamentos",
        "workflow",
        "workflow_steps",
        "receitas",
        "fundos_manejo",
        "movimentos_fundos",
        "notificacoes",
        "cheques",
        "transacoes_bancarias",
      ]

      const backup: Record<string, any> = {}

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*")

        if (error) {
          console.error(`Erro ao fazer backup da tabela ${table}:`, error)
          return { data: null, error, timestamp: new Date().toISOString() }
        }

        backup[table] = data
      }

      return { data: backup, timestamp: new Date().toISOString() }
    } catch (error) {
      console.error("Erro ao fazer backup:", error)
      return { data: null, error, timestamp: new Date().toISOString() }
    }
  }

  static async restoreData(data: Record<string, any>): Promise<{ success: boolean; error?: any }> {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return { success: false, error: new Error("Cliente Supabase não inicializado") }
      }

      // Restaurar dados para cada tabela
      const tables = Object.keys(data)

      for (const table of tables) {
        // Limpar a tabela primeiro
        const { error: clearError } = await supabase.from(table).delete().neq("id", "dummy")

        if (clearError) {
          console.error(`Erro ao limpar a tabela ${table}:`, clearError)
          return { success: false, error: clearError }
        }

        // Inserir os dados
        if (data[table].length > 0) {
          const { error: insertError } = await supabase.from(table).insert(data[table])

          if (insertError) {
            console.error(`Erro ao inserir dados na tabela ${table}:`, insertError)
            return { success: false, error: insertError }
          }
        }
      }

      return { success: true }
    } catch (error) {
      console.error("Erro ao restaurar dados:", error)
      return { success: false, error }
    }
  }
}

