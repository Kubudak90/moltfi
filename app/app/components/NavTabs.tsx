'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs: { href: string; label: string; badge?: string }[] = [
  { href: '/dashboard', label: 'Vault' },
  { href: '/strategy', label: 'Strategy' },
  { href: '/activity', label: 'Activity' },
  { href: '/chat', label: 'DeFi Agent', badge: 'Beta' },
  { href: '/guardrails', label: 'Guardrails' },
]

export function NavTabs() {
  const pathname = usePathname()

  // Don't show tabs on landing page
  if (pathname === '/') return null

  return (
    <div className="border-b border-gray-800 bg-[#09090b]/80 backdrop-blur-sm sticky top-14 z-40 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const active = pathname === tab.href
            return (
              <Link key={tab.href} href={tab.href}
                className={`px-4 py-3 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap ${
                  active
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}>
                {tab.label}
                {tab.badge && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {tab.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
