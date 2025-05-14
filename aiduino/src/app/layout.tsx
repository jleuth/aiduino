import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import { cn } from "../lib/utils"
import { Toaster } from "../components/ui/sonner"
import { ThemeProvider } from "../components/theme-provider"

const fontSans = GeistSans

export const metadata: Metadata = {
  title: "Aiduino Dashboard",
  description: "Next.js 14 app with Arduino, Tailwind, shadcn/ui, and Vercel.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={cn("min-h-screen bg-white font-sans antialiased dark:bg-neutral-950", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors closeButton theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  )
}
