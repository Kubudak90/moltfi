'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard', label: 'Vault' },
  { href: '/strategy', label: 'Strategy' },
  { href: '/activity', label: 'Activity' },
  { href: '/chat', label: 'Agent' },
  { href: '/market', label: 'Market' },
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
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
