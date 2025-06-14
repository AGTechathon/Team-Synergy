import { Geist, Geist_Mono } from "next/font/google";
import 'leaflet/dist/leaflet.css';
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RakshaMitra AI",
  description: "AI-Powered Disaster Relief Coordination System - Real-time coordination between victims, volunteers, and authorities",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
