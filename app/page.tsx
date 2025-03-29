"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SimpleLogin } from "@/components/simple-login"
import { AppProvider } from "@/contexts/AppContext"

function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Verificar se há um usuário no localStorage
  useEffect(() => {
    const checkLocalUser = () => {
      try {
        const storedUser = localStorage.getItem("currentUser")
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          if (parsedUser) {
            console.log("Usuário encontrado no localStorage, redirecionando...")
            router.push("/dashboard")
            return true
          }
        }
        return false
      } catch (error) {
        console.error("Erro ao verificar usuário local:", error)
        return false
      } finally {
        setIsLoading(false)
      }
    }

    checkLocalUser()
  }, [router])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  return <SimpleLogin />
}

export default function Home() {
  return (
    <AppProvider>
      <HomePage />
    </AppProvider>
  )
}

