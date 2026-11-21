import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
  setLogLevel,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { Project, SiteSettings, TestimonialItem, ContactInquiry } from './types';
import {
  INITIAL_PROJECTS,
  DEFAULT_SITE_SETTINGS,
  INITIAL_TESTIMONIALS,
} from './data/initialProjects';

export const ADMIN_EMAIL = 'eddykoby64@gmail.com';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    experimentalLongPollingOptions: { timeoutSeconds: 8 },
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents`;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function isOfflineNetworkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code = (error as any)?.code ? String((error as any).code).toLowerCase() : '';
  return (
    msg.includes('client is offline') ||
    msg.includes('could not reach cloud firestore') ||
    msg.includes('unavailable') ||
    code === 'unavailable' ||
    code === 'failed-precondition'
  );
}

// --- Firestore REST API Helpers (Bypasses WebChannel/Listen stalls in Firefox/Proxies) ---
function decodeFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return undefined;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return Array.isArray(val.arrayValue?.values)
      ? val.arrayValue.values.map(decodeFirestoreValue)
      : [];
  }
  if ('mapValue' in val) {
    const out: Record<string, any> = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = decodeFirestoreValue(v);
    }
    return out;
  }
  return undefined;
}

function decodeFirestoreDocument(docJson: any): Record<string, any> {
  const out: Record<string, any> = {};
  const fields = docJson?.fields || {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = decodeFirestoreValue(v);
  }
  return out;
}

function encodeFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = encodeFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function encodeFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = encodeFirestoreValue(v);
  }
  return fields;
}

async function fetchPublicJsonWithTimeout(
  url: string,
  timeoutMs = 4500,
  init?: RequestInit
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (res.status === 404) return { __notFound: true };
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPublicCollectionRest(col: 'projects' | 'testimonials' | 'settings'): Promise<any> {
  try {
    if (col === 'settings') {
      return await fetchPublicJsonWithTimeout(
        `${FIRESTORE_REST_BASE}/settings/main?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
        4000
      );
    }
    const rows = await fetchPublicJsonWithTimeout(
      `${FIRESTORE_REST_BASE}:runQuery?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      4000,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: col }],
          },
        }),
      }
    );
    const list = Array.isArray(rows) ? rows : [];
    return {
      documents: list.filter((r: any) => r?.document).map((r: any) => r.document),
    };
  } catch {
    return await fetchPublicJsonWithTimeout(`/api/public-firestore/${col}`, 4500);
  }
}

async function getOptionalAuthHeader(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function restCommitWrite(
  docPath: string,
  fieldsObj: Record<string, any>,
  timestampFields: ('createdAt' | 'updatedAt')[],
  updateMask?: string[]
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await getOptionalAuthHeader()),
  };
  const fullDocName = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${docPath}`;
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents:commit?key=${encodeURIComponent(firebaseConfig.apiKey)}`;

  const writeOp: any = {
    update: {
      name: fullDocName,
      fields: encodeFirestoreFields(fieldsObj),
    },
    updateTransforms: timestampFields.map((fieldPath) => ({
      fieldPath,
      setToServerValue: 'REQUEST_TIME',
    })),
  };

  if (updateMask && updateMask.length > 0) {
    writeOp.updateMask = { fieldPaths: updateMask };
  }

  const res = await fetch(commitUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ writes: [writeOp] }),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Firestore write failed (${res.status})`);
  }
}

let webChannelBlocked = false;

async function restDeleteDoc(docPath: string): Promise<void> {
  const headers = await getOptionalAuthHeader();
  const res = await fetch(
    `${FIRESTORE_REST_BASE}/${docPath}?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
    { method: 'DELETE', headers }
  );
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Delete failed (${res.status})`);
  }
}

