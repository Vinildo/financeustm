"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface HelpTopic {
  id: string
  title: string
  content: string
}

const helpTopics: HelpTopic[] = [
  {
    id: "pagamentos",
    title: "Gestão de Pagamentos",
    content:
      'Nesta secção pode gerir todos os pagamentos, filtrar por estado, fornecedor ou data. Para registar um novo pagamento, clique no botão "Novo Pagamento".',
  },
  {
    id: "cheques",
    title: "Emissão de Cheques",
    content:
      'Para emitir um cheque, selecione o método de pagamento "Cheque" ao registar ou editar um pagamento. Preencha os dados do cheque no formulário que aparece.',
  },
  {
    id: "fundo-maneio",
    title: "Fundo de Maneio",
    content:
      "O fundo de maneio permite gerir pequenas despesas. Ao selecionar este método de pagamento, o sistema irá verificar se existe saldo disponível.",
  },
  {
    id: "reconciliacao",
    title: "Reconciliação Bancária",
    content:
      "A reconciliação bancária permite comparar os movimentos registados no sistema com os extratos bancários. Utilize esta funcionalidade para garantir que todos os movimentos estão corretamente registados.",
  },
]

export function HelpSystem() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTopic, setActiveTopic] = useState<HelpTopic | null>(null)

  const toggleHelp = () => {
    setIsOpen(!isOpen)
    if (!isOpen && !activeTopic) {
      setActiveTopic(helpTopics[0])
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-white shadow-md hover:bg-gray-100"
        onClick={toggleHelp}
      >
        <HelpCircle className="h-6 w-6 text-red-700" />
      </Button>

      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Ajuda</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {helpTopics.map((topic) => (
                  <Button
                    key={topic.id}
                    variant={activeTopic?.id === topic.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTopic(topic)}
                  >
                    {topic.title}
                  </Button>
                ))}
              </div>
              {activeTopic && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">{activeTopic.title}</h3>
                  <p className="text-sm text-gray-700">{activeTopic.content}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

