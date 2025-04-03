import { createClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL ou Anon Key não definidos nas variáveis de ambiente")
}

// Criar cliente Supabase para uso no lado do cliente
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "")

// Função para salvar pagamento no Supabase
export async function salvarPagamento(pagamento: any) {
  try {
    // Garantir que o pagamento tenha um ID
    if (!pagamento.id) {
      throw new Error("ID do pagamento não definido")
    }

    const { data, error } = await supabase.from("pagamentos").insert(pagamento).select()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Erro ao salvar pagamento no Supabase:", error)
    throw error
  }
}

// Função para buscar pagamentos do Supabase
export async function buscarPagamentos() {
  try {
    const { data, error } = await supabase.from("pagamentos").select("*").order("data", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Erro ao buscar pagamentos do Supabase:", error)
    return []
  }
}

// Função para salvar cheque no Supabase
export async function salvarCheque(cheque: any) {
  try {
    // Garantir que o cheque tenha um ID e um pagamentoId
    if (!cheque.id) {
      throw new Error("ID do cheque não definido")
    }

    if (!cheque.pagamentoId) {
      throw new Error("ID do pagamento não definido no cheque")
    }

    const { data, error } = await supabase.from("cheques").insert(cheque).select()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Erro ao salvar cheque no Supabase:", error)
    throw error
  }
}

// Adicionar esta função no final do arquivo

// Função para gerar UUID válido usando o Supabase
export async function gerarUUID(): Promise<string> {
  try {
    // Chamar a função uuid_generate_v4() do PostgreSQL
    const { data, error } = await supabase.rpc("gerar_uuid")

    if (error) {
      console.error("Erro ao gerar UUID:", error)
      // Fallback para UUID gerado no cliente se houver erro
      return crypto.randomUUID()
    }

    return data
  } catch (error) {
    console.error("Erro ao gerar UUID:", error)
    // Fallback para UUID gerado no cliente
    return crypto.randomUUID()
  }
}

