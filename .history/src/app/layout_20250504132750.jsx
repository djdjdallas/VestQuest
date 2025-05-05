import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'VestQuest - Startup Equity Modeling',
  description: 'Make informed decisions about your startup equity',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <a href="/" className="text-xl font-bold">VestQuest</a>
            <div className="space-x-4">
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
              <a href="/calculator" className="text-gray-600 hover:text-gray-900">Calculator</a>
              <a href="/education" className="text-gray-600 hover:text-gray-900">Learn</a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
