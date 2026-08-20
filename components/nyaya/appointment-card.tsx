"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Video, Phone, User } from "lucide-react"

export interface Appointment {
  id: string
  lawyerName: string
  date: string
  time: string
  mode: "video" | "phone" | "in-person"
  status: "scheduled" | "proposed" | "completed" | "cancelled"
}

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "video": return <Video className="h-4 w-4" />
      case "phone": return <Phone className="h-4 w-4" />
      case "in-person": return <MapPin className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-green-100 text-green-800 border-green-200"
      case "proposed": return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed": return "bg-gray-100 text-gray-800 border-gray-200"
      case "cancelled": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{appointment.lawyerName}</p>
              <p className="text-xs text-muted-foreground capitalize">Legal Consultation</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-xs capitalize ${getStatusColor(appointment.status)}`}>
            {appointment.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm mt-4 bg-muted/30 p-3 rounded-lg border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{appointment.date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{appointment.time}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground col-span-2 mt-1">
            {getModeIcon(appointment.mode)}
            <span className="capitalize">{appointment.mode} Meeting</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
