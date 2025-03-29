"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppContext } from "@/contexts/AppContext"
import { User } from "lucide-react"
import { SwitchUserDialog } from "@/components/switch-user-dialog"

interface UserSwitchProps {
  onSwitchUser: (userId: string) => void
}

export function UserSwitch({ onSwitchUser }: UserSwitchProps) {
  const { users, currentUser, isAdmin } = useAppContext()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  if (!isAdmin()) return null

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId)
    setIsOpen(false)
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="text-white hover:bg-red-700">
            <User className="mr-2 h-4 w-4" />
            Trocar Usuário
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Trocar para</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {users
            .filter((user) => user.id !== currentUser?.id && user.isActive)
            .map((user) => (
              <DropdownMenuItem key={user.id} onClick={() => handleUserSelect(user.id)}>
                {user.fullName} ({user.role})
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedUserId && (
        <SwitchUserDialog userId={selectedUserId} onClose={() => setSelectedUserId(null)} onSwitchUser={onSwitchUser} />
      )}
    </>
  )
}

