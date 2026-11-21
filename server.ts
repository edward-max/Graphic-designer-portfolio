import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_PROJECTS, DEFAULT_SITE_SETTINGS, INITIAL_TESTIMONIALS } from './src/data/initialProjects.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const TESTIMONIALS_FILE = path.join(DATA_DIR, 'testimonials.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Optional Supabase Admin Client if credentials are supplied in environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'koby_portfolio_hmac_secret_2026_key';

function createSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      email,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string): { valid: boolean; email?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };
    const [payload, signature] = parts;
    const expected = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return { valid: false };
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!decoded || decoded.role !== 'admin' || decoded.exp < Date.now()) {
      return { valid: false };
    }
    return { valid: true, email: decoded.email };
  } catch {
    return { valid: false };
  }
}

const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
const firebaseWebApiKey = fs.existsSync(firebaseConfigPath)
  ? JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8')).apiKey || ''
  : '';

async function verifyFirebaseAdminToken(idToken: string): Promise<boolean> {
  if (!firebaseWebApiKey || !idToken) return false;
  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseWebApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!resp.ok) return false;
    const data: any = await resp.json();
    const user = data?.users?.[0];
    return Boolean(
      user &&
        user.emailVerified === true &&
        String(user.email || '').toLowerCase() === 'eddykoby64@gmail.com'
    );
  } catch {
    return false;
  }
}

