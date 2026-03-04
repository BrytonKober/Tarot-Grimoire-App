import { dbPromise, GrimoirePage, TarotSnapshot } from './db';

export async function getPages(): Promise<GrimoirePage[]> {
  const db = await dbPromise;
  const allPages = await db.getAllFromIndex('pages', 'by-updated');
  return allPages.reverse();
}

export async function putPage(page: GrimoirePage): Promise<void> {
  const db = await dbPromise;
  await db.put('pages', page);
  window.dispatchEvent(new Event('localDataChanged'));
}

export async function deletePage(id: string): Promise<void> {
  const db = await dbPromise;
  await db.delete('pages', id);
  window.dispatchEvent(new Event('localDataChanged'));
}

export async function getSnapshots(): Promise<TarotSnapshot[]> {
  const db = await dbPromise;
  const all = await db.getAllFromIndex('snapshots', 'by-created');
  return all.reverse();
}

export async function putSnapshot(snapshot: TarotSnapshot): Promise<void> {
  const db = await dbPromise;
  await db.put('snapshots', snapshot);
  window.dispatchEvent(new Event('localDataChanged'));
}

export async function hasLocalData(): Promise<boolean> {
  const db = await dbPromise;
  const pagesCount = await db.count('pages');
  const snapsCount = await db.count('snapshots');
  return pagesCount > 0 || snapsCount > 0;
}
