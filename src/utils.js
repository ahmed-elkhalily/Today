export const todayISO = () => new Date().toISOString().slice(0, 10)

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export const round1 = (n) => Math.round(n * 10) / 10
