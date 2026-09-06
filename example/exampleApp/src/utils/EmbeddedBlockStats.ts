import { useSyncExternalStore } from 'react'

/**
 * Per-block counters for the demo screens: how many times the block's component was mounted, and how
 * many times the block reported onLoad and onFail.
 *
 * A recreated block does not look recreated — the shimmer flashes and it passes for an ordinary
 * re-render. The numbers tell: more than one mount, or a second onLoad, for the same block means the
 * host destroyed the native view and the SDK built the place from scratch.
 *
 * The counters live outside React state on purpose. The anti-pattern screen remounts its block on
 * every re-render of the screen; a counter kept in that screen's state would re-render the screen on
 * every mount, and that is an endless loop. A store that only the counter rows subscribe to re-renders
 * only those rows.
 */
export type BlockStats = {
  mounts: number
  loads: number
  fails: number
}

const NONE: BlockStats = { mounts: 0, loads: 0, fails: 0 }

let stats: Record<string, BlockStats> = {}
const listeners = new Set<() => void>()

const publish = (next: Record<string, BlockStats>) => {
  stats = next
  listeners.forEach((listener) => listener())
}

const bump = (id: string, field: keyof BlockStats) => {
  const current = stats[id] ?? NONE
  publish({ ...stats, [id]: { ...current, [field]: current[field] + 1 } })
}

export const blockStats = {
  mounted: (id: string) => bump(id, 'mounts'),
  loaded: (id: string) => bump(id, 'loads'),
  failed: (id: string) => bump(id, 'fails'),
  /** Forgets the given counters. A demo screen calls it when it is left, so the next visit starts clean. */
  forget: (ids: Array<string>) => {
    const next = { ...stats }
    ids.forEach((id) => delete next[id])
    publish(next)
  },
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const snapshot = () => stats

export const useBlockStats = (id: string): BlockStats => useSyncExternalStore(subscribe, snapshot)[id] ?? NONE
