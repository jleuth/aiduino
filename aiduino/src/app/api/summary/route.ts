import { NextResponse } from "next/server"

export const runtime = "edge"

interface DataPoint {
  [key: string]: any
}

interface Sample {
  timestamp: number
  data: DataPoint // Updated to generic data structure
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const samples: Sample[] = body.samples

    if (!samples || !Array.isArray(samples)) {
      return NextResponse.json({ message: "Invalid samples data" }, { status: 400 })
    }

    try {
      const hackClubAIResponse = await fetch("https://ai.hackclub.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // Or any other model you prefer that Hack Club AI supports
          messages: [
            {
              role: "system",
              content: "You are a concise, insightful data analyst.",
            },
            {
              role: "user",
              content: `Summarize the key trends, anomalies, or interesting insights (≤60 words) from the following JSON data:\n${JSON.stringify(samples)}`,
            },
          ],
        }),
      })

      if (!hackClubAIResponse.ok) {
        throw new Error(`AI service returned ${hackClubAIResponse.status}`)
      }

      const aiData = await hackClubAIResponse.json()

      // Check if choices array exists and has at least one element
      if (!aiData.choices || aiData.choices.length === 0) {
        throw new Error("Invalid response structure from AI service")
      }

      const summaryText = aiData.choices[0]?.message?.content?.trim() || "No summary generated."

      return NextResponse.json({ text: summaryText })
    } catch (aiError) {
      console.error("Error from AI service:", aiError)

      // Generate a basic summary as fallback
      const fallbackSummary = generateFallbackSummary(samples)
      return NextResponse.json({ text: fallbackSummary })
    }
  } catch (error) {
    console.error("Error in summary API route:", error)
    return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 })
  }
}

// Generate a basic summary when AI service is unavailable
function generateFallbackSummary(samples: Sample[]): string {
  if (samples.length === 0) return "No data available for analysis."

  try {
    // Get the first sample to determine available data points
    const firstSample = samples[0]
    const dataKeys = Object.keys(firstSample.data).filter((key) => typeof firstSample.data[key] === "number")

    if (dataKeys.length === 0) return "No numeric data available for analysis."

    // Calculate basic stats for each data point
    const stats = dataKeys.reduce(
      (acc, key) => {
        const values = samples.map((s) => s.data[key])
        const sum = values.reduce((a, b) => a + b, 0)
        const avg = sum / values.length
        const min = Math.min(...values)
        const max = Math.max(...values)

        acc[key] = { avg, min, max }
        return acc
      },
      {} as Record<string, { avg: number; min: number; max: number }>,
    )

    // Format the summary
    const summaryParts = dataKeys.map((key) => {
      const { avg, min, max } = stats[key]
      return `${key.charAt(0).toUpperCase() + key.slice(1)}: avg ${avg.toFixed(1)}, range ${min.toFixed(1)}-${max.toFixed(1)}`
    })

    return `Data summary: ${summaryParts.join(".")}.`
  } catch (e) {
    return "Unable to generate summary from the available data."
  }
}