async function testConnection() {
  setLogLevel('silent');
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    webChannelBlocked = false;
    setLogLevel('error');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      try {
        await fetchPublicCollectionRest('settings');
        webChannelBlocked = true;
        return; // REST endpoint reached cleanly; WebChannel only blocked in browser/proxy
      } catch {
        setLogLevel('error');
        console.error('Please check your Firebase configuration.');
      }
    } else {
      setLogLevel('error');
    }
  }
}
testConnection();

export function isAuthorizedAdmin(user: User | null): boolean {
  if (!user) return false;
  return Boolean(user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
}

export async function signInAdminWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  if (!isAuthorizedAdmin(result.user)) {
    const signedEmail = result.user.email || 'unknown account';
    await signOut(auth);
    throw new Error(
      `Access denied for ${signedEmail}. Please sign in with the authorized admin Google account (${ADMIN_EMAIL}).`
    );
  }
  return result.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null, isAdmin: boolean) => void) {
  return onAuthStateChanged(auth, (user) => {
    callback(user, isAuthorizedAdmin(user));
  });
}

// --- Defensive Sanitization & Volumetric Clamping (Synced with firebase-blueprint.json) ---
const VALID_CATEGORIES = ['Flyers', 'Branding', 'Social Media', 'Posters', 'Print Design', 'Other'] as const;

function clampStr(val: unknown, max: number, fallback = ''): string {
  const s = typeof val === 'string' ? val.trim() : String(val ?? fallback).trim();
  return s.slice(0, max);
}

function toIsoString(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string' && ts) return ts;
  return new Date().toISOString();
}

function mapDocToProject(data: Record<string, any>): Project {
  return {
    id: String(data.id),
    title: String(data.title || ''),
    category: VALID_CATEGORIES.includes(data.category) ? data.category : 'Other',
    description: String(data.description || ''),
    image_url: String(data.image_url || ''),
    gallery_images: Array.isArray(data.gallery_images) ? data.gallery_images.map(String) : [],
    year: String(data.year || '2026'),
    client: String(data.client || ''),
    featured: Boolean(data.featured),
    display_order: Number(data.display_order) || 1,
    created_at: toIsoString(data.createdAt || data.created_at),
    updated_at: data.updatedAt ? toIsoString(data.updatedAt) : undefined,
  };
}

function sanitizeProjectPayload(data: Omit<Project, 'id' | 'created_at'>) {
  const category = VALID_CATEGORIES.includes(data.category) ? data.category : 'Other';
  const gallery = Array.isArray(data.gallery_images)
    ? data.gallery_images
        .filter((g): g is string => typeof g === 'string' && g.trim().length > 0)
        .slice(0, 12)
        .map((g) => clampStr(g, 2000))
    : [];

  return {
    title: clampStr(data.title, 140) || 'Untitled Project',
    category,
    description: clampStr(data.description, 2000) || 'Graphic design showcase.',
    image_url: clampStr(data.image_url, 2000),
    gallery_images: gallery,
    year: clampStr(data.year || '2026', 10) || '2026',
    client: clampStr(data.client || '', 140),
    featured: Boolean(data.featured),
    display_order: Number(data.display_order) || 1,
  };
}

