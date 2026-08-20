"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Mail, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react"

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  channel: "in-app" | "email" | "sms" | "whatsapp"
  timestamp: string
  read: boolean
}

interface NotificationCenterProps {
  notifications?: NotificationItem[]
  onMarkAsRead?: (id: string) => void
}

export function NotificationCenter({ notifications = [], onMarkAsRead }: NotificationCenterProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "error": return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default: return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-3 w-3" />
      case "sms":
      case "whatsapp": return <MessageSquare className="h-3 w-3" />
      default: return <Bell className="h-3 w-3" />
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notification Center
        </CardTitle>
        <CardDescription>Updates across all communication channels.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[300px] px-6 pb-6">
          <div className="flex flex-col gap-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                No new notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`flex gap-3 p-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                    notif.read ? 'bg-muted/30 border-transparent' : 'bg-card border-border shadow-sm'
                  }`}
                  onClick={() => onMarkAsRead?.(notif.id)}
                >
                  <div className="mt-0.5">{getIcon(notif.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {getChannelIcon(notif.channel)} {notif.timestamp}
                      </span>
                    </div>
                    <p className={`text-xs ${notif.read ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
