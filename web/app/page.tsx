import OnboardingForm from './components/OnboardingForm';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-blue-300">Live on Base Sepolia</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Your AI{' '}
              <span className="gradient-text">Vault Manager</span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              Manage your DeFi positions with an autonomous AI agent, protected by
              blockchain-enforced spending limits. Set your strategy, define your
              guardrails, and let your agent execute.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#onboarding" className="btn-primary text-lg px-8 py-3">
                Get Started
              </a>
              <a href="/dashboard" className="btn-secondary text-lg px-8 py-3">
                View Dashboard
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Three simple steps to autonomous DeFi management with on-chain safety
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card card-hover text-center">
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div className="text-sm text-blue-400 font-medium mb-2">Step 1</div>
              <h3 className="text-xl font-semibold text-white mb-2">Set Strategy</h3>
              <p className="text-zinc-400 text-sm">
                Define your risk tolerance, goals, and allocation targets. Set maximum
                trade sizes and daily limits.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card card-hover text-center">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="text-sm text-purple-400 font-medium mb-2">Step 2</div>
              <h3 className="text-xl font-semibold text-white mb-2">Agent Executes</h3>
              <p className="text-zinc-400 text-sm">
                Your AI agent monitors markets and executes trades automatically,
                following your strategy parameters.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card card-hover text-center">
              <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <div className="text-sm text-green-400 font-medium mb-2">Step 3</div>
              <h3 className="text-xl font-semibold text-white mb-2">You Monitor</h3>
              <p className="text-zinc-400 text-sm">
                Track all activity in real-time. On-chain guardrails ensure your agent
                can never exceed your limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                On-Chain Guardrails
              </h2>
              <p className="text-zinc-400 mb-8">
                Unlike traditional DeFi bots, AgentGuard enforces spending limits at the
                smart contract level. Even if your agent is compromised, it physically
                cannot exceed your defined limits.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Per-Transaction Limits</h4>
                    <p className="text-zinc-400 text-sm">
                      Cap the maximum amount for any single trade
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Daily Volume Limits</h4>
                    <p className="text-zinc-400 text-sm">
                      Restrict total trading volume within 24-hour periods
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Token Allowlists</h4>
                    <p className="text-zinc-400 text-sm">
                      Only allow trading of pre-approved tokens
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card glow">
              <div className="text-sm text-zinc-500 font-mono mb-4">
                // AgentPolicy.sol
              </div>
              <pre className="text-sm text-zinc-300 overflow-x-auto">
                <code>{`function beforeSwap(
  address agent,
  uint256 amount
) external {
  Policy memory p = policies[
    agentOwner[agent]
  ][agent];

  require(p.active, "Policy inactive");
  require(
    amount <= p.maxPerAction,
    "Exceeds per-action limit"
  );

  uint256 today = block.timestamp / 1 days;
  require(
    dailySpent[agent][today] + amount
      <= p.dailyLimit,
    "Exceeds daily limit"
  );
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Form */}
      <section className="py-20 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <OnboardingForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <span className="text-sm text-zinc-400">
                AgentGuard — AI Vault Manager
              </span>
            </div>
            <div className="text-sm text-zinc-500">
              Built for ETHGlobal 2024
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