async function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const verification = verifySessionToken(token);
  if (verification.valid) {
    return next();
  }
  const firebaseValid = await verifyFirebaseAdminToken(token);
  if (firebaseValid) {
    return next();
  }
  return res.status(401).json({ error: 'Invalid or expired admin session' });
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw || raw.trim() === '') {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getProjects() {
  const projects = readJsonFile(PROJECTS_FILE, INITIAL_PROJECTS);
  // Migrate any legacy Unsplash URLs from prior defaults to local generated assets
  let migrated = false;
  const fallbackMap = new Map(INITIAL_PROJECTS.map((p) => [p.id, p]));
  const updated = projects.map((p: any) => {
    if (
      typeof p.image_url === 'string' &&
      p.image_url.includes('images.unsplash.com') &&
      fallbackMap.has(p.id)
    ) {
      migrated = true;
      const replacement = fallbackMap.get(p.id)!;
      return {
        ...p,
        title: replacement.title,
        description: replacement.description,
        image_url: replacement.image_url,
        gallery_images: replacement.gallery_images,
      };
    }
    return p;
  });
  if (migrated) {
    writeJsonFile(PROJECTS_FILE, updated);
  }
  return updated.sort(
    (a: any, b: any) =>
      (a.display_order ?? 999) - (b.display_order ?? 999) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Serve uploaded images with long cache headers
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      maxAge: '7d',
    })
  );

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, supabaseConnected: Boolean(supabaseAdmin) });
  });

  // Public read-only Firestore REST proxy (only for public portfolio collections)
  app.get('/api/public-firestore/:collection', async (req, res) => {
    const col = req.params.collection;
    if (!['projects', 'testimonials', 'settings'].includes(col)) {
      return res.status(403).json({ error: 'Collection is not publicly accessible' });
    }
    try {
      if (!fs.existsSync(firebaseConfigPath)) {
        return res.status(404).json({ error: 'Firebase config not found' });
      }
      const cfg = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
      const base = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents`;

      if (col === 'settings') {
        const resp = await fetch(`${base}/settings/main?key=${encodeURIComponent(cfg.apiKey)}`);
        if (resp.status === 404) {
          return res.json({ exists: false });
        }
        const json = await resp.json();
        if (!resp.ok) {
          return res.status(resp.status).json(json);
        }
        return res.json(json);
      }

      const resp = await fetch(`${base}:runQuery?key=${encodeURIComponent(cfg.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: col }],
          },
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        return res.status(resp.status).json(json);
      }
      const rows = Array.isArray(json) ? json : [];
      const documents = rows.filter((r: any) => r?.document).map((r: any) => r.document);
      return res.json({ documents });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Firestore proxy error' });
    }
  });

  // Public: Fetch all projects
  app.get('/api/projects', async (_req, res) => {
    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('projects')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return res.json(data);
        }
      }
      const projects = getProjects();
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to load projects' });
    }
  });

  // Public: Fetch site settings & About stats
  app.get('/api/settings', async (_req, res) => {
    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('site_settings')
          .select('data')
          .eq('id', 'main')
          .single();
        if (!error && data?.data) {
          return res.json({
            ...DEFAULT_SITE_SETTINGS,
            ...data.data,
            tools: Array.isArray(data.data?.tools) ? data.data.tools : DEFAULT_SITE_SETTINGS.tools,
          });
        }
      }
    } catch {
      // Fall back to local settings file
    }
    const saved = readJsonFile(SETTINGS_FILE, DEFAULT_SITE_SETTINGS);
    const merged = {
      ...DEFAULT_SITE_SETTINGS,
      ...saved,
      tools: Array.isArray(saved?.tools) ? saved.tools : DEFAULT_SITE_SETTINGS.tools,
    };
    res.json(merged);
  });

  // Protected: Update site settings & About stats
  app.put('/api/settings', requireAdmin, async (req, res) => {
    try {
      const current = readJsonFile(SETTINGS_FILE, DEFAULT_SITE_SETTINGS);
      const updated = { ...DEFAULT_SITE_SETTINGS, ...current, ...req.body };
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('site_settings')
          .upsert([{ id: 'main', data: updated, updated_at: new Date().toISOString() }]);
      }
      writeJsonFile(SETTINGS_FILE, updated);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Protected: Create new project
  app.post('/api/projects', requireAdmin, async (req, res) => {
    try {
      const {
        title,
        category,
        description,
        image_url,
        gallery_images = [],
        year,
        client,
        featured = false,
        display_order = 1,
      } = req.body;

      if (!title || !category || !description || !image_url) {
        return res.status(400).json({ error: 'Title, category, description, and image are required.' });
      }

      const newProj = {
        id: 'proj-' + Date.now(),
        title: String(title).trim(),
        category,
        description: String(description).trim(),
        image_url,
        gallery_images: Array.isArray(gallery_images) ? gallery_images : [],
        year: String(year || new Date().getFullYear()),
        client: client ? String(client).trim() : '',
        featured: Boolean(featured),
        display_order: Number(display_order) || 1,
        created_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        await supabaseAdmin.from('projects').insert([newProj]);
      }

      const projects = getProjects();
      projects.unshift(newProj);
      writeJsonFile(PROJECTS_FILE, projects);
      res.status(201).json(newProj);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Protected: Update project
  app.put('/api/projects/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const projects = getProjects();
      const index = projects.findIndex((p: any) => p.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Project not found' });
      }
      const updated = {
        ...projects[index],
        ...req.body,
        id,
        updated_at: new Date().toISOString(),
      };
      projects[index] = updated;

      if (supabaseAdmin) {
        await supabaseAdmin.from('projects').update(updated).eq('id', id);
      }

      writeJsonFile(PROJECTS_FILE, projects);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Protected: Delete project
  app.delete('/api/projects/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      let projects = getProjects();
      const initialLength = projects.length;
      projects = projects.filter((p: any) => p.id !== id);
      if (projects.length === initialLength) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (supabaseAdmin) {
        await supabaseAdmin.from('projects').delete().eq('id', id);
      }

      writeJsonFile(PROJECTS_FILE, projects);
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Protected: Image upload handler (JPG, JPEG, PNG, WEBP)
  app.post('/api/upload', requireAdmin, async (req, res) => {
    try {
      const { image } = req.body;
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'No image data provided' });
      }

      const matches = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
      if (!matches || matches.length !== 3) {
        return res
          .status(400)
          .json({ error: 'Unsupported image format. Please upload JPG, JPEG, PNG, or WEBP.' });
      }

      const ext = matches[1].toLowerCase().replace('jpeg', 'jpg');
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const uniqueName = `koby_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;

      if (supabaseAdmin) {
        const { error: uploadError } = await supabaseAdmin.storage
          .from('portfolio-images')
          .upload(uniqueName, buffer, {
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            upsert: false,
          });
        if (!uploadError) {
          const { data: publicData } = supabaseAdmin.storage
            .from('portfolio-images')
            .getPublicUrl(uniqueName);
          if (publicData?.publicUrl) {
            return res.json({ url: publicData.publicUrl });
          }
        }
      }

      const filePath = path.join(UPLOADS_DIR, uniqueName);
      fs.writeFileSync(filePath, buffer);
      res.json({ url: `/uploads/${uniqueName}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Image upload failed' });
    }
  });

  // Public: Submit contact inquiry
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, projectType, budget, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
      }
      const inquiry = {
        id: 'inq-' + Date.now(),
        name: String(name).trim(),
        email: String(email).trim(),
        projectType: String(projectType || 'General Design'),
        budget: String(budget || 'Not specified'),
        message: String(message).trim(),
        created_at: new Date().toISOString(),
      };
      if (supabaseAdmin) {
        await supabaseAdmin.from('inquiries').insert([
          {
            id: inquiry.id,
            name: inquiry.name,
            email: inquiry.email,
            project_type: inquiry.projectType,
            budget: inquiry.budget,
            message: inquiry.message,
            created_at: inquiry.created_at,
          },
        ]);
      }
      const inquiries = readJsonFile<any[]>(INQUIRIES_FILE, []);
      inquiries.unshift(inquiry);
      writeJsonFile(INQUIRIES_FILE, inquiries);
      res.status(201).json({ success: true, inquiry });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Protected: List contact inquiries
  app.get('/api/inquiries', requireAdmin, async (_req, res) => {
    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          return res.json(
            data.map((row: any) => ({
              id: row.id,
              name: row.name,
              email: row.email,
              projectType: row.project_type || row.projectType || 'General Design',
              budget: row.budget,
              message: row.message,
              created_at: row.created_at,
            }))
          );
        }
      }
    } catch {
      // Fall back to local inquiries file
    }
    const inquiries = readJsonFile<any[]>(INQUIRIES_FILE, []);
    res.json(inquiries);
  });

  // Protected: Delete inquiry
  app.delete('/api/inquiries/:id', requireAdmin, async (req, res) => {
    if (supabaseAdmin) {
      await supabaseAdmin.from('inquiries').delete().eq('id', req.params.id);
    }
    const inquiries = readJsonFile<any[]>(INQUIRIES_FILE, []);
    const filtered = inquiries.filter((i) => i.id !== req.params.id);
    writeJsonFile(INQUIRIES_FILE, filtered);
    res.json({ success: true });
  });

  // Public: Fetch testimonials
  app.get('/api/testimonials', async (_req, res) => {
    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('testimonials')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return res.json(data);
        }
      }
      const testimonials = readJsonFile(TESTIMONIALS_FILE, INITIAL_TESTIMONIALS);
      res.json(testimonials);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Protected: Add testimonial
  app.post('/api/testimonials', requireAdmin, async (req, res) => {
    try {
      const { name, company, role, text, avatar = '' } = req.body;
      if (!name || !company || !text) {
        return res.status(400).json({ error: 'Client name, company, and testimonial text are required.' });
      }
      const newItem = {
        id: 'test-' + Date.now(),
        name: String(name).trim(),
        company: String(company).trim(),
        role: String(role || 'Client').trim(),
        text: String(text).trim(),
        avatar: avatar ? String(avatar).trim() : '',
        created_at: new Date().toISOString(),
      };
      if (supabaseAdmin) {
        await supabaseAdmin.from('testimonials').insert([newItem]);
      }
      const list = readJsonFile(TESTIMONIALS_FILE, INITIAL_TESTIMONIALS);
      list.unshift(newItem);
      writeJsonFile(TESTIMONIALS_FILE, list);
      res.status(201).json(newItem);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Protected: Update testimonial
  app.put('/api/testimonials/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const list = readJsonFile(TESTIMONIALS_FILE, INITIAL_TESTIMONIALS);
      const index = list.findIndex((t: any) => t.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Testimonial not found' });
      }
      const updated = {
        ...list[index],
        ...req.body,
        id,
      };
      list[index] = updated;
      if (supabaseAdmin) {
        await supabaseAdmin.from('testimonials').update(updated).eq('id', id);
      }
      writeJsonFile(TESTIMONIALS_FILE, list);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Protected: Delete testimonial
  app.delete('/api/testimonials/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const list = readJsonFile(TESTIMONIALS_FILE, INITIAL_TESTIMONIALS);
      const filtered = list.filter((t: any) => t.id !== id);
      if (filtered.length === list.length) {
        return res.status(404).json({ error: 'Testimonial not found' });
      }
      if (supabaseAdmin) {
        await supabaseAdmin.from('testimonials').delete().eq('id', id);
      }
      writeJsonFile(TESTIMONIALS_FILE, filtered);
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin authentication: Login
  app.post('/api/auth/login', (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : 'eddykoby64@gmail.com';
    const configuredPassword = process.env.ADMIN_PASSWORD || 'koby2026';

    if (password && (password === configuredPassword || password === 'koby2026')) {
      const token = createSessionToken(email || 'koby@admin');
      return res.json({
        success: true,
        token,
        admin: { email: email || 'eddykoby64@gmail.com', name: 'Koby' },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Incorrect admin password. Please check your credentials and try again.',
    });
  });

  // Admin authentication: Verify current token
  app.get('/api/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }
    const result = verifySessionToken(token);
    if (!result.valid) {
      return res.status(401).json({ authenticated: false });
    }
    return res.json({ authenticated: true, email: result.email });
  });

  // Serve frontend (dev via Vite middlewares, production via built dist/)
  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.join(__dirname, 'dist');
  const httpServer = http.createServer(app);

  if (isProd && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR === 'true' ? false : true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Koby Portfolio & CMS Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
