export type ProjectCategory =
  | 'Flyers'
  | 'Branding'
  | 'Social Media'
  | 'Posters'
  | 'Print Design'
  | 'Other';

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  image_url: string;
  gallery_images?: string[];
  year: string;
  client?: string;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

export interface ToolItem {
  name: string;
  level: string;
  category: string;
}

export interface SiteSettings {
  creativeProjects: string;
  designServices: string;
  yearsExperience: string;
  happyClients: string;
  whatsappNumber: string;
  email: string;
  instagramUrl: string;
  linkedinUrl: string;
  behanceUrl: string;
  facebookUrl: string;
  profileImageUrl: string;
  heroAvailability: string;
  heroHeadline: string;
  heroHeadlineAccent: string;
  heroSubtext: string;
  heroShowcaseTitle: string;
  heroShowcaseSubtitle: string;
  aboutHeading: string;
  aboutIntro: string;
  aboutBioTitle: string;
  aboutBioParagraph1: string;
  aboutBioParagraph2: string;
  aboutApproachTitle: string;
  aboutApproachDesc: string;
  aboutDeliveryTitle: string;
  aboutDeliveryDesc: string;
  tools: ToolItem[];
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
  created_at: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  company: string;
  role: string;
  text: string;
  avatar?: string;
  created_at?: string;
}
