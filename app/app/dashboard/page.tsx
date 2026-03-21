'use client'

import dynamic from 'next/dynamic'

const DashboardClient = dynamic(() => import('./DashboardClient'), {
  ssr: false,
  loading: () => (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="text-gray-500">Loading dashboard...</div>
    </div>
  ),
})

export default function DashboardPage() {
  return <DashboardClient />
}
