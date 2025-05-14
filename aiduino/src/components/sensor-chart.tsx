"use client"

import type React from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js"
import "chartjs-adapter-date-fns"
import type { Sample } from "./serial-provider" // Import DataPoint

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale)

interface SensorChartProps {
  samples: Sample[]
}

const SensorChart: React.FC<SensorChartProps> = ({ samples }) => {
  // Dynamically create datasets based on the keys in the first sample's data
  // This assumes all samples will have a similar structure to the first one for charting purposes.
  const dataKeys =
    samples.length > 0 ? Object.keys(samples[0].data).filter((key) => typeof samples[0].data[key] === "number") : []

  // If no data keys are found, show a message
  if (dataKeys.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
        <p>No numeric data found to display</p>
      </div>
    )
  }

  const chartData = {
    labels: samples.map((s) => new Date(s.timestamp)),
    datasets: dataKeys.map((key, index) => {
      // Basic color cycling, can be improved
      const colors = [
        "rgb(255, 99, 132)",
        "rgb(54, 162, 235)",
        "rgb(75, 192, 192)",
        "rgb(255, 205, 86)",
        "rgb(153, 102, 255)",
      ]
      const color = colors[index % colors.length]
      return {
        label: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize key for label
        data: samples.map((s) => s.data[key]),
        borderColor: color,
        backgroundColor: color.replace("rgb", "rgba").replace(")", ", 0.5)"),
        yAxisID: `y-${key}`,
      }
    }),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const, // Disable animation for live updates
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "second" as const,
          displayFormats: {
            second: "HH:mm:ss",
          },
        },
        title: {
          display: true,
          text: "Time",
        },
      },
      // Dynamically create Y-axes
      ...dataKeys.reduce((acc, key, index) => {
        acc[`y-${key}`] = {
          type: "linear" as const,
          display: true,
          position: index % 2 === 0 ? ("left" as const) : ("right" as const), // Alternate sides
          title: {
            display: true,
            text: key.charAt(0).toUpperCase() + key.slice(1),
          },
          // suggestedMin and suggestedMax can be dynamic or removed for auto-scaling
          grid: {
            drawOnChartArea: index === 0, // Only draw grid for the first Y-axis to avoid clutter
          },
        }
        return acc
      }, {} as any), // Type assertion needed for dynamic keys
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
  }

  return <Line options={options} data={chartData} />
}

export default SensorChart
