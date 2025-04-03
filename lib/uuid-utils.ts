/**
 * Gera um UUID v4 válido compatível com o formato do Supabase
 * Esta função pode ser usada como fallback quando não for possível
 * usar a função RPC do Supabase
 */
export function gerarUUID(): string {
  // Usar a API nativa do navegador se disponível
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Implementação fallback para navegadores mais antigos
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Verifica se uma string é um UUID válido
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

