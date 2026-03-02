/** Theme registry - each theme defines its own logic and UI */

import { demographyTheme } from './demographyTheme'
import { climateTheme } from './climateTheme'

const THEMES = { demography: demographyTheme, climate: climateTheme }

export function getTheme(id) {
  const theme = THEMES[id]
  if (!theme) return demographyTheme
  return theme
}

export function getThemeIds() {
  return Object.keys(THEMES)
}

export function getThemesList() {
  return Object.values(THEMES)
}

export { demographyTheme, climateTheme }
