"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import { RingBuffer } from "../lib/ring-buffer"
import { toast } from "sonner"

// Mock data generator for preview/testing environments
const generateMockData = (() => {
  // Initial values
  let temp = 22 + Math.random() * 2
  let humidity = 45 + Math.random() * 5
  let pressure = 1013 + Math.random() * 5
  let light = 500 + Math.random() * 100

  return () => {
    // Simulate small changes to create realistic patterns
    temp += (Math.random() - 0.5) * 0.5
    humidity += (Math.random() - 0.5) * 1
    pressure += (Math.random() - 0.5) * 0.3
    light += (Math.random() - 0.5) * 50

    // Keep values in realistic ranges
    temp = Math.max(15, Math.min(35, temp))
    humidity = Math.max(30, Math.min(90, humidity))
    pressure = Math.max(990, Math.min(1030, pressure))
    light = Math.max(0, Math.min(1000, light))

    return {
      temperature: Math.round(temp * 10) / 10,
      humidity: Math.round(humidity * 10) / 10,
      pressure: Math.round(pressure * 10) / 10,
      light: Math.round(light),
    }
  }
})()

export interface DataPoint {
  [key: string]: any
}

export interface Sample {
  timestamp: number
  data: DataPoint
}

interface SerialContextType {
  samples: Sample[]
  connected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  isSerialSupported: boolean
  isPreviewMode: boolean
}

const SerialContext = createContext<SerialContextType | undefined>(undefined)

const MAX_SAMPLES = 60

// Check if we're in a preview/development environment
const isPreviewEnvironment = () => {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname.includes("vercel.app") ||
      window.location.hostname.includes("preview") ||
      window.location.hostname.includes("next-lite") ||
      window.location.protocol === "blob:")
  )
}

// Check if Serial API is supported and available
const isSerialApiSupported = () => {
  return typeof navigator !== "undefined" && navigator.serial && typeof navigator.serial.requestPort === "function"
}

export const SerialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [samples, setSamples] = useState<Sample[]>([])
  const [connected, setConnected] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSerialSupported, setIsSerialSupported] = useState(true)
  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const ringBufferRef = useRef(new RingBuffer<Sample>(MAX_SAMPLES))
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check environment on mount
  useEffect(() => {
    const previewMode = isPreviewEnvironment()
    setIsPreviewMode(previewMode)

    const serialSupported = isSerialApiSupported()
    setIsSerialSupported(serialSupported)

    if (previewMode) {
      toast.info("Preview Mode Active", {
        description: "Using mock data. Serial API may be restricted in this environment.",
        duration: 5000,
      })
    } else if (!serialSupported) {
      toast.error("Serial API Not Supported", {
        description: "Your browser doesn't support the Web Serial API. Try Chrome or Edge.",
        duration: 5000,
      })
    }
  }, [])

  // Mock data generator for preview mode
  const startMockDataGeneration = useCallback(() => {
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current)
    }

    // Generate initial data
    const newSample: Sample = {
      timestamp: Date.now(),
      data: generateMockData(),
    }
    ringBufferRef.current.push(newSample)
    setSamples([...ringBufferRef.current.toArray()])

    // Set up interval for continuous data
    mockIntervalRef.current = setInterval(() => {
      const newSample: Sample = {
        timestamp: Date.now(),
        data: generateMockData(),
      }
      ringBufferRef.current.push(newSample)
      setSamples([...ringBufferRef.current.toArray()])
    }, 1000)
  }, [])

  const stopMockDataGeneration = useCallback(() => {
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current)
      mockIntervalRef.current = null
    }
  }, [])

  const connect = useCallback(async () => {
    // If in preview mode or Serial API not supported, use mock data
    if (isPreviewMode || !isSerialApiSupported()) {
      setConnected(true)
      startMockDataGeneration()
      toast.success("Connected to Mock Arduino", {
        description: "Using simulated data for preview/testing.",
      })
      return
    }

    // Real Serial API implementation
    try {
      const port = await navigator.serial.requestPort()
      await port.open({ baudRate: 9600 })
      portRef.current = port
      setConnected(true)
      toast.success("Serial Port Connected")

      // eslint-disable-next-line no-inner-declarations
      async function readLoop() {
        if (!portRef.current?.readable) return
        readerRef.current = portRef.current.readable.getReader()
        let partialData = ""

        try {
          while (true) {
            const { value, done } = await readerRef.current.read()
            if (done) {
              break
            }
            const textDecoder = new TextDecoder()
            partialData += textDecoder.decode(value, { stream: true })

            let newlineIndex
            while ((newlineIndex = partialData.indexOf("\n")) !== -1) {
              const line = partialData.substring(0, newlineIndex).trim()
              partialData = partialData.substring(newlineIndex + 1)

              if (line) {
                try {
                  const jsonData = JSON.parse(line)
                  // Ensure jsonData is an object before creating a sample
                  if (typeof jsonData === "object" && jsonData !== null && !Array.isArray(jsonData)) {
                    const newSample: Sample = {
                      timestamp: Date.now(),
                      data: jsonData,
                    }
                    ringBufferRef.current.push(newSample)
                    setSamples([...ringBufferRef.current.toArray()])
                  } else {
                    console.warn("Received non-object JSON data from serial:", line)
                  }
                } catch (e) {
                  console.warn("Failed to parse JSON from serial:", line, e)
                }
              }
            }
          }
        } catch (error) {
          console.error("Error reading from serial port:", error)
          // Only toast if not an intentional cancellation
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            toast.error("Serial Read Error", {
              description: (error as Error).message,
            })
          }
        } finally {
          if (readerRef.current) {
            readerRef.current.releaseLock()
            readerRef.current = null
          }
        }
      }
      readLoop()
    } catch (error) {
      console.error("Failed to connect serial port:", error)
      toast.error("Connection Failed", {
        description: (error as Error).message,
      })
      setConnected(false)
    }
  }, [isPreviewMode, startMockDataGeneration])

  const disconnect = useCallback(async () => {
    // If using mock data, just clear the interval
    if (isPreviewMode || !isSerialApiSupported()) {
      stopMockDataGeneration()
      setConnected(false)
      toast.info("Disconnected from Mock Arduino")
      return
    }

    // Real disconnect logic
    if (readerRef.current) {
      try {
        await readerRef.current.cancel()
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.warn("Error cancelling reader:", e)
        }
      }
    }
    if (portRef.current) {
      try {
        await portRef.current.close()
      } catch (e) {
        console.warn("Error closing port:", e)
      }
      portRef.current = null
    }
    setConnected(false)
    toast.info("Serial Port Disconnected")
  }, [isPreviewMode, stopMockDataGeneration])

  useEffect(() => {
    return () => {
      // Ensure disconnection on component unmount
      if (connected) {
        disconnect()
      }
    }
  }, [connected, disconnect])

  return (
    <SerialContext.Provider
      value={{
        samples,
        connected,
        connect,
        disconnect,
        isSerialSupported: isSerialSupported,
        isPreviewMode,
      }}
    >
      {children}
    </SerialContext.Provider>
  )
}

export const useSerial = (): SerialContextType => {
  const context = useContext(SerialContext)
  if (context === undefined) {
    throw new Error("useSerial must be used within a SerialProvider")
  }
  return context
}
