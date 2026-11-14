import { useLiveQuery } from 'dexie-react-hooks'
import { getChapterStats, getTodayCounts, setActiveCount } from '../lib/queries'

export function Today({ onStart }: { onStart: () => void }) {
  const stats = useLiveQuery(() => getChapterStats(), [])
  const counts = useLiveQuery(() => getTodayCounts(), [])

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-5 pb-2 pt-4">
        <h1 className="text-2xl font-semibold text-white">Vandaag</h1>
        <p className="text-sm text-slate-500">Grieks woord zien, betekenis raden, jezelf beoordelen.</p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Startkaart */}
        <div className="mt-2 rounded-2xl bg-slate-900 p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-bold text-white">{counts?.total ?? 0}</div>
              <div className="text-sm text-slate-500">kaarten klaar</div>
            </div>
            <div className="text-right text-sm text-slate-400">
              <div>{counts?.due ?? 0} te herhalen</div>
              <div>{counts?.nieuw ?? 0} nieuw</div>
            </div>
          </div>
          <button
            onClick={onStart}
            disabled={(counts?.total ?? 0) === 0}
            className="mt-4 w-full rounded-xl bg-emerald-600 py-4 text-lg font-semibold text-white active:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {(counts?.total ?? 0) === 0 ? 'Niks te doen nu' : 'Start'}
          </button>
        </div>

        {/* Hoofdstukken met slider */}
        <h2 className="mb-2 mt-7 text-sm font-medium uppercase tracking-wide text-slate-500">
          Hoofdstukken
        </h2>
        <div className="space-y-3">
          {stats?.map((s) => {
            const pct = s.activeCount > 0 ? Math.round((s.learned / s.activeCount) * 100) : 0
            const heavy = s.newCount >= 20
            return (
              <div key={s.chapter} className="rounded-2xl bg-slate-900 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-100">Hoofdstuk {s.chapter}</div>
                  <div className="text-xs text-slate-500">
                    {s.learned}/{s.activeCount} geleerd
                  </div>
                </div>

                {/* voortgangsbalk */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>

                {/* slider */}
                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={s.max}
                    value={s.activeCount}
                    onChange={(e) => setActiveCount(s.chapter, Number(e.target.value))}
                    className="h-6 flex-1 accent-emerald-500"
                  />
                  <div className="w-14 text-right text-sm tabular-nums text-slate-300">
                    {s.activeCount}/{s.max}
                  </div>
                </div>

                {/* review-druk */}
                <div className="mt-2 text-xs text-slate-500">
                  {s.activeCount} actief · {s.newCount} nieuw te starten · {s.due} nu te herhalen
                </div>
                {heavy && (
                  <div className="mt-1 text-xs text-amber-400">
                    Veel nieuwe woorden tegelijk. Dit geeft de komende dagen meer herhalingen.
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Schuif de slider terug als het te veel wordt. Je voortgang blijft bewaard, de woorden gaan
          alleen op pauze.
        </p>
      </div>
    </div>
  )
}
