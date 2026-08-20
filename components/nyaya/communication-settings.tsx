"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Settings, Mail, MessageSquare, Bell } from "lucide-react"

export function CommunicationSettings() {
  const [settings, setSettings] = React.useState({
    email: true,
    sms: false,
    whatsapp: true,
    push: true,
  })

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Communication Preferences
        </CardTitle>
        <CardDescription>Choose how you want to receive updates.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="email-notif">Email Notifications</Label>
              <p className="text-[10px] text-muted-foreground">Receive detailed case updates via email</p>
            </div>
          </div>
          <Switch 
            id="email-notif" 
            checked={settings.email} 
            onCheckedChange={() => toggleSetting('email')} 
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="sms-notif">SMS Alerts</Label>
              <p className="text-[10px] text-muted-foreground">Urgent alerts and deadlines</p>
            </div>
          </div>
          <Switch 
            id="sms-notif" 
            checked={settings.sms} 
            onCheckedChange={() => toggleSetting('sms')} 
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-green-500" />
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp-notif">WhatsApp Messages</Label>
              <p className="text-[10px] text-muted-foreground">Convenient updates and document sharing</p>
            </div>
          </div>
          <Switch 
            id="whatsapp-notif" 
            checked={settings.whatsapp} 
            onCheckedChange={() => toggleSetting('whatsapp')} 
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="push-notif">In-App Notifications</Label>
              <p className="text-[10px] text-muted-foreground">Real-time updates while using the app</p>
            </div>
          </div>
          <Switch 
            id="push-notif" 
            checked={settings.push} 
            onCheckedChange={() => toggleSetting('push')} 
          />
        </div>
      </CardContent>
    </Card>
  )
}
