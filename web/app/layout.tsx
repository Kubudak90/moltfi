import type { Metadata } from 'next';
import './globals.css';
import Nav from './components/Nav';

export const metadata: Metadata = {
  title: 'AgentGuard — AI Vault Manager',
  description:
    'Manage your DeFi positions with AI, protected by blockchain-enforced spending limits.',
  openGraph: {
    title: 'AgentGuard — AI Vault Manager',
    description:
      'Manage your DeFi positions with AI, protected by blockchain-enforced spending limits.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-zinc-200 antialiased min-h-screen">
        <Nav />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
