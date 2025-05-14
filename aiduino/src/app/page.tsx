"use client"
import { SerialProvider, useSerial } from "@/src/components/serial-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Plug, Activity, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import SensorChart from "@/src/components/sensor-chart"
import SummaryCard from "@/src/components/summary-card"

function Dashboard() {
  const { samples, connected, connect, disconnect, isSerialSupported, isPreviewMode } = useSerial()

  // Handle connection toggle
  const handleConnectionToggle = async () => {
    if (connected) {
      await disconnect()
      toast.info(isPreviewMode ? "Disconnected from Mock Arduino" : "Disconnected from Arduino")
    } else {
      try {
        await connect()
        // Toast is handled in the SerialProvider
      } catch (error) {
        toast.error("Connection failed", {
          description: error instanceof Error ? error.message : "Could not connect to device",
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl">
        {/* Environment notice */}
        {isPreviewMode && (
          <div className="mb-6 bg-amber-500/10 border border-neutral-200 border-amber-500/20 rounded-lg p-4 text-amber-500 flex items-center gap-2 dark:border-neutral-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Preview Mode Active</p>
              <p className="text-sm opacity-90">
                Using simulated data. The Web Serial API is restricted in preview environments.
              </p>
            </div>
          </div>
        )}

        {!isSerialSupported && !isPreviewMode && (
          <div className="mb-6 bg-red-500/10 border border-neutral-200 border-red-500/20 rounded-lg p-4 text-red-500 flex items-center gap-2 dark:bg-red-900/10 dark:border-neutral-800 dark:border-red-900/20 dark:text-red-900">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Browser Not Supported</p>
              <p className="text-sm opacity-90">
                Your browser doesn't support the Web Serial API. Please use Chrome, Edge, or Opera.
              </p>
            </div>
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Chart section */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight">
                {isPreviewMode ? "Arduino Sensor Live Feed (Mock)" : "Arduino Sensor Live Feed"}
              </h1>

              <div className="flex items-center gap-3">
                <Badge
                  variant={connected ? "default" : "outline"}
                  className={connected ? "bg-green-600 hover:bg-green-700" : "text-neutral-500 dark:text-neutral-400"}
                >
                  {connected ? "Connected" : "Disconnected"}
                </Badge>

                <Button onClick={handleConnectionToggle}>
                  <Plug className="mr-2 h-4 w-4" />
                  {connected ? "Disconnect" : "Connect to Arduino"}
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-neutral-900 dark:text-neutral-50" />
                  Sensor Data
                </CardTitle>
                <CardDescription>
                  {isPreviewMode
                    ? "Visualization of simulated sensor readings"
                    : "Real-time visualization of sensor readings"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[350px] w-full">
                  {samples.length > 0 ? (
                    <SensorChart samples={samples} />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400">
                      <Activity className="h-16 w-16 mb-4 opacity-20" />
                      <p className="text-sm">
                        {connected ? "Waiting for sensor data..." : "Connect to Arduino view sensor data"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Summary section */}
          <div className="md:col-span-1">
            <SummaryCard samples={samples} connected={connected} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <SerialProvider>
      <Dashboard />
    </SerialProvider>
  )
}
