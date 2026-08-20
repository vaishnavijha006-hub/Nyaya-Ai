"use client"

import * as React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Clock, AlertCircle } from "lucide-react"

export interface DeadlineAlertProps {
  title: string
  date: string
  description: string
  daysRemaining: number
  onAction?: () => void
  actionLabel?: string
}

export function DeadlineAlert({ title, date, description, daysRemaining, onAction, actionLabel = "Take Action" }: DeadlineAlertProps) {
  const isUrgent = daysRemaining <= 3
  const isCritical = daysRemaining <= 1
  
  const alertVariant = isCritical ? "destructive" : "default"
  const bgClass = isCritical 
    ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900" 
    : isUrgent 
      ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900"
      : "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
      
  const iconColorClass = isCritical ? "text-red-600" : isUrgent ? "text-amber-600" : "text-blue-600"

  return (
    <Alert className={`relative border ${bgClass}`}>
      {isCritical ? (
        <AlertCircle className={`h-4 w-4 ${iconColorClass}`} />
      ) : (
        <Clock className={`h-4 w-4 ${iconColorClass}`} />
      )}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between w-full">
        <div>
          <AlertTitle className={`font-semibold flex items-center gap-2 ${iconColorClass}`}>
            {title}
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-background border opacity-80">
              {daysRemaining === 0 ? "Due Today" : `${daysRemaining} days left`}
            </span>
          </AlertTitle>
          <AlertDescription className="mt-1 text-sm opacity-90">
            {description} — <span className="font-medium">Due: {date}</span>
          </AlertDescription>
        </div>
        
        {onAction && (
          <Button 
            size="sm" 
            variant={isCritical ? "destructive" : isUrgent ? "default" : "outline"}
            onClick={onAction}
            className="shrink-0"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Alert>
  )
}
