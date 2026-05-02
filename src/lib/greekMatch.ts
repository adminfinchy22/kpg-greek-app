/** Strip Greek accent marks for loose comparison */
export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

/** Exact or accent-insensitive match */
export function isCorrectGreek(input: string, target: string, strictAccents: boolean): boolean {
  const i = input.trim().toLowerCase()
  const t = target.trim().toLowerCase()
  if (strictAccents) return i === t
  return i === t || stripAccents(i) === stripAccents(t)
}

/** Roughly one–two chars off (accent-stripped) */
export function isCloseGreek(input: string, target: string): boolean {
  const i = stripAccents(input.trim())
  const t = stripAccents(target.trim())
  if (Math.abs(i.length - t.length) > 2) return false
  let diff = 0
  const len = Math.max(i.length, t.length)
  for (let n = 0; n < len; n++) {
    if (i[n] !== t[n]) diff++
  }
  return diff <= 2
}
