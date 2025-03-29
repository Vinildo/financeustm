"use client"

// Definição de tipos para o toast
type ToastProps = {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

// Hook para usar o toast
export function useToast() {
  return {
    toast: (props: ToastProps) => {
      // Implementação silenciosa que não mostra nada
      // Isso evita qualquer tipo de pop-up ou alerta
      console.log(`Toast: ${props.title} - ${props.description || ""}`)
    },
    dismiss: (toastId?: string) => {
      // Não faz nada, apenas uma implementação vazia
      console.log(`Dismiss toast: ${toastId || "all"}`)
    },
  }
}

// Implementação simplificada que não usa alertas externos
export function toast(props: ToastProps) {
  // Implementação silenciosa que não mostra nada
  // Isso evita qualquer tipo de pop-up ou alerta
  console.log(`Toast: ${props.title} - ${props.description || ""}`)

  // Não fazemos nada, apenas registramos no console para depuração
  // Sem alertas, sem pop-ups
}

