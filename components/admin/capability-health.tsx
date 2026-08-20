import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function CapabilityHealth({ capabilityData }: { capabilityData?: any }) {
  const usage = capabilityData?.usage || 42;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Capability Health</CardTitle>
        <Cpu className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end mb-2">
          <div className="text-2xl font-bold">{usage}%</div>
          <Zap className="h-4 w-4 text-yellow-500 mb-1" />
        </div>
        <Progress value={usage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          Platform resource utilization
        </p>
      </CardContent>
    </Card>
  );
}
