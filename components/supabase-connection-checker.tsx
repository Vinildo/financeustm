"use client"

import { useEffect, useState } from "react"
import { checkSupabaseConnection } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export function SupabaseConnectionChecker() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsChecking(true)
        const connected = await checkSupabaseConnection()
        setIsConnected(connected)
      } catch (error) {
        console.error("Erro ao verificar conexão com Supabase:", error)
        setIsConnected(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkConnection()
  }, [])

  if (isChecking) {
    return null
  }

  if (isConnected === null) {
    return null
  }

  return (
    <div className="mb-4">
      {isConnected ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Conectado ao Supabase</AlertTitle>
          <AlertDescription className="text-green-700">
            A conexão com o Supabase está funcionando corretamente.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Falha na conexão com Supabase</AlertTitle>
          <AlertDescription>
            Não foi possível conectar ao Supabase. O sistema está operando no modo offline.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

