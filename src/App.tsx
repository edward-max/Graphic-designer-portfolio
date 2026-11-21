import React, { useState, useEffect, useCallback } from 'react';
import { MotionConfig } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Services } from './components/Services';
import { FlyerFolder } from './components/FlyerFolder';
import { FlyerGalleryModal } from './components/FlyerGalleryModal';
import { PortfolioSection } from './components/PortfolioSection';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { ProcessSection } from './components/ProcessSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ContactSection } from './components/ContactSection';
import { WhatsAppButton } from './components/WhatsAppButton';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';
import { CustomCursor } from './components/CustomCursor';
import { Project, ProjectCategory, SiteSettings, TestimonialItem } from './types';
import { INITIAL_PROJECTS, DEFAULT_SITE_SETTINGS, INITIAL_TESTIMONIALS } from './data/initialProjects';
import {
  subscribeToAuth,
  signInAdminWithGoogle,
  signOutAdmin,
  seedInitialDataIfEmpty,
  fetchProjectsFromFirestore,
  fetchTestimonialsFromFirestore,
  fetchSettingsFromFirestore,
  createProjectInFirestore,
  updateProjectInFirestore,
  deleteProjectInFirestore,
  createTestimonialInFirestore,
  updateTestimonialInFirestore,
  deleteTestimonialFromFirestore,
  saveSettingsToFirestore,
} from './firebase';

export default function App() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(INITIAL_TESTIMONIALS);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | 'All'>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [flyerGalleryOpen, setFlyerGalleryOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(
    () => window.location.pathname === '/admin'
  );
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const openAdmin = useCallback(() => {
    setAdminModalOpen(true);
    if (window.location.pathname !== '/admin') {
      window.history.pushState({ admin: true }, '', '/admin');
    }
  }, []);

  const closeAdmin = useCallback(() => {
    setAdminModalOpen(false);
    if (window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setAdminModalOpen(window.location.pathname === '/admin');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const loadPortfolioData = useCallback(async () => {
    try {
      const [projList, settingsData, testList] = await Promise.all([
        fetchProjectsFromFirestore(),
        fetchSettingsFromFirestore(),
        fetchTestimonialsFromFirestore(),
      ]);
      setProjects(projList);
      setSettings(settingsData);
      setTestimonials(testList);
    } catch (err) {
      console.error('Error loading portfolio data from Firestore:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial Firestore data and subscribe to Firebase Auth state
  useEffect(() => {
    loadPortfolioData();

    const unsubscribe = subscribeToAuth(async (user, isAdmin) => {
      setIsAdminLoggedIn(isAdmin);
      setAdminEmail(user?.email || null);
      if (isAdmin) {
        try {
          await seedInitialDataIfEmpty();
          await loadPortfolioData();
        } catch (err) {
          console.error('Failed to sync initial Firestore data:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [loadPortfolioData]);

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'created_at'>) => {
    const created = await createProjectInFirestore(projectData);
    setProjects((prev) =>
      [created, ...prev].sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
    );
  };

  const handleUpdateProject = async (
    id: string,
    projectData: Omit<Project, 'id' | 'created_at'>
  ) => {
    const updated = await updateProjectInFirestore(id, projectData);
    setProjects((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, ...updated } : p))
        .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
    );
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProjectInFirestore(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateSettings = async (newSettings: SiteSettings) => {
    const saved = await saveSettingsToFirestore(newSettings);
    setSettings(saved);
  };

  const handleAddTestimonial = async (data: Omit<TestimonialItem, 'id' | 'created_at'>) => {
    const created = await createTestimonialInFirestore(data);
    setTestimonials((prev) => [created, ...prev]);
  };

  const handleUpdateTestimonial = async (
    id: string,
    data: Omit<TestimonialItem, 'id' | 'created_at'>
  ) => {
    const updated = await updateTestimonialInFirestore(id, data);
    setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };

  const handleDeleteTestimonial = async (id: string) => {
    await deleteTestimonialFromFirestore(id);
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
  };

  const handleGoogleSignIn = async () => {
    await signInAdminWithGoogle();
  };

  const handleLogout = async () => {
    await signOutAdmin();
  };

  const flyerProjects = projects.filter((p) => p.category === 'Flyers');

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 font-['Plus_Jakarta_Sans'] selection:bg-violet-500 selection:text-white">
        <CustomCursor />

        <Navbar />

        <main id="main-content">
          <Hero settings={settings} />
          <About settings={settings} />
          <Services onSelectCategory={setActiveCategory} />
          <FlyerFolder
            flyerProjects={flyerProjects}
            onOpenGallery={() => setFlyerGalleryOpen(true)}
          />
          <PortfolioSection
            projects={projects}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onSelectProject={(proj) => setSelectedProject(proj)}
            loading={loading}
          />
          <ProcessSection />
          <TestimonialsSection testimonials={testimonials} />
          <ContactSection settings={settings} />
        </main>

        <Footer onOpenAdmin={openAdmin} isAdminLoggedIn={isAdminLoggedIn} />

        <WhatsAppButton phoneNumber={settings.whatsappNumber} />

        <FlyerGalleryModal
          isOpen={flyerGalleryOpen}
          onClose={() => setFlyerGalleryOpen(false)}
          flyerProjects={flyerProjects}
        />

        <ProjectDetailModal
          project={selectedProject}
          allProjects={projects}
          onSelectProject={(proj) => setSelectedProject(proj)}
          onClose={() => setSelectedProject(null)}
        />

        <AdminModal
          isOpen={adminModalOpen}
          onClose={closeAdmin}
          projects={projects}
          testimonials={testimonials}
          settings={settings}
          adminEmail={adminEmail}
          onAddProject={handleAddProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onAddTestimonial={handleAddTestimonial}
          onUpdateTestimonial={handleUpdateTestimonial}
          onDeleteTestimonial={handleDeleteTestimonial}
          onUpdateSettings={handleUpdateSettings}
          isAdminLoggedIn={isAdminLoggedIn}
          onGoogleSignIn={handleGoogleSignIn}
          onLogout={handleLogout}
        />
      </div>
    </MotionConfig>
  );
}
