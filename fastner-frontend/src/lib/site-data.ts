import {
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  MessagesSquare,
  PackageSearch,
  Warehouse,
  Truck,
  ThumbsUp,
  Handshake,
  ShieldCheck,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

export const SITE = {
  name: "IBC",
  fullName: "IBC Fasteners",
  tagline: "Fastening Solutions, Delivered",
  phone: "+91 98765 43210",
  phoneHref: "tel:+919876543210",
  email: "sales@ibcfasteners.com",
  emailHref: "mailto:sales@ibcfasteners.com",
  address: "India",
};

/** Rotating promo messages shown in the top announcement bar. */
export const ANNOUNCEMENTS = [
  "Free shipping on orders above ₹999 — across India",
  "Trusted brands in stock — TVS, fischer, HILTI & more",
  "Bulk & OEM enquiries welcome — request a custom quote",
  "Genuine-quality fasteners · Fastening solutions, delivered",
];

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/#categories" },
  { label: "Industries", href: "/#industries" },
  { label: "About", href: "/about-us" },
  { label: "Contact", href: "/#contact" },
];

/** Category names for the footer's "Products" quick links. The homepage
 *  category section is admin-managed (see `Categories.tsx`). */
export type Category = { name: string };

export const CATEGORIES: Category[] = [
  { name: "Nuts" },
  { name: "Washers" },
  { name: "Eye Bolt" },
  { name: "Grub Screws" },
  { name: "Brass Inserts" },
  { name: "Spacers" },
  { name: "Circlips" },
  { name: "Rivets" },
];

// Industries shown on the homepage are admin-managed (see `Industries.tsx` +
// `usePublicIndustries`). No static list is kept here.

export type Partner = {
  name: string;
  /** Logo in /public/assets/Partners. */
  image: string;
};

/** Brands we stock / are authorised to supply — shown in the scrolling strip. */
export const PARTNERS: Partner[] = [
  { name: "TVS", image: "/assets/Partners/tvs.png" },
  { name: "fischer", image: "/assets/Partners/fischer.png" },
  { name: "RAAJ", image: "/assets/Partners/raaj.png" },
  { name: "HILTI", image: "/assets/Partners/hilti.png" },
];

export const STATS = [
  { value: "Bulk", label: "Orders & OEM supply" },
  { value: "Retail", label: "Counter & trade supply" },
  { value: "Fast", label: "Nationwide shipping" },
  { value: "Genuine", label: "Quality fasteners" },
];

/** Selling points listed in the dark About section. */
export const ABOUT_POINTS = [
  "Bulk & OEM orders, made easy",
  "Fast, reliable nationwide dispatch",
  "Genuine, grade-marked fasteners",
  "A team that actually knows fasteners",
];

export type ContactItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
};

/** Contact methods shown in the Contact section info panel. */
export const CONTACT_ITEMS: ContactItem[] = [
  { icon: Phone, label: "Call us", value: SITE.phone, href: SITE.phoneHref },
  { icon: Mail, label: "Email us", value: SITE.email, href: SITE.emailHref },
  { icon: MapPin, label: "Visit us", value: SITE.address, href: undefined },
];

export type ProcessStep = { icon: LucideIcon; title: string; body: string };

/** The six steps shown in the "Our Process" timeline. */
export const PROCESS_STEPS: ProcessStep[] = [
  {
    icon: MessagesSquare,
    title: "Consultancy",
    body: "Our team of experts will work with you to understand your specific needs and requirements for fasteners. We will help you identify the right products that will meet your needs and ensure the best fit for your project.",
  },
  {
    icon: PackageSearch,
    title: "Procuring",
    body: "We take quality seriously and supply all of our products to meet the highest standards. If we don't have the product readily available, we will source it from trusted suppliers around the globe who adhere to the same quality norms as we do.",
  },
  {
    icon: Warehouse,
    title: "Warehousing",
    body: "Our organized and secure warehouse ensures that our products are stored in optimal conditions, ready for fast and efficient delivery to our customers.",
  },
  {
    icon: Truck,
    title: "Supply",
    body: "We understand that timely delivery is critical to your project's success, which is why we pack and ship all products according to your specific requirements. Our logistics team works tirelessly to ensure that your order is delivered on time and in perfect condition.",
  },
  {
    icon: ThumbsUp,
    title: "Feedback",
    body: "We value our customers and their feedback. We welcome any feedback, whether positive or negative, and use it to continuously improve our processes and service.",
  },
  {
    icon: Handshake,
    title: "Relationship & Trust",
    body: "Our commitment to building long-term relationships with our customers is the cornerstone of our business. We believe that trust and reliability are key to any successful business partnership and we strive to improve our processes to ensure your satisfaction every step of the way.",
  },
];

export type AuthHighlight = { Icon: LucideIcon; label: string };

/** Trust points shown on the auth screens' brand panel. */
export const AUTH_HIGHLIGHTS: AuthHighlight[] = [
  { Icon: ShieldCheck, label: "Genuine-quality fasteners" },
  { Icon: BadgeCheck, label: "Trusted brands in stock" },
  { Icon: Truck, label: "Fast nationwide shipping" },
];

type HeroCta = { label: string; href: string; Icon: LucideIcon; className: string };
/** Optional centered text overlaid in a slide's empty space (e.g. the fastener-ring banner). */
type HeroCaption = { heading: string; sub?: string };
export type HeroSlide = {
  src: string;
  alt: string;
  bg: string;
  cta: HeroCta;
  caption?: HeroCaption;
};

/** Banners shown in the full-bleed hero carousel. Each is exported at 2047x921 (~20:9). */
export const HERO_SLIDES: HeroSlide[] = [
  {
    src: "/assets/banners/slide-fasteners-2047x921.png",
    alt: "A full range of quality fasteners — screws, bolts, nuts, washers and wall plugs",
    bg: "#e9eef1",
    // Empty center of the fastener ring → headline sits in the open space.
    caption: {
      heading: "Every Fastener You Need",
      sub: "Screws, bolts, nuts, washers & wall plugs — quality you can build on.",
    },
    // Silver/teal frame → translucent teal ties into the wall-plug accents.
    cta: {
      label: "Buy Now",
      href: "#categories",
      Icon: ShoppingCart,
      className: "bg-accent-600/55 ring-white/40 hover:bg-accent-600/75",
    },
  },
  {
    src: "/assets/banners/fastener-no-bars-2047x921.png",
    alt: "Fastener assorted packs — high-quality fasteners in assorted packs for every need",
    bg: "#ffffff",
    // White banner → translucent brand orange pops.
    cta: {
      label: "Buy Now",
      href: "#categories",
      Icon: ShoppingCart,
      className: "bg-brand-500/75 ring-white/40 hover:bg-brand-500/90",
    },
  },
  {
    src: "/assets/banners/bulk-order-fit-2047x921.png",
    alt: "Bulk order also available — ideal for businesses, manufacturers and resellers",
    bg: "#121212",
    // Dark banner → translucent white glass.
    cta: {
      label: "Buy Now",
      href: "#categories",
      Icon: ShoppingCart,
      className: "bg-white/20 ring-white/50 hover:bg-white/35",
    },
  },
  {
    src: "/assets/banners/slide-support-2047x921.png",
    alt: "IBC multi-lingual customer support — we speak your language",
    bg: "#ffffff",
    // Contact poster → "Contact Us"; dark glass reads well over the light/orange art.
    cta: {
      label: "Contact Us",
      href: "#contact",
      Icon: Phone,
      className: "bg-ink-950/45 ring-white/25 hover:bg-ink-950/65",
    },
  },
];
