import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { GlobalFileDrop } from '@/components/GlobalFileDrop'
import { Toaster } from '@/components/ui/toaster'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'AI Storyteller',
  description:
    'Interactive storytelling with AI-generated content and images',
  keywords: [
    'AI',
    'storytelling',
    'interactive',
    'text-to-image',
    'creative',
  ],
  authors: [{ name: 'AI Gamer React Team' }],
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GlobalFileDrop>
          {children}
          <Toaster />
        </GlobalFileDrop>
      </body>
    </html>
  )
}
