import { NextResponse } from "next/server";

export const runtime = "edge";

interface Sample {
  timestamp: number;
  temp: number;
  hum: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const samples: Sample[] = body.samples;

    if (!samples || !Array.isArray(samples)) {
      return NextResponse.json({ message: "Invalid samples data" }, { status: 400 });
    }

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
    });

    if (!hackClubAIResponse.ok) {
      const errorText = await hackClubAIResponse.text();
      console.error("Hack Club AI API error:", errorText);
      return NextResponse.json({ message: "Error from AI service", details: errorText }, { status: hackClubAIResponse.status });
    }

    const aiData = await hackClubAIResponse.json();
    
    // Check if choices array exists and has at least one element
    if (!aiData.choices || aiData.choices.length === 0) {
      console.error("Invalid response structure from AI service:", aiData);
      return NextResponse.json({ message: "Invalid response structure from AI service" }, { status: 500 });
    }
    
    const summaryText = aiData.choices[0]?.message?.content?.trim() || "No summary generated.";

    return NextResponse.json({ text: summaryText });

  } catch (error) {
    console.error("Error in summary API route:", error);
    return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
  }
}
