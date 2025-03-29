"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppContext } from "@/contexts/AppContext"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle } from "lucide-react"

export function NotificationCenter() {
  const { notifications, markNotificationAsRead, currentUser } = useAppContext()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Filtrar notificações para o usuário atual
  const userNotifications = notifications.filter(
    (notification) => notification.userId === currentUser?.username || notification.userId === "all",
  )

  // Contar notificações não lidas
  const unreadCount = userNotifications.filter((notification) => !notification.read).length

  const handleNotificationClick = (notificationId: string, actionUrl?: string) => {
    markNotificationAsRead(notificationId)

    if (actionUrl) {
      router.push(actionUrl)
    }

    setOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment_approval":
        return <Badge className="bg-yellow-500">Aprovação</Badge>
      case "payment_approved":
        return <Badge className="bg-green-500">Aprovado</Badge>
      case "payment_rejected":
        return <Badge className="bg-red-500">Rejeitado</Badge>
      default:
        return <Badge>Notificação</Badge>
    }
  }

  // Adicione uma função para determinar o ícone e a cor da notificação com base no tipo
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "payment_approval":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        }
      case "payment_rejected":
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        }
      default:
        return {
          icon: <Bell className="h-5 w-5 text-blue-500" />,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium">Notificações</h3>
          {unreadCount > 0 ? (
            <p className="text-sm text-gray-500">{unreadCount} não lidas</p>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma notificação não lida</p>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {userNotifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {userNotifications.map((notification) => {
                const style = getNotificationStyle(notification.type)
                return (
                  <div
                    key={notification.id}
                    className={`p-4 mb-2 rounded-lg border ${style.bgColor} ${style.borderColor} ${notification.read ? "opacity-70" : ""}`}
                    onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">{style.icon}</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(notification.date).toLocaleString()}</p>
                      </div>
                      {!notification.read && (
                        <div className="ml-2 flex-shrink-0">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">Nenhuma notificação</div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

