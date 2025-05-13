"use client";

import React, { useEffect, useState } from "react";
import useSWRMutation from "swr/mutation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sample } from "./serial-provider";
import { toast } from "sonner"; // Updated to sonner

interface SummaryCardProps {
  samples: Sample[];
  connected: boolean;
}

async function fetchSummary(url: string, { arg }: { arg: { samples: Sample[] } }) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ samples: arg.samples }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch summary" }));
    throw new Error(errorData.message || "Failed to fetch summary");
  }
  return response.json();
}

const SummaryCard: React.FC<SummaryCardProps> = ({ samples, connected }) => {
  const [summaryText, setSummaryText] = useState("Waiting for data to generate summary...");

  const { trigger, isMutating } = useSWRMutation("/api/summary", fetchSummary, {
    onSuccess: (data) => {
      setSummaryText(data.text);
    },
    onError: (error) => {
      console.error("Error fetching summary:", error);
      toast.error("Summary Error", { description: error.message });
      setSummaryText("Could not generate summary.");
    },
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (connected && samples.length > 0) {
      // Initial trigger
      if(samples.length >= 10) { // Wait for a few samples before first summary
        trigger({ samples });
      }
      // Trigger every 60 seconds
      intervalId = setInterval(() => {
        if (samples.length > 0) { // Ensure samples are still available
            trigger({ samples });
        }
      }, 60000);
    } else {
      setSummaryText(connected ? "Collecting data for first summary..." : "Connect to device to start generating summaries.");
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [samples, connected, trigger]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Data Summary</CardTitle>
        <CardDescription>Insights from your sensor data.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {isMutating ? "Generating new summary..." : summaryText}
        </p>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
