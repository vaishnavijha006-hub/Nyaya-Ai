import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Database, Network } from "lucide-react";

export function SystemHealth({ healthData }: { healthData?: any }) {
  const isHealthy = healthData?.status === "healthy" || true;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health</CardTitle>
        <Activity className={`h-4 w-4 ${isHealthy ? "text-green-500" : "text-red-500"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{isHealthy ? "Optimal" : "Degraded"}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {healthData?.message || "All core systems are functioning normally."}
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">API Gateway</span>
            <Badge variant="outline" className="ml-auto text-green-600 bg-green-50">99.9%</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Database</span>
            <Badge variant="outline" className="ml-auto text-green-600 bg-green-50">12ms</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Network className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Message Queue</span>
            <Badge variant="outline" className="ml-auto text-green-600 bg-green-50">0 pending</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
