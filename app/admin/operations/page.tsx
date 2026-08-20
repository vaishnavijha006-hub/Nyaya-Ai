"use client";

import React from "react";
import { SystemHealth } from "@/components/admin/system-health";
import { IncidentCenter } from "@/components/admin/incident-center";
import { SecurityAnomalies } from "@/components/admin/security-anomalies";
import { CapabilityHealth } from "@/components/admin/capability-health";

export default function OperationsDashboard() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Operations Dashboard</h2>
        <div className="flex items-center space-x-2">
          {/* Action buttons could go here */}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SystemHealth />
        <CapabilityHealth />
        <SecurityAnomalies />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <IncidentCenter />
      </div>
    </div>
  );
}
