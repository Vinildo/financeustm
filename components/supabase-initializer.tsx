"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabase, testSupabaseConnection } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

// Em vez de importar o arquivo SQL, vamos definir o esquema como uma string
const schemaSQL = `
-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  force_password_change BOOLEAN DEFAULT TRUE,
  permissions TEXT[] DEFAULT '{}',
  permission_groups TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  nuit TEXT,
  conta_bancaria TEXT,
  banco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id TEXT PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  data DATE NOT NULL,
  metodo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  comprovante_url TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de workflow
CREATE TABLE IF NOT EXISTS workflow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pagamento_id TEXT NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  current_step INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de passos do workflow
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflow(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  role TEXT NOT NULL,
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de receitas
CREATE TABLE IF NOT EXISTS receitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao TEXT NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  data DATE NOT NULL,
  categoria TEXT NOT NULL,
  fonte TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de fundos de manejo
CREATE TABLE IF NOT EXISTS fundos_manejo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao TEXT NOT NULL,
  valor_inicial DECIMAL(15, 2) NOT NULL,
  valor_atual DECIMAL(15, 2) NOT NULL,
  data_criacao DATE NOT NULL,
  responsavel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de movimentos de fundos
CREATE TABLE IF NOT EXISTS movimentos_fundos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fundo_id UUID NOT NULL REFERENCES fundos_manejo(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'entrada' ou 'saida'
  valor DECIMAL(15, 2) NOT NULL,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  pagamento_id TEXT REFERENCES pagamentos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id TEXT,
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de cheques
CREATE TABLE IF NOT EXISTS cheques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero TEXT NOT NULL,
  banco TEXT NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  data_emissao DATE NOT NULL,
  data_vencimento DATE,
  beneficiario TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'emitido',
  pagamento_id TEXT REFERENCES pagamentos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de transações bancárias
CREATE TABLE IF NOT EXISTS transacoes_bancarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL, -- 'entrada' ou 'saida'
  valor DECIMAL(15, 2) NOT NULL,
  data DATE NOT NULL,
  banco TEXT NOT NULL,
  conta TEXT NOT NULL,
  descricao TEXT NOT NULL,
  referencia TEXT,
  pagamento_id TEXT REFERENCES pagamentos(id) ON DELETE SET NULL,
  receita_id UUID REFERENCES receitas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de verificação de saúde (para verificar a conexão)
CREATE TABLE IF NOT EXISTS health_check (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'ok',
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir um registro na tabela de verificação de saúde
INSERT INTO health_check (status) VALUES ('ok') ON CONFLICT DO NOTHING;

-- Criar função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualizar o timestamp de updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_updated_at BEFORE UPDATE ON workflow FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receitas_updated_at BEFORE UPDATE ON receitas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fundos_manejo_updated_at BEFORE UPDATE ON fundos_manejo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_movimentos_fundos_updated_at BEFORE UPDATE ON movimentos_fundos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notificacoes_updated_at BEFORE UPDATE ON notificacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cheques_updated_at BEFORE UPDATE ON cheques FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transacoes_bancarias_updated_at BEFORE UPDATE ON transacoes_bancarias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar usuários padrão
INSERT INTO users (id, username, password, full_name, email, role, is_active, force_password_change)
VALUES 
  ('1', 'admin', 'admin', 'Administrador', 'admin@example.com', 'admin', true, false),
  ('2', 'diretora.financeira', '123456', 'Diretora Financeira', 'diretora@example.com', 'financial_director', true, false),
  ('3', 'reitor', '123456', 'Reitor', 'reitor@example.com', 'rector', true, false),
  ('4', 'Vinildo Mondlane', 'Vinildo123456', 'Vinildo Mondlane', 'v.mondlane1@gmail.com', 'admin', true, false)
ON CONFLICT (id) DO NOTHING;
`

