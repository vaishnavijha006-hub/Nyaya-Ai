"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Video, Phone, MapPin } from "lucide-react"

export interface AppointmentBookerProps {
  onBook?: (details: any) => void
  lawyerName?: string
}

export function AppointmentBooker({ onBook, lawyerName = "Available Representative" }: AppointmentBookerProps) {
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null)
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null)
  const [selectedMode, setSelectedMode] = React.useState<string>("video")

  const dates = ["Today", "Tomorrow", "Next Monday"]
  const times = ["10:00 AM", "1:00 PM", "3:30 PM", "5:00 PM"]
  const modes = [
    { id: "video", icon: <Video className="h-4 w-4" />, label: "Video Call" },
    { id: "phone", icon: <Phone className="h-4 w-4" />, label: "Phone Call" },
    { id: "in-person", icon: <MapPin className="h-4 w-4" />, label: "In Person" },
  ]

  const handleBook = () => {
    if (selectedDate && selectedTime && selectedMode) {
      onBook?.({ date: selectedDate, time: selectedTime, mode: selectedMode })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Book Appointment
        </CardTitle>
        <CardDescription>Schedule a consultation with {lawyerName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-3">
          <div className="text-sm font-medium">Select Date</div>
          <div className="flex gap-2 flex-wrap">
            {dates.map(date => (
              <Button 
                key={date} 
                variant={selectedDate === date ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDate(date)}
              >
                {date}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Select Time</div>
          <div className="flex gap-2 flex-wrap">
            {times.map(time => (
              <Button 
                key={time} 
                variant={selectedTime === time ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTime(time)}
                className="flex items-center gap-1.5"
              >
                <Clock className="h-3 w-3" />
                {time}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Meeting Mode</div>
          <div className="flex gap-2 flex-wrap">
            {modes.map(mode => (
              <Button 
                key={mode.id} 
                variant={selectedMode === mode.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMode(mode.id)}
                className="flex items-center gap-1.5"
              >
                {mode.icon}
                {mode.label}
              </Button>
            ))}
          </div>
        </div>

      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          disabled={!selectedDate || !selectedTime || !selectedMode}
          onClick={handleBook}
        >
          Confirm Appointment
        </Button>
      </CardFooter>
    </Card>
  )
}
