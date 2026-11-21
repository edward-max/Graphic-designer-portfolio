import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Plus,
  Trash2,
  Edit,
  Upload,
  CheckCircle2,
  LogOut,
  ArrowLeft,
  AlertCircle,
  Settings,
  Inbox,
  ImagePlus,
  MessageSquareQuote,
  FileEdit,
} from 'lucide-react';
import { Project, ProjectCategory, SiteSettings, ContactInquiry, TestimonialItem } from '../types';
import {
  uploadImageAsset,
  fetchInquiriesFromFirestore,
  deleteInquiryFromFirestore,
  ADMIN_EMAIL,
} from '../firebase';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  testimonials: TestimonialItem[];
  settings: SiteSettings;
  adminEmail: string | null;
  onAddProject: (projectData: Omit<Project, 'id' | 'created_at'>) => Promise<void>;
  onUpdateProject: (id: string, projectData: Omit<Project, 'id' | 'created_at'>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAddTestimonial: (data: Omit<TestimonialItem, 'id' | 'created_at'>) => Promise<void>;
  onUpdateTestimonial: (id: string, data: Omit<TestimonialItem, 'id' | 'created_at'>) => Promise<void>;
  onDeleteTestimonial: (id: string) => Promise<void>;
  onUpdateSettings: (newSettings: SiteSettings) => Promise<void>;
  isAdminLoggedIn: boolean;
  onGoogleSignIn: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  projects,
  testimonials,
  settings,
  adminEmail,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddTestimonial,
  onUpdateTestimonial,
  onDeleteTestimonial,
  onUpdateSettings,
  isAdminLoggedIn,
  onGoogleSignIn,
  onLogout,
}) => {
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'manage' | 'content' | 'testimonials' | 'settings' | 'inquiries'>('dashboard');

  // Form state for adding/editing projects
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Flyers');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [year, setYear] = useState('2026');
  const [client, setClient] = useState('');
  const [featured, setFeatured] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Testimonials form state
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testName, setTestName] = useState('');
  const [testCompany, setTestCompany] = useState('');
  const [testRole, setTestRole] = useState('');
  const [testText, setTestText] = useState('');
  const [testAvatar, setTestAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingTest, setSavingTest] = useState(false);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteTestTarget, setDeleteTestTarget] = useState<TestimonialItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  // Inquiries state
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    if (isOpen && isAdminLoggedIn && activeTab === 'inquiries') {
      fetchInquiriesFromFirestore()
        .then((data) => setInquiries(data))
        .catch(() => {});
    }
  }, [isOpen, isAdminLoggedIn, activeTab]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err: any) {
      setLoginError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const uploadSingleFile = async (file: File): Promise<string> => {
    return uploadImageAsset(file);
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');
    setUploading(true);
    try {
      const url = await uploadSingleFile(file);
      setImageUrl(url);
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setFormError('');
    setUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadSingleFile(file);
        urls.push(url);
      }
      setGalleryImages((prev) => [...prev, ...urls]);
    } catch (err: any) {
      setFormError(err.message || 'Gallery upload failed');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!imageUrl) {
      setFormError('Please upload a project cover image or provide an image URL.');
      return;
    }

    setSavingProject(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        description: description.trim(),
        image_url: imageUrl.trim(),
        gallery_images: galleryImages,
        year: year.trim() || '2026',
        client: client.trim(),
        featured,
        display_order: Number(displayOrder) || 1,
      };

      if (editingId) {
        await onUpdateProject(editingId, payload);
        setSuccessMessage('Project updated and live on your portfolio.');
      } else {
        await onAddProject(payload);
        setSuccessMessage('New project published to your portfolio.');
      }

      resetForm();
      setActiveTab('manage');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save project.');
    } finally {
      setSavingProject(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Flyers');
    setDescription('');
    setImageUrl('');
    setGalleryImages([]);
    setYear('2026');
    setClient('');
    setFeatured(true);
    setDisplayOrder(projects.length + 1);
    setFormError('');
  };

  const handleStartEdit = (proj: Project) => {
    setEditingId(proj.id);
    setTitle(proj.title);
    setCategory(proj.category);
    setDescription(proj.description);
    setImageUrl(proj.image_url);
    setGalleryImages(proj.gallery_images || []);
    setYear(proj.year);
    setClient(proj.client || '');
    setFeatured(proj.featured);
    setDisplayOrder(proj.display_order || 1);
    setFormError('');
    setActiveTab('add');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDeleteProject(deleteTarget.id);
      setDeleteTarget(null);
      setSuccessMessage('Project removed from portfolio.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete project.');
    } finally {
      setDeleting(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');
    setUploadingProfile(true);
    try {
      const url = await uploadSingleFile(file);
      setSettingsForm((prev) => ({ ...prev, profileImageUrl: url }));
    } catch (err: any) {
      setFormError(err.message || 'Profile picture upload failed');
    } finally {
      setUploadingProfile(false);
      e.target.value = '';
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSavingSettings(true);
    try {
      await onUpdateSettings(settingsForm);
      setSuccessMessage('Site content, tools & contact settings saved and live.');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    await deleteInquiryFromFirestore(id);
    setInquiries((prev) => prev.filter((i) => i.id !== id));
  };

  const resetTestimonialForm = () => {
    setEditingTestId(null);
    setTestName('');
    setTestCompany('');
    setTestRole('');
    setTestText('');
    setTestAvatar('');
    setFormError('');
  };

  const handleStartEditTestimonial = (item: TestimonialItem) => {
    setEditingTestId(item.id);
    setTestName(item.name);
    setTestCompany(item.company);
    setTestRole(item.role);
    setTestText(item.text);
    setTestAvatar(item.avatar || '');
    setFormError('');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');
    setUploadingAvatar(true);
    try {
      const url = await uploadSingleFile(file);
      setTestAvatar(url);
    } catch (err: any) {
      setFormError(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSubmitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSavingTest(true);
    try {
      const payload = {
        name: testName.trim(),
        company: testCompany.trim(),
        role: testRole.trim() || 'Client',
        text: testText.trim(),
        avatar: testAvatar.trim(),
      };
      if (editingTestId) {
        await onUpdateTestimonial(editingTestId, payload);
        setSuccessMessage('Testimonial updated on your portfolio.');
      } else {
        await onAddTestimonial(payload);
        setSuccessMessage('New client testimonial published.');
      }
      resetTestimonialForm();
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save testimonial.');
    } finally {
      setSavingTest(false);
    }
  };

  const confirmDeleteTestimonial = async () => {
    if (!deleteTestTarget) return;
    setDeleting(true);
    try {
      await onDeleteTestimonial(deleteTestTarget.id);
      setDeleteTestTarget(null);
      setSuccessMessage('Testimonial removed.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete testimonial.');
    } finally {
      setDeleting(false);
    }
  };

  const stats = {
    total: projects.length,
    flyers: projects.filter((p) => p.category === 'Flyers').length,
    branding: projects.filter((p) => p.category === 'Branding').length,
    social: projects.filter((p) => p.category === 'Social Media').length,
    other: projects.filter(
      (p) => p.category === 'Other' || p.category === 'Posters' || p.category === 'Print Design'
    ).length,
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950/96 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Koby Portfolio CMS Dashboard"
    >
      <div className="max-w-5xl w-full glass-panel rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-neutral-900/90 px-6 py-4 border-b border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk']">
                Koby Portfolio CMS
              </h2>
              <p className="text-xs text-neutral-400">
                {isAdminLoggedIn
                  ? `Signed in via Firebase (${adminEmail || ADMIN_EMAIL})`
                  : 'Sign in with Google to manage your Firebase portfolio'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer min-h-[40px]"
            aria-label="Back to Portfolio"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Site</span>
          </button>
        </div>

        {/* Auth Gate */}
        {!isAdminLoggedIn ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center max-w-md mx-auto my-auto text-center w-full">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-5">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white font-['Space_Grotesk'] mb-2">
              Admin Sign In
            </h3>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Sign in with your authorized Google account (
              <span className="text-violet-300">{ADMIN_EMAIL}</span>) to publish projects, edit page
              copy, and view client inquiries.
            </p>

            {loginError && (
              <div className="w-full mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loginLoading}
              className="w-full py-3.5 px-5 rounded-xl bg-white text-neutral-950 font-semibold text-sm hover:bg-neutral-200 disabled:opacity-60 transition-colors shadow-lg cursor-pointer min-h-[46px] flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{loginLoading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          </div>
        ) : (
          /* Authenticated CMS Workspace */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* CMS Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-neutral-950/70 border-b border-neutral-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-violet-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('add');
                  }}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'add'
                      ? 'bg-violet-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Edit Project' : 'Add Project'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manage')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer tabular-nums ${
                    activeTab === 'manage'
                      ? 'bg-violet-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Projects ({projects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'content'
                      ? 'bg-violet-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Page Content</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('testimonials')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer tabular-nums ${
                    activeTab === 'testimonials'
                      ? 'bg-violet-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <MessageSquareQuote className="w-3.5 h-3.5" />
                  <span>Testimonials ({testimonials.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-violet-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Stats &amp; Contact</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inquiries')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'inquiries'
                      ? 'bg-violet-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Inquiries</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {successMessage && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {formError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="flex flex-col gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-white font-['Space_Grotesk'] mb-1">
                      Portfolio Overview
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Live project counts across categories. Publishing a Flyer automatically adds it to the interactive Flyer Folder.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="glass-panel p-5 rounded-2xl">
                      <div className="text-3xl font-extrabold text-white font-['Space_Grotesk'] tabular-nums">
                        {stats.total}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">Total Projects</div>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl">
                      <div className="text-3xl font-extrabold text-violet-400 font-['Space_Grotesk'] tabular-nums">
                        {stats.flyers}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">Flyer Projects</div>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl">
                      <div className="text-3xl font-extrabold text-indigo-400 font-['Space_Grotesk'] tabular-nums">
                        {stats.branding}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">Branding</div>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl">
                      <div className="text-3xl font-extrabold text-emerald-400 font-['Space_Grotesk'] tabular-nums">
                        {stats.social}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">Social Media</div>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl">
                      <div className="text-3xl font-extrabold text-neutral-200 font-['Space_Grotesk'] tabular-nums">
                        {stats.other}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">Posters &amp; Print</div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white font-['Space_Grotesk'] mb-1">
                        Publish a new design
                      </h4>
                      <p className="text-xs text-neutral-300">
                        Upload JPG, PNG, or WEBP artwork directly from your computer or phone.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setActiveTab('add');
                      }}
                      className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold text-xs hover:bg-violet-500 flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Project</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ADD / EDIT PROJECT */}
              {activeTab === 'add' && (
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">
                      {editingId ? 'Edit Project' : 'Add New Project'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manage')}
                      className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to list
                    </button>
                  </div>

                  <form onSubmit={handleSubmitProject} className="flex flex-col gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                        Project Title
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Neon Void Festival Identity"
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                          Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-violet-500 text-sm"
                        >
                          <option value="Flyers">Flyers (Includes in Flyer Folder)</option>
                          <option value="Branding">Branding</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Posters">Posters</option>
                          <option value="Print Design">Print Design</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                          Year
                        </label>
                        <input
                          type="text"
                          required
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          placeholder="2026"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-violet-500 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                          Client Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={client}
                          onChange={(e) => setClient(e.target.value)}
                          placeholder="e.g. Pulse Live"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                          Featured Project
                        </label>
                        <select
                          value={featured ? 'yes' : 'no'}
                          onChange={(e) => setFeatured(e.target.value === 'yes')}
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-violet-500 text-sm"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                          Display Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={displayOrder}
                          onChange={(e) => setDisplayOrder(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-violet-500 text-sm tabular-nums"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                        Project Description
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the design concept, target audience, and creative execution..."
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 text-sm resize-none"
                      />
                    </div>

                    {/* Main Image Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                        Project Image Upload (JPG, JPEG, PNG, WEBP)
                      </label>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs cursor-pointer flex items-center gap-2 border border-neutral-700 min-h-[44px]">
                            <Upload className="w-4 h-4" />
                            <span>{uploading ? 'Uploading...' : 'Upload Image File'}</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                              onChange={handleMainImageUpload}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-neutral-400">or enter image URL</span>
                        </div>

                        <input
                          type="text"
                          required
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="/uploads/... or https://..."
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 text-sm"
                        />

                        {imageUrl && (
                          <div className="w-36 h-28 rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
                            <img
                              src={imageUrl}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Optional Gallery Images */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                        Optional Gallery Images
                      </label>
                      <label className="inline-flex px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-medium text-xs cursor-pointer items-center gap-2 border border-neutral-800 min-h-[40px]">
                        <ImagePlus className="w-4 h-4 text-violet-400" />
                        <span>{uploadingGallery ? 'Uploading Gallery...' : 'Add Gallery Images'}</span>
                        <input
                          type="file"
                          multiple
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          onChange={handleGalleryUpload}
                          className="hidden"
                        />
                      </label>

                      {galleryImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-3 mt-3">
                          {galleryImages.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group"
                            >
                              <img
                                src={img}
                                alt={`Gallery ${idx + 1}`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setGalleryImages((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/80 text-white hover:bg-red-600 cursor-pointer"
                                aria-label="Remove gallery image"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={savingProject || uploading || uploadingGallery}
                      className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors shadow-xl shadow-violet-600/25 cursor-pointer min-h-[44px]"
                    >
                      {savingProject
                        ? 'Saving...'
                        : editingId
                        ? 'Save Project Changes'
                        : 'Publish Project'}
                    </button>
                  </form>
                </div>
              )}

              {/* MANAGE PROJECTS */}
              {activeTab === 'manage' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">
                        Manage Portfolio Projects
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Edit details, replace imagery, reorder, or remove projects.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setActiveTab('add');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-xs hover:bg-violet-500 flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Project</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <img
                            src={proj.image_url}
                            alt={proj.title}
                            className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-neutral-900"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1 tabular-nums">
                              <span className="text-violet-400 font-semibold">{proj.category}</span>
                              <span aria-hidden="true">·</span>
                              <span>{proj.year}</span>
                              <span aria-hidden="true">·</span>
                              <span>Order #{proj.display_order}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white font-['Space_Grotesk'] truncate">
                              {proj.title}
                            </h4>
                            <p className="text-xs text-neutral-400 line-clamp-1">
                              {proj.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(proj)}
                            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                            title="Edit Project"
                            aria-label={`Edit ${proj.title}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(proj)}
                            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                            title="Delete Project"
                            aria-label={`Delete ${proj.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PAGE CONTENT EDITOR (HERO, ABOUT ME, TOOLS & SOFTWARE) */}
              {activeTab === 'content' && (
                <form onSubmit={handleSaveSettings} className="max-w-3xl mx-auto flex flex-col gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">
                      Edit Page Content &amp; Tools
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Customize your Hero headline, About Me bio, creative philosophy, and Tools &amp; Software stack.
                    </p>
                  </div>

                  {/* Hero Copy & Profile Picture */}
                  <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-violet-300 uppercase tracking-wider">
                      Hero Section &amp; Profile Picture
                    </h4>

                    <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-neutral-950 shrink-0">
                        <img
                          src={
                            settingsForm.profileImageUrl ||
                            '/src/assets/images/hero_editorial_showcase_1794870584088.jpg'
                          }
                          alt="Profile preview"
                          className="w-full h-full object-cover object-top"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 w-full flex flex-col gap-2.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <label className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs cursor-pointer inline-flex items-center gap-2 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {uploadingProfile ? 'Uploading Photo...' : 'Upload Profile Picture'}
                            </span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                              onChange={handleProfileImageUpload}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[11px] text-neutral-400">
                            JPG, PNG, or WEBP (displayed in Hero card)
                          </span>
                        </div>
                        <input
                          type="text"
                          value={settingsForm.profileImageUrl || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, profileImageUrl: e.target.value })
                          }
                          placeholder="/uploads/... or https://..."
                          className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Availability Indicator Text
                      </label>
                      <input
                        type="text"
                        value={settingsForm.heroAvailability}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, heroAvailability: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Main Headline (Start)
                        </label>
                        <input
                          type="text"
                          value={settingsForm.heroHeadline}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroHeadline: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Highlighted Headline Phrase
                        </label>
                        <input
                          type="text"
                          value={settingsForm.heroHeadlineAccent}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroHeadlineAccent: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Hero Supporting Text
                      </label>
                      <textarea
                        rows={3}
                        value={settingsForm.heroSubtext}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, heroSubtext: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Hero Visual Card Title
                        </label>
                        <input
                          type="text"
                          value={settingsForm.heroShowcaseTitle}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroShowcaseTitle: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Hero Visual Card Subtitle
                        </label>
                        <input
                          type="text"
                          value={settingsForm.heroShowcaseSubtitle}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroShowcaseSubtitle: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* About Me Copy */}
                  <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-violet-300 uppercase tracking-wider">
                      About Me Section Text
                    </h4>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Section Heading
                      </label>
                      <input
                        type="text"
                        value={settingsForm.aboutHeading}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, aboutHeading: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Section Subtitle / Intro
                      </label>
                      <textarea
                        rows={2}
                        value={settingsForm.aboutIntro}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, aboutIntro: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Bio Card Title
                      </label>
                      <input
                        type="text"
                        value={settingsForm.aboutBioTitle}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, aboutBioTitle: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        About Paragraph 1 (Introduction)
                      </label>
                      <textarea
                        rows={3}
                        value={settingsForm.aboutBioParagraph1}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, aboutBioParagraph1: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        About Paragraph 2 (Creative Philosophy)
                      </label>
                      <textarea
                        rows={3}
                        value={settingsForm.aboutBioParagraph2}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, aboutBioParagraph2: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="flex flex-col gap-2">
                        <label className="block text-xs font-semibold text-neutral-300">
                          Highlight 1 Title &amp; Text
                        </label>
                        <input
                          type="text"
                          value={settingsForm.aboutApproachTitle}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, aboutApproachTitle: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs font-semibold"
                        />
                        <input
                          type="text"
                          value={settingsForm.aboutApproachDesc}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, aboutApproachDesc: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="block text-xs font-semibold text-neutral-300">
                          Highlight 2 Title &amp; Text
                        </label>
                        <input
                          type="text"
                          value={settingsForm.aboutDeliveryTitle}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, aboutDeliveryTitle: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs font-semibold"
                        />
                        <input
                          type="text"
                          value={settingsForm.aboutDeliveryDesc}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, aboutDeliveryDesc: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tools & Software Stack */}
                  <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm font-bold text-violet-300 uppercase tracking-wider">
                        Tools &amp; Software
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          setSettingsForm({
                            ...settingsForm,
                            tools: [
                              ...(settingsForm.tools || []),
                              { name: 'New Tool', level: 'Advanced', category: 'Design Workflow' },
                            ],
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Tool</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {(settingsForm.tools || []).map((tool, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-neutral-900/70 p-3 rounded-xl border border-neutral-800"
                        >
                          <input
                            type="text"
                            placeholder="Tool Name"
                            value={tool.name}
                            onChange={(e) => {
                              const next = [...(settingsForm.tools || [])];
                              next[idx] = { ...next[idx], name: e.target.value };
                              setSettingsForm({ ...settingsForm, tools: next });
                            }}
                            className="sm:col-span-4 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs font-semibold"
                          />
                          <input
                            type="text"
                            placeholder="Category / Usage"
                            value={tool.category}
                            onChange={(e) => {
                              const next = [...(settingsForm.tools || [])];
                              next[idx] = { ...next[idx], category: e.target.value };
                              setSettingsForm({ ...settingsForm, tools: next });
                            }}
                            className="sm:col-span-5 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Level"
                            value={tool.level}
                            onChange={(e) => {
                              const next = [...(settingsForm.tools || [])];
                              next[idx] = { ...next[idx], level: e.target.value };
                              setSettingsForm({ ...settingsForm, tools: next });
                            }}
                            className="sm:col-span-2 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-violet-300 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = (settingsForm.tools || []).filter((_, i) => i !== idx);
                              setSettingsForm({ ...settingsForm, tools: next });
                            }}
                            aria-label="Remove tool"
                            className="sm:col-span-1 p-2 rounded-lg text-red-400 hover:bg-red-500/15 flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="py-3.5 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm cursor-pointer min-h-[44px]"
                  >
                    {savingSettings ? 'Saving Content...' : 'Save Page Content & Tools'}
                  </button>
                </form>
              )}

              {/* SITE STATS & CONTACT SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="max-w-2xl mx-auto flex flex-col gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">
                      Portfolio Statistics &amp; Contact Settings
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Update the numbers shown in your Hero/About sections and configure your WhatsApp &amp; social links.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-2">
                        Creative Projects
                      </label>
                      <input
                        type="text"
                        value={settingsForm.creativeProjects}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, creativeProjects: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-2">
                        Design Services
                      </label>
                      <input
                        type="text"
                        value={settingsForm.designServices}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, designServices: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-2">
                        Years Learning &amp; Creating
                      </label>
                      <input
                        type="text"
                        value={settingsForm.yearsExperience}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, yearsExperience: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-2">
                        Happy Clients
                      </label>
                      <input
                        type="text"
                        value={settingsForm.happyClients}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, happyClients: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-neutral-800">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-2">
                        WhatsApp Number (digits with country code)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.whatsappNumber}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={settingsForm.email}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, email: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-2">
                        Instagram URL
                      </label>
                      <input
                        type="url"
                        value={settingsForm.instagramUrl}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-2">
                        Facebook URL
                      </label>
                      <input
                        type="url"
                        value={settingsForm.facebookUrl || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })
                        }
                        placeholder="https://facebook.com/yourpage"
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-2">
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        value={settingsForm.linkedinUrl}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, linkedinUrl: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-2">
                        Behance URL
                      </label>
                      <input
                        type="url"
                        value={settingsForm.behanceUrl}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, behanceUrl: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="py-3.5 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm cursor-pointer min-h-[44px]"
                  >
                    {savingSettings ? 'Saving Settings...' : 'Save Statistics & Contact Info'}
                  </button>
                </form>
              )}

              {/* TESTIMONIALS MANAGEMENT */}
              {activeTab === 'testimonials' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                        {editingTestId ? 'Edit Testimonial' : 'Add Client Testimonial'}
                      </h3>
                      {editingTestId && (
                        <button
                          type="button"
                          onClick={resetTestimonialForm}
                          className="text-xs text-neutral-400 hover:text-white cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSubmitTestimonial} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Client Name
                        </label>
                        <input
                          type="text"
                          required
                          value={testName}
                          onChange={(e) => setTestName(e.target.value)}
                          placeholder="e.g. Marcus Vance"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                            Company / Business
                          </label>
                          <input
                            type="text"
                            required
                            value={testCompany}
                            onChange={(e) => setTestCompany(e.target.value)}
                            placeholder="e.g. Pulse Live Events"
                            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                            Role / Title
                          </label>
                          <input
                            type="text"
                            value={testRole}
                            onChange={(e) => setTestRole(e.target.value)}
                            placeholder="e.g. Creative Director"
                            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Testimonial Quote
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={testText}
                          onChange={(e) => setTestText(e.target.value)}
                          placeholder="What did the client say about working with Koby?"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Profile Image (Optional)
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs cursor-pointer flex items-center gap-2 border border-neutral-700">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                          </label>
                          {testAvatar && (
                            <div className="flex items-center gap-2">
                              <img
                                src={testAvatar}
                                alt="Client avatar"
                                className="w-9 h-9 rounded-full object-cover border border-white/10"
                              />
                              <button
                                type="button"
                                onClick={() => setTestAvatar('')}
                                className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={savingTest || uploadingAvatar}
                        className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold text-sm cursor-pointer min-h-[44px]"
                      >
                        {savingTest
                          ? 'Saving...'
                          : editingTestId
                          ? 'Save Testimonial Changes'
                          : 'Publish Testimonial'}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-7 flex flex-col gap-3">
                    <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] mb-1">
                      Published Testimonials ({testimonials.length})
                    </h3>
                    {testimonials.length === 0 ? (
                      <div className="glass-card p-8 rounded-2xl text-center text-xs text-neutral-400">
                        No testimonials added yet.
                      </div>
                    ) : (
                      testimonials.map((item) => (
                        <div
                          key={item.id}
                          className="glass-card p-4 rounded-2xl border border-white/10 flex items-start justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2.5 mb-1.5">
                              {item.avatar && (
                                <img
                                  src={item.avatar}
                                  alt={item.name}
                                  className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                                />
                              )}
                              <div>
                                <div className="text-sm font-bold text-white">{item.name}</div>
                                <div className="text-xs text-neutral-400">
                                  {item.role} · <span className="text-violet-400">{item.company}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                              “{item.text}”
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditTestimonial(item)}
                              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white cursor-pointer"
                              title="Edit Testimonial"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTestTarget(item)}
                              className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 cursor-pointer"
                              title="Delete Testimonial"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* INQUIRIES */}
              {activeTab === 'inquiries' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">
                      Client Inquiries
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Messages submitted through the portfolio contact form.
                    </p>
                  </div>

                  {inquiries.length === 0 ? (
                    <div className="py-12 text-center text-sm text-neutral-400 glass-card rounded-2xl">
                      No inquiries received yet.
                    </div>
                  ) : (
                    inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm font-bold text-white">
                            {inq.name}{' '}
                            <span className="text-xs font-normal text-violet-400">
                              ({inq.email})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteInquiry(inq.id)}
                            className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="text-xs text-neutral-400">
                          {inq.projectType} · {inq.budget} ·{' '}
                          {new Date(inq.created_at).toLocaleDateString()}
                        </div>
                        <p className="text-sm text-neutral-200 mt-1">{inq.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Dialog */}
        {(deleteTarget || deleteTestTarget) && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-sm w-full glass-panel p-6 rounded-2xl border border-white/15 shadow-2xl">
              <h4 className="text-lg font-bold text-white font-['Space_Grotesk'] mb-2">
                {deleteTarget ? 'Delete Project?' : 'Delete Testimonial?'}
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed mb-6">
                Are you sure you want to permanently remove{' '}
                <strong>
                  “{deleteTarget ? deleteTarget.title : deleteTestTarget?.name}”
                </strong>{' '}
                from your portfolio?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteTestTarget(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={deleteTarget ? confirmDelete : confirmDeleteTestimonial}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