function sanitizeSettingsPayload(s: SiteSettings) {
  const tools = Array.isArray(s.tools)
    ? s.tools.slice(0, 20).map((t) => ({
        name: clampStr(t.name, 100) || 'Tool',
        level: clampStr(t.level, 60) || 'Advanced',
        category: clampStr(t.category, 120) || 'Design Workflow',
      }))
    : DEFAULT_SITE_SETTINGS.tools;

  return {
    creativeProjects: clampStr(s.creativeProjects, 40) || DEFAULT_SITE_SETTINGS.creativeProjects,
    designServices: clampStr(s.designServices, 40) || DEFAULT_SITE_SETTINGS.designServices,
    yearsExperience: clampStr(s.yearsExperience, 40) || DEFAULT_SITE_SETTINGS.yearsExperience,
    happyClients: clampStr(s.happyClients, 40) || DEFAULT_SITE_SETTINGS.happyClients,
    whatsappNumber: clampStr(s.whatsappNumber, 30) || DEFAULT_SITE_SETTINGS.whatsappNumber,
    email: clampStr(s.email, 150) || DEFAULT_SITE_SETTINGS.email,
    instagramUrl: clampStr(s.instagramUrl, 300),
    linkedinUrl: clampStr(s.linkedinUrl, 300),
    behanceUrl: clampStr(s.behanceUrl, 300),
    facebookUrl: clampStr(s.facebookUrl, 300),
    profileImageUrl: clampStr(s.profileImageUrl, 2000),
    heroAvailability: clampStr(s.heroAvailability, 120) || DEFAULT_SITE_SETTINGS.heroAvailability,
    heroHeadline: clampStr(s.heroHeadline, 160) || DEFAULT_SITE_SETTINGS.heroHeadline,
    heroHeadlineAccent: clampStr(s.heroHeadlineAccent, 160) || DEFAULT_SITE_SETTINGS.heroHeadlineAccent,
    heroSubtext: clampStr(s.heroSubtext, 600) || DEFAULT_SITE_SETTINGS.heroSubtext,
    heroShowcaseTitle: clampStr(s.heroShowcaseTitle, 120) || DEFAULT_SITE_SETTINGS.heroShowcaseTitle,
    heroShowcaseSubtitle:
      clampStr(s.heroShowcaseSubtitle, 160) || DEFAULT_SITE_SETTINGS.heroShowcaseSubtitle,
    aboutHeading: clampStr(s.aboutHeading, 160) || DEFAULT_SITE_SETTINGS.aboutHeading,
    aboutIntro: clampStr(s.aboutIntro, 500) || DEFAULT_SITE_SETTINGS.aboutIntro,
    aboutBioTitle: clampStr(s.aboutBioTitle, 140) || DEFAULT_SITE_SETTINGS.aboutBioTitle,
    aboutBioParagraph1: clampStr(s.aboutBioParagraph1, 1000) || DEFAULT_SITE_SETTINGS.aboutBioParagraph1,
    aboutBioParagraph2: clampStr(s.aboutBioParagraph2, 1000) || DEFAULT_SITE_SETTINGS.aboutBioParagraph2,
    aboutApproachTitle: clampStr(s.aboutApproachTitle, 100) || DEFAULT_SITE_SETTINGS.aboutApproachTitle,
    aboutApproachDesc: clampStr(s.aboutApproachDesc, 300) || DEFAULT_SITE_SETTINGS.aboutApproachDesc,
    aboutDeliveryTitle: clampStr(s.aboutDeliveryTitle, 100) || DEFAULT_SITE_SETTINGS.aboutDeliveryTitle,
    aboutDeliveryDesc: clampStr(s.aboutDeliveryDesc, 300) || DEFAULT_SITE_SETTINGS.aboutDeliveryDesc,
    tools,
  };
}

