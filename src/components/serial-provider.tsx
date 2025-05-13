"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { RingBuffer } from "@/lib/ring-buffer";
import { toast } from "sonner"; // Updated to sonner

export interface DataPoint {
  [key: string]: any; // Allow any other data, assuming it's JSON-parseable
}

export interface Sample {
  timestamp: number;
  data: DataPoint; // Changed from temp/hum to a generic data object
}

interface SerialContextType {
  samples: Sample[];
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const SerialContext = createContext<SerialContextType | undefined>(undefined);

const MAX_SAMPLES = 60;

export const SerialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [connected, setConnected] = useState(false);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const ringBufferRef = useRef(new RingBuffer<Sample>(MAX_SAMPLES));
  // const { toast } = useToast(); // Removed old useToast

  const connect = useCallback(async () => {
    if (!navigator.serial) {
      toast.error("Error", {
        description: "Web Serial API not supported in this browser.",
      });
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setConnected(true);
      toast.success("Serial Port Connected");

      // eslint-disable-next-line no-inner-declarations
      async function readLoop() {
        if (!portRef.current?.readable) return;
        readerRef.current = portRef.current.readable.getReader();
        let partialData = "";

        try {
          while (true) {
            const { value, done } = await readerRef.current.read();
            if (done) {
              break;
            }
            const textDecoder = new TextDecoder();
            partialData += textDecoder.decode(value, { stream: true });

            let newlineIndex;
            while ((newlineIndex = partialData.indexOf("\n")) !== -1) {
              const line = partialData.substring(0, newlineIndex).trim();
              partialData = partialData.substring(newlineIndex + 1);

              if (line) {
                try {
                  const jsonData = JSON.parse(line);
                  // Ensure jsonData is an object before creating a sample
                  if (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData)) {
                    const newSample: Sample = {
                      timestamp: Date.now(),
                      data: jsonData, // Store the entire parsed JSON object
                    };
                    ringBufferRef.current.push(newSample);
                    setSamples([...ringBufferRef.current.toArray()]); // Create new array to trigger re-render
                  } else {
                    console.warn("Received non-object JSON data from serial:", line);
                    // Optionally, you could toast an error/warning here if this happens frequently
                    // toast.warning("Data Format Issue", { description: "Received non-object JSON from serial." });
                  }
                } catch (e) {
                  console.warn("Failed to parse JSON from serial:", line, e);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error reading from serial port:", error);
          // Only toast if not an intentional cancellation
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            toast.error("Serial Read Error", {
              description: (error as Error).message,
            });
          }
        } finally {
          if (readerRef.current) {
            readerRef.current.releaseLock();
            readerRef.current = null;
          }
        }
      }
      readLoop();

    } catch (error) {
      console.error("Failed to connect to serial port:", error);
      toast.error("Connection Failed", {
        description: (error as Error).message,
      });
      setConnected(false);
    }
  }, []); // Removed toast from dependencies as it's directly imported

  const disconnect = useCallback(async () => {
    if (readerRef.current) {
      try {
        await readerRef.current.cancel(); // This will cause the read() promise to reject and break the loop
      } catch (e) {
        // DOMException AbortError is expected, no need to warn
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          console.warn("Error cancelling reader:", e);
        }
      }
      // The releaseLock and nullification is now in the finally block of readLoop
    }
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (e) {
        console.warn("Error closing port:", e);
      }
      portRef.current = null;
    }
    setConnected(false);
    toast.info("Serial Port Disconnected");
  }, []); // Removed toast from dependencies

  useEffect(() => {
    return () => {
      // Ensure disconnection on component unmount
      if (connected) {
        disconnect();
      }
    };
  }, [connected, disconnect]);

  return (
    <SerialContext.Provider value={{ samples, connected, connect, disconnect }}>
      {children}
    </SerialContext.Provider>
  );
};

export const useSerial = (): SerialContextType => {
  const context = useContext(SerialContext);
  if (context === undefined) {
    throw new Error("useSerial must be used within a SerialProvider");
  }
  return context;
};
