"use client";

import React from "react";
import { Line } from "react-chartjs-2";
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
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Sample } from "./serial-provider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface SensorChartProps {
  samples: Sample[];
}

const SensorChart: React.FC<SensorChartProps> = ({ samples }) => {
  const chartData = {
    labels: samples.map((s) => new Date(s.timestamp)),
    datasets: [
      {
        label: "Temperature (°C)",
        data: samples.map((s) => s.temp),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        yAxisID: "yTemp",
      },
      {
        label: "Humidity (%)",
        data: samples.map((s) => s.hum),
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        yAxisID: "yHum",
      },
    ],
  };

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
      yTemp: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Temperature (°C)",
        },
        suggestedMin: 0,
        suggestedMax: 40,
      },
      yHum: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Humidity (%)",
        },
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
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
  };

  return <Line options={options} data={chartData} />;
};

export default SensorChart;
