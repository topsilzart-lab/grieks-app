/** Korte Nederlandse weergave van een interval vanaf nu tot `due`. */
export function formatInterval(due: Date | number, from: number = Date.now()): string {
  const target = due instanceof Date ? due.getTime() : due
  const diff = Math.max(0, target - from)
  const min = diff / 60000
  if (min < 1) return 'nu'
  if (min < 60) return `${Math.round(min)} min`
  const hours = min / 60
  if (hours < 24) return `${Math.round(hours)} u`
  const days = hours / 24
  if (days < 30) return `${Math.round(days)} d`
  const months = days / 30
  if (months < 12) return `${Math.round(months)} mnd`
  return `${(days / 365).toFixed(1)} j`
}
