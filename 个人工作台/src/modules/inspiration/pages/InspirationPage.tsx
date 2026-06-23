// 灵感独立页面
import { InspirationSection } from './InspirationSection'

export function InspirationPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">每日灵感</h2>
      <InspirationSection registerPanel={() => {}} />
    </div>
  )
}
