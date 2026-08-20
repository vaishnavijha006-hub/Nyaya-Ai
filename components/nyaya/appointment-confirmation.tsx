"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, CalendarDays, ExternalLink } from "lucide-react"

interface AppointmentConfirmationProps {
  details: {
    date: string
    time: string
    mode: string
    lawyerName?: string
  }
  onViewCalendar?: () => void
}

export function AppointmentConfirmation({ details, onViewCalendar }: AppointmentConfirmationProps) {
  return (
    <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
      <CardContent className="p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-green-800 dark:text-green-300">Appointment Confirmed</h3>
          <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
            Your consultation with {details.lawyerName || "your representative"} is set.
          </p>
        </div>
        
        <div className="bg-white dark:bg-black/40 rounded-lg p-3 text-sm text-left border border-green-100 dark:border-green-900/50 shadow-sm">
          <div className="grid grid-cols-2 gap-y-2">
            <div className="text-muted-foreground">Date:</div>
            <div className="font-medium text-right">{details.date}</div>
            <div className="text-muted-foreground">Time:</div>
            <div className="font-medium text-right">{details.time}</div>
            <div className="text-muted-foreground">Mode:</div>
            <div className="font-medium text-right capitalize">{details.mode}</div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="w-full text-xs" onClick={onViewCalendar}>
            <CalendarDays className="h-3 w-3 mr-2" /> Add to Calendar
          </Button>
          <Button variant="default" className="w-full text-xs">
            <ExternalLink className="h-3 w-3 mr-2" /> View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
