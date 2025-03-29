import { createClient } from "@supabase/supabase-js"

// Estas variáveis de ambiente devem ser configuradas no seu ambiente de produção
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Verificar se estamos no lado do cliente
const isBrowser = typeof window !== "undefined"

// Criar o cliente Supabase apenas se as credenciais estiverem disponíveis
// ou se estivermos no lado do cliente
let supabaseClient: ReturnType<typeof createClient> | null = null

// Função para obter o cliente Supabase
export const getSupabase = () => {
  // Se já temos um cliente, retorná-lo
  if (supabaseClient) {
    return supabaseClient
  }

  // Verificar se as credenciais estão disponíveis
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isBrowser) {
      console.warn("Credenciais do Supabase não encontradas. Verifique suas variáveis de ambiente.")
    }
    return null
  }

  // Criar o cliente
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

// Para compatibilidade com código existente
export const supabase = {
  from: (table: string) => {
    const client = getSupabase()
    if (!client) {
      // Retornar um objeto mock que não faz nada
      return {
        select: () => Promise.resolve({ data: null, error: new Error("Supabase não inicializado") }),
        insert: () => Promise.resolve({ data: null, error: new Error("Supabase não inicializado") }),
        update: () => Promise.resolve({ data: null, error: new Error("Supabase não inicializado") }),
        delete: () => Promise.resolve({ data: null, error: new Error("Supabase não inicializado") }),
        upsert: () => Promise.resolve({ data: null, error: new Error("Supabase não inicializado") }),
        eq: () => ({ data: null, error: new Error("Supabase não inicializado") }),
        neq: () => ({ data: null, error: new Error("Supabase não inicializado") }),
      }
    }
    return client.from(table)
  },
  auth: {
    signIn: () => {
      const client = getSupabase()
      if (!client) {
        return Promise.resolve({ data: null, error: new Error("Supabase não inicializado") })
      }
      return client.auth.signInWithPassword
    },
    signOut: () => {
      const client = getSupabase()
      if (!client) {
        return Promise.resolve({ error: new Error("Supabase não inicializado") })
      }
      return client.auth.signOut()
    },
    onAuthStateChange: (callback: any) => {
      const client = getSupabase()
      if (!client) {
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
      return client.auth.onAuthStateChange(callback)
    },
  },
  storage: {
    from: (bucket: string) => {
      const client = getSupabase()
      if (!client) {
        return {
          upload: () => Promise.resolve({ data: null, error: new Error("Supabase não inicializado") }),
          download: () => Promise.resolve({ data: null, error: new Error("Supabase não inicializado") }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }
      }
      return client.storage.from(bucket)
    },
  },
  rpc: (fn: string, params: any) => {
    const client = getSupabase()
    if (!client) {
      return Promise.resolve({ data: null, error: new Error("Supabase não inicializado") })
    }
    return client.rpc(fn, params)
  },
}

// Função para verificar a conexão com o Supabase
export async function checkSupabaseConnection() {
  try {
    const client = getSupabase()
    if (!client) {
      return false
    }

    const { data, error } = await client.from("health_check").select("*").limit(1)

    if (error) {
      console.error("Erro ao verificar conexão com Supabase:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao verificar conexão com Supabase:", error)
    return false
  }
}

export const isSupabaseConfigured = () => {
  return supabaseUrl !== "" && supabaseAnonKey !== ""
}

export const testSupabaseConnection = async () => {
  try {
    const client = getSupabase()
    if (!client) {
      return {
        success: false,
        message: "Credenciais do Supabase não encontradas. Verifique suas variáveis de ambiente.",
      }
    }

    const { data, error } = await client.from("health_check").select("*").limit(1)
    if (error) throw error
    return { success: true, message: "Conexão com Supabase estabelecida com sucesso!" }
  } catch (error: any) {
    console.error("Erro ao testar conexão com Supabase:", error)
    return {
      success: false,
      message: `Falha na conexão com Supabase: ${error.message || "Erro desconhecido"}`,
    }
  }
}

