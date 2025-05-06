// Update src/app/layout.jsx

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { EducationLevelProvider } from "@/context/EducationContext"; // Add this

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "VestQuest - Startup Equity Modeling",
  description: "Make informed decisions about your startup equity",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <EducationLevelProvider>
            {" "}
            {/* Add this */}
            {children}
            <Toaster />
          </EducationLevelProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
