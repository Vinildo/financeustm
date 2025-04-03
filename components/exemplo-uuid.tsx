"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { gerarUUID } from "@/lib/supabase-client"
import { gerarUUID as gerarUUIDLocal, isValidUUID } from "@/lib/uuid-utils"

export default function ExemploUUID() {
  const [uuidSupabase, setUuidSupabase] = useState<string>("")
  const [uuidLocal, setUuidLocal] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGerarUUIDSupabase = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const uuid = await gerarUUID()
      setUuidSupabase(uuid)
    } catch (err) {
      setError("Erro ao gerar UUID com Supabase: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGerarUUIDLocal = () => {
    const uuid = gerarUUIDLocal()
    setUuidLocal(uuid)
  }

  return (
    <div className="p-6 space-y-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Gerador de UUID</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">UUID via Supabase</h3>
          <div className="flex items-center gap-4">
            <Button onClick={handleGerarUUIDSupabase} disabled={isLoading}>
              {isLoading ? "Gerando..." : "Gerar UUID (Supabase)"}
            </Button>
            <div className="flex-1 p-2 bg-gray-50 rounded border">
              {uuidSupabase || "Clique no botão para gerar um UUID"}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          {uuidSupabase && (
            <p className="text-sm mt-1">
              Válido:{" "}
              <span className={isValidUUID(uuidSupabase) ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {isValidUUID(uuidSupabase) ? "Sim" : "Não"}
              </span>
            </p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">UUID Local (Fallback)</h3>
          <div className="flex items-center gap-4">
            <Button onClick={handleGerarUUIDLocal}>Gerar UUID (Local)</Button>
            <div className="flex-1 p-2 bg-gray-50 rounded border">
              {uuidLocal || "Clique no botão para gerar um UUID"}
            </div>
          </div>
          {uuidLocal && (
            <p className="text-sm mt-1">
              Válido:{" "}
              <span className={isValidUUID(uuidLocal) ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {isValidUUID(uuidLocal) ? "Sim" : "Não"}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Como usar</h3>
        <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto text-sm">
          {`// Importar a função
import { gerarUUID } from '@/lib/supabase-client'

// Usar em uma função assíncrona
async function criarNovoPagamento() {
  const id = await gerarUUID()
  
  const novoPagamento = {
    id,
    // outros campos...
  }
  
  // Salvar no Supabase
  await salvarPagamento(novoPagamento)
}`}
        </pre>
      </div>
    </div>
  )
}

