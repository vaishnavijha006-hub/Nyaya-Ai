import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export function ServiceStatus({ degraded, message }: { degraded?: boolean; message?: string }) {
  return (
    <Card className="w-full max-w-md mx-auto my-4 border-2">
      <CardHeader className="pb-3 flex flex-row items-center space-x-3 space-y-0">
        <div className={`p-2 rounded-full ${degraded ? "bg-yellow-100" : "bg-green-100"}`}>
          {degraded ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
        </div>
        <div>
          <CardTitle className="text-lg">Service Status</CardTitle>
          <CardDescription>
            {degraded ? "Experiencing slight delays" : "All services operational"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground flex items-start space-x-2">
          <Clock className="h-4 w-4 mt-0.5" />
          <p>
            {message || (degraded 
              ? "We are currently experiencing higher than normal traffic. Some responses might take longer." 
              : "Nyaya AI is running smoothly. Your requests will be processed promptly.")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
