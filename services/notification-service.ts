import { inMemoryStore } from "@/lib/in-memory-store"

export class NotificationService {
  static async getNotifications(userId: string) {
    try {
      const notifications = inMemoryStore.getNotifications(userId)
      return { data: notifications, error: null }
    } catch (error) {
      console.error(`Erro ao buscar notificações para o usuário ${userId}:`, error)
      return { data: null, error }
    }
  }

  static async addNotification(notification: any) {
    try {
      const newNotification = inMemoryStore.addNotification(notification)
      return { data: newNotification, error: null }
    } catch (error) {
      console.error("Erro ao adicionar notificação:", error)
      return { data: null, error }
    }
  }

  static async markAsRead(id: string) {
    try {
      const success = inMemoryStore.markNotificationAsRead(id)
      if (!success) {
        throw new Error(`Notificação com ID ${id} não encontrada`)
      }
      return { error: null }
    } catch (error) {
      console.error(`Erro ao marcar notificação ${id} como lida:`, error)
      return { error }
    }
  }
}

