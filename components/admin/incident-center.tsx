import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ShieldAlert, CheckCircle2 } from "lucide-react";

export function IncidentCenter({ incidentData }: { incidentData?: any }) {
  const incidents = incidentData?.recent || [
    { id: "INC-001", title: "High memory usage in inference cluster", severity: "medium", status: "investigating", time: "10m ago" },
    { id: "INC-002", title: "API Gateway rate limit exceeded", severity: "low", status: "resolved", time: "1h ago" }
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case "medium": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Incident Center</CardTitle>
        <CardDescription>Recent system alerts and ongoing incidents.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {incidents.map((incident: any) => (
            <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                {getSeverityIcon(incident.severity)}
                <div>
                  <p className="text-sm font-medium">{incident.title}</p>
                  <p className="text-xs text-muted-foreground">{incident.time} • {incident.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={incident.status === "resolved" ? "secondary" : "destructive"}>
                  {incident.status}
                </Badge>
              </div>
            </div>
          ))}
          {incidents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No active incidents</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
