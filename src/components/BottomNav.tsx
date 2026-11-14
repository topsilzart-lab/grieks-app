export type Tab = 'today' | 'sentences' | 'favorites' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Vandaag', icon: '◉' },
  { id: 'sentences', label: 'Zinnen', icon: '💬' },
  { id: 'favorites', label: 'Favorieten', icon: '★' },
  { id: 'settings', label: 'Instellingen', icon: '⚙' },
]

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="safe-bottom border-t border-slate-800 bg-slate-950">
      <div className="grid grid-cols-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${
              tab === t.id ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
