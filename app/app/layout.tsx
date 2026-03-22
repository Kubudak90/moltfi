import './globals.css'
import Link from 'next/link'
import { Providers } from './providers'
import { ConnectWallet } from './components/ConnectWallet'
import { NavTabs } from './components/NavTabs'

export const metadata = {
  title: 'MoltFi — AI Vault Manager',
  description: 'Manage your DeFi positions with an AI agent, protected by on-chain guardrails',
  icons: { icon: '/favicon.svg' },
}

import { PrivacyIndicator } from './components/PrivacyIndicator'

function Nav() {
  return (
    <nav className="border-b border-navy-600 bg-navy-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-jpm flex items-center justify-center text-xs font-bold text-white">MF</div>
          <span className="font-bold text-lg">MoltFi</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/25">Base Sepolia</span>
        </Link>
        <div className="flex items-center gap-3">
          <PrivacyIndicator />
          <ConnectWallet />
        </div>
      </div>
    </nav>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-navy-950 text-gray-100 antialiased">
        <Providers>
          <Nav />
          <NavTabs />
          {children}
        </Providers>
      </body>
    </html>
  )
}
