// Update src/app/layout.jsx

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { EducationLevelProvider } from "@/context/EducationContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Veston - Startup Equity Modeling",
  description: "Make informed decisions about your startup equity",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SubscriptionProvider>
            <EducationLevelProvider>
              {children}
              <Toaster />
            </EducationLevelProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