export function SupabaseInitializer() {
  const [status, setStatus] = useState<string>("")
  const [isInitializing, setIsInitializing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [backupData, setBackupData] = useState("")
  const [restoreData, setRestoreData] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null)

  const testConnection = async () => {
    setStatus("Testando conexão com o Supabase...")
    const result = await testSupabaseConnection()
    setConnectionStatus(result)
    setStatus(result.message)
  }

  const initializeDatabase = async () => {
    try {
      setIsInitializing(true)
      setStatus("Iniciando inicialização do banco de dados...")
      setProgress(10)

      // Obter o cliente Supabase
      const supabase = getSupabase()
      if (!supabase) {
        throw new Error("Não foi possível inicializar o cliente Supabase. Verifique suas credenciais.")
      }

      // Executar o esquema SQL
      const { error } = await supabase.rpc("execute_sql", { sql: schemaSQL })

      if (error) {
        throw new Error(`Erro ao executar o esquema SQL: ${error.message}`)
      }

      setProgress(90)
      setStatus("Banco de dados inicializado com sucesso!")
      setProgress(100)
    } catch (error: any) {
      setStatus(`Erro ao inicializar o banco de dados: ${error.message}`)
    } finally {
      setIsInitializing(false)
    }
  }

  const backupDatabase = async () => {
    try {
      setStatus("Iniciando backup do banco de dados...")
      setIsInitializing(true)
      setProgress(10)

      // Obter o cliente Supabase
      const supabase = getSupabase()
      if (!supabase) {
        throw new Error("Não foi possível inicializar o cliente Supabase. Verifique suas credenciais.")
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
        setStatus(`Fazendo backup da tabela ${table}...`)
        const { data, error } = await supabase.from(table).select("*")

        if (error) {
          throw new Error(`Erro ao fazer backup da tabela ${table}: ${error.message}`)
        }

        backup[table] = data
        setProgress(10 + (80 * tables.indexOf(table)) / tables.length)
      }

      setBackupData(JSON.stringify(backup, null, 2))
      setStatus("Backup concluído com sucesso!")
      setProgress(100)
    } catch (error: any) {
      setStatus(`Erro ao fazer backup: ${error.message}`)
    } finally {
      setIsInitializing(false)
    }
  }

  const restoreDatabase = async () => {
    try {
      if (!restoreData) {
        setStatus("Nenhum dado de restauração fornecido.")
        return
      }

      setStatus("Iniciando restauração do banco de dados...")
      setIsInitializing(true)
      setProgress(10)

      // Obter o cliente Supabase
      const supabase = getSupabase()
      if (!supabase) {
        throw new Error("Não foi possível inicializar o cliente Supabase. Verifique suas credenciais.")
      }

      // Analisar os dados de restauração
      const data = JSON.parse(restoreData)
      const tables = Object.keys(data)

      for (const table of tables) {
        setStatus(`Restaurando tabela ${table}...`)

        // Limpar a tabela primeiro
        const { error: clearError } = await supabase.from(table).delete().neq("id", "dummy")

        if (clearError) {
          throw new Error(`Erro ao limpar a tabela ${table}: ${clearError.message}`)
        }

        // Inserir os dados
        if (data[table].length > 0) {
          const { error: insertError } = await supabase.from(table).insert(data[table])

          if (insertError) {
            throw new Error(`Erro ao inserir dados na tabela ${table}: ${insertError.message}`)
          }
        }

        setProgress(10 + (80 * tables.indexOf(table)) / tables.length)
      }

      setStatus("Restauração concluída com sucesso!")
      setProgress(100)
    } catch (error: any) {
      setStatus(`Erro ao restaurar: ${error.message}`)
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerenciamento do Banco de Dados Supabase</CardTitle>
        <CardDescription>Inicialize, faça backup e restaure o banco de dados Supabase</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="connection">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connection">Conexão</TabsTrigger>
            <TabsTrigger value="initialization">Inicialização</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="restore">Restauração</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <p>Teste a conexão com o Supabase antes de prosseguir.</p>
            <Button onClick={testConnection}>Testar Conexão</Button>

            {connectionStatus && (
              <div className={`p-4 rounded-md ${connectionStatus.success ? "bg-green-100" : "bg-red-100"}`}>
                {connectionStatus.message}
              </div>
            )}
          </TabsContent>

          <TabsContent value="initialization" className="space-y-4">
            <p>
              Inicialize o banco de dados Supabase com as tabelas necessárias.
              <strong> Atenção: </strong> Isso não afetará os dados existentes, apenas criará tabelas que não existem.
            </p>
            <Button onClick={initializeDatabase} disabled={isInitializing}>
              Inicializar Banco de Dados
            </Button>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <p>Faça backup de todos os dados do banco de dados.</p>
            <Button onClick={backupDatabase} disabled={isInitializing}>
              Fazer Backup
            </Button>

            {backupData && (
              <div className="mt-4">
                <p>Copie e salve estes dados em um local seguro:</p>
                <Textarea value={backupData} readOnly className="h-64 font-mono text-xs" />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(backupData)
                    setStatus("Dados copiados para a área de transferência!")
                  }}
                  className="mt-2"
                  variant="outline"
                >
                  Copiar para Área de Transferência
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="restore" className="space-y-4">
            <p>Restaure o banco de dados a partir de um backup anterior.</p>
            <Textarea
              value={restoreData}
              onChange={(e) => setRestoreData(e.target.value)}
              placeholder="Cole os dados de backup aqui..."
              className="h-64 font-mono text-xs"
            />
            <Button onClick={restoreDatabase} disabled={isInitializing || !restoreData}>
              Restaurar Banco de Dados
            </Button>
          </TabsContent>
        </Tabs>

        {status && (
          <div className="mt-4 p-4 rounded-md bg-gray-100">
            <p>{status}</p>
            {isInitializing && <Progress value={progress} className="mt-2" />}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">
          Certifique-se de que as variáveis de ambiente do Supabase estão configuradas corretamente.
        </p>
      </CardFooter>
    </Card>
  )
}

