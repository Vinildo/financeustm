import { createClient } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

/**
 * Gera um UUID usando a função RPC do Supabase
 * Com fallback para geração local se o Supabase não estiver disponível
 */
export async function gerarUUIDSupabase(): Promise<string> {
  try {
    const supabase = createClient()

    // Tentar gerar UUID usando a função RPC do Supabase
    const { data, error } = await supabase.rpc("gerar_uuid")

    if (error) {
      console.warn("Erro ao gerar UUID via Supabase:", error.message)
      // Fallback para geração local
      return uuidv4()
    }

    return data
  } catch (error) {
    console.warn("Erro ao conectar com Supabase para gerar UUID:", error)
    // Fallback para geração local
    return uuidv4()
  }
}

/**
 * Valida se uma string é um UUID válido usando o Supabase
 * Com fallback para validação local se o Supabase não estiver disponível
 */
export async function validarUUIDSupabase(uuid: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Tentar validar UUID usando a função RPC do Supabase
    const { data, error } = await supabase.rpc("is_valid_uuid", { uuid })

    if (error) {
      console.warn("Erro ao validar UUID via Supabase:", error.message)
      // Fallback para validação local
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)
    }

    return data
  } catch (error) {
    console.warn("Erro ao conectar com Supabase para validar UUID:", error)
    // Fallback para validação local
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)
  }
}

