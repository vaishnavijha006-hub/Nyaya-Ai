import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, Lock } from "lucide-react";

export function SecurityAnomalies({ anomaliesData }: { anomaliesData?: any }) {
  const count = anomaliesData?.count || 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Security Anomalies</CardTitle>
        {count > 0 ? (
          <ShieldAlert className="h-4 w-4 text-red-500" />
        ) : (
          <Shield className="h-4 w-4 text-green-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Suspicious activities detected in the last 24h
        </p>
        <div className="mt-4 pt-4 border-t flex items-center space-x-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">WAF and IAM active</span>
        </div>
      </CardContent>
    </Card>
  );
}
