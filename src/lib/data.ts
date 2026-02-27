import { dbPromise, GrimoirePage, TarotSnapshot } from './db';
import { auth, db as firestore } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';

export async function getPages(): Promise<GrimoirePage[]> {
  const user = auth.currentUser;
  if (user) {
    const q = query(collection(firestore, `users/${user.uid}/pages`), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as GrimoirePage);
  } else {
    const db = await dbPromise;
    const allPages = await db.getAllFromIndex('pages', 'by-updated');
    return allPages.reverse();
  }
}

export async function putPage(page: GrimoirePage): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await setDoc(doc(firestore, `users/${user.uid}/pages`, page.id), page);
  } else {
    const db = await dbPromise;
    await db.put('pages', page);
    window.dispatchEvent(new Event('localDataChanged'));
  }
}

export async function deletePage(id: string): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await deleteDoc(doc(firestore, `users/${user.uid}/pages`, id));
  } else {
    const db = await dbPromise;
    await db.delete('pages', id);
    window.dispatchEvent(new Event('localDataChanged'));
  }
}

export async function getSnapshots(): Promise<TarotSnapshot[]> {
  const user = auth.currentUser;
  if (user) {
    const q = query(collection(firestore, `users/${user.uid}/snapshots`), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as TarotSnapshot);
  } else {
    const db = await dbPromise;
    const all = await db.getAllFromIndex('snapshots', 'by-created');
    return all.reverse();
  }
}

export async function putSnapshot(snapshot: TarotSnapshot): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await setDoc(doc(firestore, `users/${user.uid}/snapshots`, snapshot.id), snapshot);
  } else {
    const db = await dbPromise;
    await db.put('snapshots', snapshot);
    window.dispatchEvent(new Event('localDataChanged'));
  }
}

export async function transferLocalDataToFirebase(uid: string): Promise<void> {
  const db = await dbPromise;
  const localPages = await db.getAll('pages');
  const localSnapshots = await db.getAll('snapshots');

  if (localPages.length === 0 && localSnapshots.length === 0) return;

  const batch = writeBatch(firestore);

  for (const page of localPages) {
    const ref = doc(firestore, `users/${uid}/pages`, page.id);
    batch.set(ref, page);
  }

  for (const snap of localSnapshots) {
    const ref = doc(firestore, `users/${uid}/snapshots`, snap.id);
    batch.set(ref, snap);
  }

  await batch.commit();

  // Clear local data after successful transfer
  const tx = db.transaction(['pages', 'snapshots'], 'readwrite');
  await tx.objectStore('pages').clear();
  await tx.objectStore('snapshots').clear();
  await tx.done;
}

export async function hasLocalData(): Promise<boolean> {
  const db = await dbPromise;
  const pagesCount = await db.count('pages');
  const snapsCount = await db.count('snapshots');
  return pagesCount > 0 || snapsCount > 0;
}
