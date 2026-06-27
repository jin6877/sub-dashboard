export type PersistState = 'persisted' | 'transient' | 'unsupported'

/**
 * Ask the browser to keep our IndexedDB data even under storage pressure.
 * Returns the resulting persistence state.
 *
 * - 'persisted'  : data is durable, browser won't auto-evict it.
 * - 'transient'  : storage works but may be cleared under pressure
 *                  (request was denied — usually granted automatically once
 *                  the app is installed as a PWA / used enough).
 * - 'unsupported': the Storage API isn't available.
 */
export async function ensurePersistentStorage(): Promise<PersistState> {
  if (!('storage' in navigator) || !navigator.storage?.persist) {
    return 'unsupported'
  }
  try {
    if (await navigator.storage.persisted()) return 'persisted'
    const granted = await navigator.storage.persist()
    return granted ? 'persisted' : 'transient'
  } catch {
    return 'unsupported'
  }
}