// --- Seed Initial Starter Data into Firestore on Admin Login if Empty ---
export async function seedInitialDataIfEmpty(): Promise<void> {
  if (!isAuthorizedAdmin(auth.currentUser)) return;

  try {
    const [existingProjects, existingTestimonials, existingSettings] = await Promise.all([
      fetchPublicCollectionRest('projects').catch(() => ({ documents: [] })),
      fetchPublicCollectionRest('testimonials').catch(() => ({ documents: [] })),
      fetchPublicCollectionRest('settings').catch(() => ({ __notFound: true })),
    ]);

    const projEmpty = !Array.isArray(existingProjects?.documents) || existingProjects.documents.length === 0;
    const testEmpty =
      !Array.isArray(existingTestimonials?.documents) || existingTestimonials.documents.length === 0;
    const settEmpty = Boolean(existingSettings?.__notFound || existingSettings?.exists === false || !existingSettings?.fields);

    if (!projEmpty && !testEmpty && !settEmpty) {
      return;
    }

    const seedViaRest = async () => {
      if (projEmpty) {
        for (const proj of INITIAL_PROJECTS) {
          await restCommitWrite(
            `projects/${proj.id}`,
            { id: proj.id, ...sanitizeProjectPayload(proj) },
            ['createdAt', 'updatedAt']
          );
        }
      }
      if (testEmpty) {
        for (const item of INITIAL_TESTIMONIALS) {
          await restCommitWrite(
            `testimonials/${item.id}`,
            {
              id: item.id,
              name: clampStr(item.name, 100),
              company: clampStr(item.company, 120),
              role: clampStr(item.role, 100) || 'Client',
              text: clampStr(item.text, 1200),
              avatar: clampStr(item.avatar || '', 2000),
            },
            ['createdAt', 'updatedAt']
          );
        }
      }
      if (settEmpty) {
        await restCommitWrite(
          'settings/main',
          sanitizeSettingsPayload(DEFAULT_SITE_SETTINGS),
          ['updatedAt']
        );
      }
    };

    if (webChannelBlocked) {
      await seedViaRest();
      return;
    }

    try {
      const batch = writeBatch(db);
      if (projEmpty) {
        for (const proj of INITIAL_PROJECTS) {
          const sanitized = sanitizeProjectPayload(proj);
          batch.set(doc(db, 'projects', proj.id), {
            id: proj.id,
            ...sanitized,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
      if (testEmpty) {
        for (const item of INITIAL_TESTIMONIALS) {
          batch.set(doc(db, 'testimonials', item.id), {
            id: item.id,
            name: clampStr(item.name, 100),
            company: clampStr(item.company, 120),
            role: clampStr(item.role, 100) || 'Client',
            text: clampStr(item.text, 1200),
            avatar: clampStr(item.avatar || '', 2000),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
      if (settEmpty) {
        batch.set(doc(db, 'settings', 'main'), {
          ...sanitizeSettingsPayload(DEFAULT_SITE_SETTINGS),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (sdkErr) {
      if (!isOfflineNetworkError(sdkErr)) throw sdkErr;
      webChannelBlocked = true;
      await seedViaRest();
    }
  } catch (error) {
    if (!isOfflineNetworkError(error)) {
      handleFirestoreError(error, OperationType.WRITE, 'seed');
    }
  }
}

// --- Projects CRUD ---
export async function fetchProjectsFromFirestore(): Promise<Project[]> {
  try {
    const json = await fetchPublicCollectionRest('projects');
    if (Array.isArray(json?.documents) && json.documents.length > 0) {
      return json.documents
        .map((d: any) => mapDocToProject(decodeFirestoreDocument(d)))
        .sort((a: Project, b: Project) => (a.display_order ?? 999) - (b.display_order ?? 999));
    }
    return INITIAL_PROJECTS;
  } catch {
    try {
      const q = query(collection(db, 'projects'), orderBy('display_order', 'asc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return INITIAL_PROJECTS;
      return snapshot.docs.map((d) => mapDocToProject(d.data()));
    } catch (error) {
      if (isOfflineNetworkError(error)) {
        return INITIAL_PROJECTS;
      }
      handleFirestoreError(error, OperationType.LIST, 'projects');
    }
  }
}

export async function createProjectInFirestore(
  projectData: Omit<Project, 'id' | 'created_at'>
): Promise<Project> {
  const id = `proj-${Date.now()}`;
  const path = `projects/${id}`;
  const clean = sanitizeProjectPayload(projectData);
  const runRest = async () => {
    await restCommitWrite(path, { id, ...clean }, ['createdAt', 'updatedAt']);
    return { id, ...clean, created_at: new Date().toISOString() };
  };
  if (webChannelBlocked) {
    try {
      return await runRest();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }
  try {
    await setDoc(doc(db, 'projects', id), {
      id,
      ...clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id, ...clean, created_at: new Date().toISOString() };
  } catch (error) {
    if (isOfflineNetworkError(error)) {
      webChannelBlocked = true;
      try {
        return await runRest();
      } catch (restErr) {
        handleFirestoreError(restErr, OperationType.CREATE, path);
      }
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProjectInFirestore(
  id: string,
  projectData: Omit<Project, 'id' | 'created_at'>
): Promise<Project> {
  const path = `projects/${id}`;
  const clean = sanitizeProjectPayload(projectData);
  const runRest = async () => {
    await restCommitWrite(path, clean, ['updatedAt'], Object.keys(clean));
    return {
      id,
      ...clean,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };
  if (webChannelBlocked) {
    try {
      return await runRest();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }
  try {
    await updateDoc(doc(db, 'projects', id), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
    return {
      id,
      ...clean,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    if (isOfflineNetworkError(error)) {
      webChannelBlocked = true;
      try {
        return await runRest();
      } catch (restErr) {
        handleFirestoreError(restErr, OperationType.UPDATE, path);
      }
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProjectInFirestore(id: string): Promise<void> {
  const path = `projects/${id}`;
  if (webChannelBlocked) {
    try {
      await restDeleteDoc(path);
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (error) {
    if (isOfflineNetworkError(error)) {
      webChannelBlocked = true;
      try {
        await restDeleteDoc(path);
        return;
      } catch (restErr) {
        handleFirestoreError(restErr, OperationType.DELETE, path);
      }
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Testimonials CRUD ---
export async function fetchTestimonialsFromFirestore(): Promise<TestimonialItem[]> {
  try {
    const json = await fetchPublicCollectionRest('testimonials');
    if (Array.isArray(json?.documents) && json.documents.length > 0) {
      return json.documents
        .map((d: any) => {
          const data = decodeFirestoreDocument(d);
          return {
            id: String(data.id),
            name: String(data.name || ''),
            company: String(data.company || ''),
            role: String(data.role || 'Client'),
            text: String(data.text || ''),
            avatar: String(data.avatar || ''),
            created_at: toIsoString(data.createdAt || data.created_at),
          };
        })
        .sort(
          (a: TestimonialItem, b: TestimonialItem) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    }
    return INITIAL_TESTIMONIALS;
  } catch {
    try {
      const snapshot = await getDocs(collection(db, 'testimonials'));
      if (snapshot.empty) return INITIAL_TESTIMONIALS;
      return snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: String(data.id),
            name: String(data.name || ''),
            company: String(data.company || ''),
            role: String(data.role || 'Client'),
            text: String(data.text || ''),
            avatar: String(data.avatar || ''),
            created_at: toIsoString(data.createdAt || data.created_at),
          };
        })
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    } catch (error) {
      if (isOfflineNetworkError(error)) {
        return INITIAL_TESTIMONIALS;
      }
      handleFirestoreError(error, OperationType.LIST, 'testimonials');
    }
  }
}

export async function createTestimonialInFirestore(
  data: Omit<TestimonialItem, 'id' | 'created_at'>
): Promise<TestimonialItem> {
  const id = `test-${Date.now()}`;
  const path = `testimonials/${id}`;
  const clean = {
    name: clampStr(data.name, 100),
    company: clampStr(data.company, 120),
    role: clampStr(data.role || 'Client', 100) || 'Client',
    text: clampStr(data.text, 1200),
    avatar: clampStr(data.avatar || '', 2000),
  };
  const runRest = async () => {
    await restCommitWrite(path, { id, ...clean }, ['createdAt', 'updatedAt']);
    return { id, ...clean, created_at: new Date().toISOString() };
  };
  if (webChannelBlocked) {
    try {
      return await runRest();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }
  try {
    await setDoc(doc(db, 'testimonials', id), {
      id,
      ...clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id, ...clean, created_at: new Date().toISOString() };
  } catch (error) {
    if (isOfflineNetworkError(error)) {
      webChannelBlocked = true;
      try {
        return await runRest();
      } catch (restErr) {
        handleFirestoreError(restErr, OperationType.CREATE, path);
      }
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTestimonialInFirestore(
  id: string,
  data: Omit<TestimonialItem, 'id' | 'created_at'>
): Promise<TestimonialItem> {
  const path = `testimonials/${id}`;
  const clean = {
    name: clampStr(data.name, 100),
    company: clampStr(data.company, 120),
    role: clampStr(data.role || 'Client', 100) || 'Client',
    text: clampStr(data.text, 1200),
    avatar: clampStr(data.avatar || '', 2000),
  };
  const runRest = async () => {
    await restCommitWrite(path, clean, ['updatedAt'], Object.keys(clean));
    return { id, ...clean };
  };
  if (webChannelBlocked) {
    try {
      return await runRest();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }
  try {
    await updateDoc(doc(db, 'testimonials', id), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
    return { id, ...clean };
  } catch (error) {
    if (isOfflineNetworkError(error)) {
      webChannelBlocked = true;
      try {
        return await runRest();
      } catch (restErr) {
        handleFirestoreError(restErr, OperationType.UPDATE, path);
      }
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTestimonialFromFirestore(id: string): Promise<void> {
  const path = `testimonials/${id}`;
  if (webChannelBlocked) {
    try {
      await restDeleteDoc(path);
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
  try {
    await deleteDoc(doc(db, 'testimonials', id));
  } catch (error) {
    if (isOfflineNetworkError(error)) {
      webChannelBlocked = true;
      try {
        await restDeleteDoc(path);
        return;
      } catch (restErr) {
        handleFirestoreError(restErr, OperationType.DELETE, path);
      }
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Site Settings ---
export async function fetchSettingsFromFirestore(): Promise<SiteSettings> {
  const path = 'settings/main';
  try {
    const json = await fetchPublicCollectionRest('settings');
    if (json?.__notFound || json?.exists === false || !json?.fields) {
      return DEFAULT_SITE_SETTINGS;
    }
    const data = decodeFirestoreDocument(json) as Partial<SiteSettings>;
    return {
      ...DEFAULT_SITE_SETTINGS,
      ...data,
      tools: Array.isArray(data.tools) ? data.tools : DEFAULT_SITE_SETTINGS.tools,
    };
  } catch {
    try {
      const snap = await getDoc(doc(db, 'settings', 'main'));
      if (!snap.exists()) return DEFAULT_SITE_SETTINGS;
      const data = snap.data() as Partial<SiteSettings>;
      return {
        ...DEFAULT_SITE_SETTINGS,
        ...data,
        tools: Array.isArray(data.tools) ? data.tools : DEFAULT_SITE_SETTINGS.tools,
      };
    } catch (error) {
      if (isOfflineNetworkError(error)) {
        return DEFAULT_SITE_SETTINGS;
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  }
}

export async function saveSettingsToFirestore(newSettings: SiteSettings): Promise<SiteSettings> {
  const path = 'settings/main';
  const clean = sanitizeSettingsPayload(newSettings);
  const runRest = async () => {
    await restCommitWrite(path, clean, ['updatedAt']);
    return clean;
  };
  if (webChannelBlocked) {
    try {
      return await runRest();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
  try {
    const docRef = doc(db, 'settings', 'main');
    await setDoc(docRef, {
      ...clean,
      updatedAt: serverTimestamp(),
    });
    return clean;
  } catch (error) {
    if (isOfflineNetworkError(error)) {
      webChannelBlocked = true;
      try {
        return await runRest();
      } catch (restErr) {
        handleFirestoreError(restErr, OperationType.WRITE, path);
      }
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- Contact Inquiries ---
export async function createInquiryInFirestore(input: {
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
}): Promise<ContactInquiry> {
  const id = `inq-${Date.now()}`;
  const path = `inquiries/${id}`;
  const clean = {
    id,
    name: clampStr(input.name, 120),
    email: clampStr(input.email, 180),
    projectType: clampStr(input.projectType || 'General Design', 80),
    budget: clampStr(input.budget || 'Not specified', 80),
    message: clampStr(input.message, 3000),
  };
  const runRest = async () => {
    await restCommitWrite(path, clean, ['createdAt']);
    return { ...clean, created_at: new Date().toISOString() };
  };
  if (webChannelBlocked) {
    try {
      return await runRest();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }
  try {
    await setDoc(doc(db, 'inquiries', id), {
      ...clean,
      createdAt: serverTimestamp(),
    });
    return { ...clean, created_at: new Date().toISOString() };
  } catch (error) {
    if (isOfflineNetworkError(error)) {
      webChannelBlocked = true;
      try {
        return await runRest();
      } catch (restErr) {
        handleFirestoreError(restErr, OperationType.CREATE, path);
      }
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchInquiriesFromFirestore(): Promise<ContactInquiry[]> {
  const runRest = async () => {
    const headers = {
      'Content-Type': 'application/json',
      ...(await getOptionalAuthHeader()),
    };
    const res = await fetch(
      `${FIRESTORE_REST_BASE}:runQuery?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'inquiries' }],
          },
        }),
      }
    );
    if (!res.ok) throw new Error(`Failed to fetch inquiries (${res.status})`);
    const rows = await res.json();
    const docs = Array.isArray(rows)
      ? rows.filter((r: any) => r?.document).map((r: any) => r.document)
      : [];
    return docs
      .map((d: any) => {
        const data = decodeFirestoreDocument(d);
        return {
          id: String(data.id),
          name: String(data.name || ''),
          email: String(data.email || ''),
          projectType: String(data.projectType || 'General Design'),
          budget: String(data.budget || ''),
          message: String(data.message || ''),
          created_at: toIsoString(data.createdAt),
        };
      })
      .sort(
        (a: ContactInquiry, b: ContactInquiry) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  };
  if (webChannelBlocked) {
    try {
      return await runRest();
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'inquiries');
    }
  }
  try {
    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id),
        name: String(data.name || ''),
        email: String(data.email || ''),
        projectType: String(data.projectType || 'General Design'),
        budget: String(data.budget || ''),
        message: String(data.message || ''),
        created_at: toIsoString(data.createdAt),
      };
    });
  } catch (error) {
    if (isOfflineNetworkError(error)) {
      webChannelBlocked = true;
      try {
        return await runRest();
      } catch (restErr) {
        handleFirestoreError(restErr, OperationType.LIST, 'inquiries');
      }
    }
    handleFirestoreError(error, OperationType.LIST, 'inquiries');
  }
}

export async function deleteInquiryFromFirestore(id: string): Promise<void> {
  const path = `inquiries/${id}`;
  if (webChannelBlocked) {
    try {
      await restDeleteDoc(path);
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
  try {
    await deleteDoc(doc(db, 'inquiries', id));
  } catch (error) {
    if (isOfflineNetworkError(error)) {
      webChannelBlocked = true;
      try {
        await restDeleteDoc(path);
        return;
      } catch (restErr) {
        handleFirestoreError(restErr, OperationType.DELETE, path);
      }
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Image Upload (Firebase Storage primary, server /api/upload fallback with Firebase ID Token) ---
export async function uploadImageAsset(file: File): Promise<string> {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('Please upload JPG, JPEG, PNG, or WEBP images only.');
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const uniqueName = `koby_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

  try {
    const storageRef = ref(storage, `portfolio-images/${uniqueName}`);
    await uploadBytes(storageRef, file, { contentType: file.type });
    return await getDownloadURL(storageRef);
  } catch (storageErr) {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) {
      throw new Error(
        storageErr instanceof Error ? storageErr.message : 'Please sign in as admin to upload images.'
      );
    }

    const base64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ image: base64, filename: file.name }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      return data.url;
    }
    throw new Error(
      data.error ||
        (storageErr instanceof Error ? storageErr.message : 'Image upload failed.')
    );
  }
}
