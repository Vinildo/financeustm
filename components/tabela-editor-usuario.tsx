"use client"

// Adicione a importação do useAppContext no topo do arquivo
import { useAppContext } from "@/contexts/AppContext"
import { useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

// Modifique a função TabelaEditorUsuario para incluir a sincronização
export function TabelaEditorUsuario() {
  const { users, addUser, updateUser, deleteUser, syncUsersWithSupabase } = useAppContext()

  // Adicione este useEffect para tentar sincronizar com o Supabase ao carregar
  useEffect(() => {
    const syncData = async () => {
      try {
        const success = await syncUsersWithSupabase()
        if (success) {
          toast({
            title: "Sincronização concluída",
            description: "Os dados foram sincronizados com o Supabase com sucesso.",
          })
        } else {
          toast({
            title: "Erro de sincronização",
            description: "Não foi possível sincronizar com o Supabase. Usando dados locais.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Erro ao sincronizar:", error)
        toast({
          title: "Erro de sincronização",
          description: "Ocorreu um erro ao tentar sincronizar com o Supabase.",
          variant: "destructive",
        })
      }
    }

    syncData()
  }, [syncUsersWithSupabase])

  // Resto do código permanece o mesmo...
}

