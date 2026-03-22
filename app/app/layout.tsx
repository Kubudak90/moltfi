import './globals.css'
import Link from 'next/link'
import { Providers } from './providers'
import { ConnectWallet } from './components/ConnectWallet'
import { NavTabs } from './components/NavTabs'

export const metadata = {
  title: 'MoltFi — On-chain guardrails for AI agent trading',
  description: 'Your agent trades within your limits. Smart contracts enforce every rule on Base.',
  icons: { icon: '/favicon.svg' },
}



function Nav() {
  return (
    <nav className="border-b border-gray-800 bg-[#09090b]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold">MF</div>
          <span className="font-bold text-lg">MoltFi</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-400/15 text-yellow-400 border border-yellow-500/25">Base Sepolia</span>
        </Link>
        <div className="flex items-center gap-3">

          <ConnectWallet />
        </div>
      </div>
    </nav>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#09090b] text-gray-100 antialiased">
        <Providers>
          <Nav />
          <NavTabs />
          {children}
        </Providers>
      </body>
    </html>
  )
}
