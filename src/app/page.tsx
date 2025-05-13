"use client";

import React from "react";
import { SerialProvider, useSerial } from "@/components/serial-provider";
import SensorChart from "@/components/sensor-chart";
import SummaryCard from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function AppComponent() {
  const { samples, connected, connect, disconnect } = useSerial();

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8 bg-muted/40">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Arduino AI Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Badge variant={connected ? "default" : "outline"} className={connected ? "bg-green-500 text-white" : ""}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
          <Button onClick={connected ? disconnect : connect}>
            {connected ? "Disconnect Serial" : "Connect Serial"}
          </Button>
        </div>
      </header>

      <main className="flex-grow grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 h-[400px] md:h-auto bg-card p-6 rounded-lg shadow">
          <SensorChart samples={samples} />
        </div>
        <div className="md:col-span-1 bg-card p-6 rounded-lg shadow">
          <SummaryCard samples={samples} connected={connected} />
        </div>
      </main>

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        Powered by Next.js, Tailwind CSS, shadcn/ui, and Vercel.
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <SerialProvider>
      <AppComponent />
    </SerialProvider>
  );
}
