"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Clipboard, RefreshCw, Check, X } from "lucide-react"
import { gerarUUIDSupabase, validarUUIDSupabase } from "@/lib/supabase-uuid"
import { toast } from "@/components/ui/use-toast"

export function GeradorUUID() {
  const [uuid, setUuid] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [uuidParaValidar, setUuidParaValidar] = useState<string>("")
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isValidating, setIsValidating] = useState<boolean>(false)

  const gerarNovoUUID = async () => {
    setIsLoading(true)
    try {
      const novoUUID = await gerarUUIDSupabase()
      setUuid(novoUUID)
    } catch (error) {
      console.error("Erro ao gerar UUID:", error)
      toast({
        title: "Erro ao gerar UUID",
        description: "Ocorreu um erro ao gerar o UUID. Verifique o console para mais detalhes.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copiarUUID = () => {
    if (!uuid) return

    navigator.clipboard.writeText(uuid)
    toast({
      title: "UUID copiado",
      description: "O UUID foi copiado para a área de transferência.",
    })
  }

  const validarUUID = async () => {
    if (!uuidParaValidar) {
      setIsValid(null)
      return
    }

    setIsValidating(true)
    try {
      const resultado = await validarUUIDSupabase(uuidParaValidar)
      setIsValid(resultado)
    } catch (error) {
      console.error("Erro ao validar UUID:", error)
      toast({
        title: "Erro ao validar UUID",
        description: "Ocorreu um erro ao validar o UUID. Verifique o console para mais detalhes.",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de UUID</CardTitle>
          <CardDescription>Gere UUIDs usando o Supabase com fallback para geração local</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              value={uuid}
              readOnly
              placeholder="Clique em 'Gerar UUID' para criar um novo UUID"
              className="font-mono"
            />
            <Button variant="outline" onClick={copiarUUID} disabled={!uuid}>
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={gerarNovoUUID} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Gerar UUID
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validador de UUID</CardTitle>
          <CardDescription>Verifique se uma string é um UUID válido</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uuid-validar">UUID para validar</Label>
            <Input
              id="uuid-validar"
              value={uuidParaValidar}
              onChange={(e) => setUuidParaValidar(e.target.value)}
              placeholder="Digite um UUID para validar"
              className="font-mono"
            />
          </div>

          {isValid !== null && (
            <div className="flex items-center space-x-2">
              <span>Resultado:</span>
              {isValid ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="mr-1 h-4 w-4" />
                  UUID Válido
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <X className="mr-1 h-4 w-4" />
                  UUID Inválido
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={validarUUID} disabled={isValidating}>
            {isValidating ? "Validando..." : "Validar UUID"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

