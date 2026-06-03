import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Load `.env` / `.env.local` into process.env (Node scripts do not do this automatically). */
export function loadEnvFiles(cwd = process.cwd()) {
  for (const name of ['.env', '.env.local']) {
    const path = join(cwd, name)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) {
        if (/^https?:\/\/stooq/i.test(trimmed)) {
          console.warn(
            `[env] ${name} has a bare Stooq URL without a variable name. Use:\n` +
              `      STOOQ_SPY_CSV_URL=${trimmed}`,
          )
        }
        continue
      }
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  }
}
