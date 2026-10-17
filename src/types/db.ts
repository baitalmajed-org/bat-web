export type Spec = { label: string; value: string };

export type SiteSettings = {
  id: number;
  company_name: string;
  tagline: string | null;
  logo_public_id: string | null;
  main_phone: string;
  whatsapp_number: string;
  secondary_phone: string | null;
  email: string;
  address_text: string | null;
  business_hours: string | null;
  google_maps_url: string | null;
  google_maps_embed_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  x_url: string | null;
  announcement_enabled: boolean;
  announcement_text: string | null;
  announcement_link_url: string | null;
  announcement_link_label: string | null;
  announcement_link_new_tab: boolean;
  seo_default_title: string | null;
  seo_default_description: string | null;
  footer_description: string | null;
  response_time_commitment: string | null;
};

export type HomepageItem = { title: string; text?: string };

export type HomepageSection = {
  id: string;
  key: "hero" | "featured_products" | "services" | "about" | "trust" | "contact_cta";
  eyebrow: string | null;
  heading: string | null;
  body: string | null;
  image_public_id: string | null;
  image_alt: string | null;
  primary_cta_label: string | null;
  primary_cta_href: string | null;
  secondary_cta_label: string | null;
  secondary_cta_href: string | null;
  items: HomepageItem[];
  is_visible: boolean;
  sort_order: number;
};

export type AboutContent = {
  overview: string;
  mission: string;
  vision: string;
  capabilities: string[];
  quality: string;
  industries: string[];
  strengths: string[];
  founded: string;
  team_size: string;
  certifications: string[];
};

export type PageRow = {
  slug: "about";
  title: string;
  meta_description: string | null;
  hero_image_public_id: string | null;
  content: AboutContent;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_public_id: string | null;
  image_alt: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ProductImage = {
  id: string;
  product_id: string;
  public_id: string;
  alt_text: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  specifications: Spec[];
  applications: string[];
  is_featured: boolean;
  is_published: boolean;
  is_sample: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  categories?: Pick<Category, "name" | "slug"> | null;
  product_images?: ProductImage[];
};

export type Service = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  icon: string | null;
  image_public_id: string | null;
  image_alt: string | null;
  specifications: Spec[];
  applications: string[];
  show_on_home: boolean;
  is_published: boolean;
  is_sample: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
};

export type InquiryStatus = "new" | "in_progress" | "replied" | "closed";
export type InquiryType = "product" | "service" | "custom_fabrication" | "general";
export type EmailStatus = "pending" | "sent" | "failed" | "skipped";

export type Inquiry = {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name: string | null;
  inquiry_type: InquiryType;
  product_id: string | null;
  service_id: string | null;
  related_label: string | null;
  subject: string;
  message: string;
  status: InquiryStatus;
  follow_up_at: string | null;
  admin_email_status: EmailStatus;
  customer_email_status: EmailStatus;
  admin_email_error: string | null;
  customer_email_error: string | null;
  email_attempts: number;
  last_email_attempt_at: string | null;
  created_at: string;
};

export type InquiryNote = {
  id: string;
  inquiry_id: string;
  note: string;
  created_at: string;
};

export type MediaAsset = {
  id: string;
  public_id: string;
  secure_url: string;
  alt_text: string | null;
  purpose: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  cleanup_status: "active" | "pending_delete" | "deleted" | "delete_failed";
  cleanup_error: string | null;
  created_at: string;
};
