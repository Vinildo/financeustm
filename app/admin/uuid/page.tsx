"use client"

import { GeradorUUID } from "@/components/gerador-uuid"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UUIDPage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader className="bg-gray-100">
          <CardTitle>Geração de UUIDs com Supabase</CardTitle>
          <CardDescription>Ferramenta para gerar e validar UUIDs usando o Supabase</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <GeradorUUID />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-gray-100">
          <CardTitle>Instruções para Configuração</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. Configurar Funções no Supabase</h3>
            <p className="text-gray-700 mb-2">
              Execute o seguinte SQL no console do Supabase para criar as funções necessárias:
            </p>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
              {`-- Habilitar a extensão uuid-ossp se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para gerar UUID v4
CREATE OR REPLACE FUNCTION gerar_uuid()
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT uuid_generate_v4();
$$;

-- Função para verificar se uma string é um UUID válido
CREATE OR REPLACE FUNCTION is_valid_uuid(uuid text)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT $1 ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
$$;`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">2. Uso no Código</h3>
            <p className="text-gray-700 mb-2">Importe as funções e use-as em seu código:</p>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
              {`import { gerarUUIDSupabase, validarUUIDSupabase } from "@/lib/supabase-uuid"

// Gerar um novo UUID
const id = await gerarUUIDSupabase()

// Validar um UUID
const isValid = await validarUUIDSupabase(id)`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">3. Fallback Automático</h3>
            <p className="text-gray-700">
              Se o Supabase não estiver disponível, as funções usarão automaticamente a biblioteca uuid para gerar e
              validar UUIDs localmente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

