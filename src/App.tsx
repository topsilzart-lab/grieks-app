import { useEffect, useState } from 'react'
import { ensureSeeded, ensureSentences } from './lib/seed'
import { BottomNav, type Tab } from './components/BottomNav'
import { Today } from './screens/Today'
import { Favorites } from './screens/Favorites'
import { Settings } from './screens/Settings'
import { Review } from './screens/Review'
import { Sentences } from './screens/Sentences'

export default function App() {
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<Tab>('today')
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    ensureSeeded()
      .then(() => ensureSentences())
      .then(() => setReady(true))
      .catch((e) => {
        console.error(e)
        setReady(true)
      })
  }, [])

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <div className="text-center">
          <div className="text-4xl">Ελληνικά</div>
          <div className="mt-2 text-sm">laden…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <main className="flex-1 overflow-hidden">
        {reviewing ? (
          <Review onDone={() => setReviewing(false)} />
        ) : tab === 'today' ? (
          <Today onStart={() => setReviewing(true)} />
        ) : tab === 'sentences' ? (
          <Sentences />
        ) : tab === 'favorites' ? (
          <Favorites />
        ) : (
          <Settings />
        )}
      </main>
      {!reviewing && <BottomNav tab={tab} onChange={setTab} />}
    </div>
  )
}
