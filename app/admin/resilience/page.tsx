import * as React from 'react';
import { Shield, Activity, AlertOctagon, CheckCircle, ServerCrash, Database, Network } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResilienceDashboard() {
  return (
    <div className="container py-8 max-w-6xl space-y-8">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
          <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resilience & Disaster Recovery</h1>
          <p className="text-muted-foreground">Monitor system health, active incidents, and integrity metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Optimal</div>
            <p className="text-xs text-muted-foreground">All services operational</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertOctagon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No active incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Corrupted Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-green-500 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" /> Intact
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Provider Status</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">Uptime across all LLM APIs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Integrity Checks</CardTitle>
            <CardDescription>Automated system checks in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '10 mins ago', check: 'Workflow Validation', status: 'Passed' },
                { time: '1 hour ago', check: 'Database Checksum Verification', status: 'Passed' },
                { time: '4 hours ago', check: 'Memory Sync Verification', status: 'Passed' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{item.check}</span>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  <div className="flex items-center text-green-500 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disaster Recovery Log</CardTitle>
            <CardDescription>Recent recovery operations and simulated drills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 flex flex-col justify-center items-center h-40 text-muted-foreground">
              <ServerCrash className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No recent recovery operations required.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
