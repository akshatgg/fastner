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
  Factory,
  Hammer,
  Ruler,
  type LucideIcon,
} from "lucide-react";

export const SITE = {
  name: "IBC",
  fullName: "IBC Fasteners",
  tagline: "Fastening Solutions, Delivered",
  phone: "+91 98765 43210",
  phoneHref: "tel:+919876543210",
  email: "sales@indbolt.com",
  emailHref: "mailto:sales@indbolt.com",
  // Short label (Contact section) + full postal address (footer).
  address: "Bengaluru — Bommasandra",
  addressFull: "#108, 3rd Cross, Vidhyanagar, Bommasandra, Bengaluru - 560099",
  // Opens the storefront address in Google Maps.
  addressHref:
    "https://www.google.com/maps/search/?api=1&query=%23108,+3rd+Cross,+Vidhyanagar,+Bommasandra,+Bengaluru+-+560099",
};

/**
 * The two approved brand logo files, served straight from `public/`. These are
 * the only logo assets in use — `dark` for light backgrounds, `light` for dark
 * ones. The filenames contain spaces, so anything doing a raw `fetch` of these
 * (rather than passing them to `next/image`) must `encodeURI` the path first.
 */
export const LOGOS = {
  dark: "/IBC logo black without bg.png",
  light: "/IBC logo white without bg.png",
  /** Intrinsic pixel size of both files, for `next/image` width/height. */
  width: 429,
  height: 130,
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/#categories" },
  { label: "Industries", href: "/#industries" },
  { label: "About", href: "/about-us" },
  { label: "Contact", href: "/#contact" },
];

/** Intro blurb shown under the logo in the footer. */
export const FOOTER_BLURB =
  "Our one-stop-shop for all your fastening needs. Browse our wide range of products and services and experience exceptional quality and customer service.";

/** Footer "Help & Information" column. Delivery/Returns point at support until
 *  they get dedicated pages. */
export const HELP_LINKS = [
  { label: "Order Tracker", href: "/orders" },
  { label: "Delivery", href: "/support" },
  { label: "Returns", href: "/support" },
  { label: "About Us", href: "/about-us" },
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
  { name: "APL", image: "/assets/Partners/apl.png" },
];

export const STATS = [
  { value: "Bulk", label: "Orders & OEM supply" },
  { value: "Retail", label: "Counter & trade supply" },
  { value: "Fast", label: "Nationwide shipping" },
  { value: "Genuine", label: "Quality fasteners" },
];

/** The two catalog ranges shown on the homepage "Our Range" section. Each card
 *  links to its dedicated storefront page (`/industrial-supply`, `/diy-home`),
 *  which lists the categories tagged with that range. `range` matches the
 *  backend `Category.range` value. */
export type RangeCard = {
  icon: LucideIcon;
  eyebrow: string;
  /** Display title split across the two lines the homepage panel sets it on. */
  titleLines: [string, string];
  title: string;
  subtitle: string;
  /** Full-bleed photo behind the homepage panel. */
  image: string;
  cta: string;
  href: string;
  range: "industrial" | "diy";
};

export const RANGE_CARDS: RangeCard[] = [
  {
    icon: Factory,
    eyebrow: "For business",
    // Rendered as two display lines on the homepage panel.
    titleLines: ["Industrial", "Supply"],
    title: "Industrial Supply",
    subtitle:
      "Bulk supply solutions for OEMs, manufacturers and distributors — grades, finishes and quantities to your spec.",
    image: "/assets/ranges/industrial-supply.png",
    cta: "Explore Products",
    href: "/industrial-supply",
    range: "industrial",
  },
  {
    icon: Hammer,
    eyebrow: "For home",
    titleLines: ["DIY &", "Home"],
    title: "DIY & Home",
    subtitle:
      "A curated range for everyday home projects — the right fixings, sorted and boxed, no guesswork.",
    image: "/assets/ranges/diy-home.png",
    cta: "Explore Products",
    href: "/diy-home",
    range: "diy",
  },
];

export type Capability = { icon: LucideIcon; title: string; caption: string };

/** The four proof points in the dark bar directly under the hero. Short enough
 *  that all four sit on one row — keep titles to ~14 characters. */
export const CAPABILITIES: Capability[] = [
  {
    icon: ShieldCheck,
    title: "ISO 9001:2015",
    caption: "Certified quality system",
  },
  { icon: Ruler, title: "M1.6 → M80", caption: "Widest size range stocked" },
  { icon: BadgeCheck, title: "BS · IS · DIN", caption: "Standards compliant" },
  { icon: Truck, title: "Nationwide", caption: "Dispatch to your timeline" },
];

/** The three steps in the homepage "How it works" section (VII). Ordered — the
 *  numbers carry the sequence, so keep them in order. Each step is illustrated
 *  by a photograph of that stage actually happening. */
export type HowStep = {
  num: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
};

export const HOW_IT_WORKS_STEPS: HowStep[] = [
  {
    num: "01",
    title: "Talk to Our Expert",
    body: "Tell us what you need, along with your application, quantity or specifications.",
    image: "/assets/how-it-works/step-1-consult.png",
    imageAlt:
      "An IBC sales engineer taking a customer enquiry by phone at the counter",
  },
  {
    num: "02",
    title: "Get the Right Solution",
    body: "Our team looks into the requirement and recommends the right fastener, grade, size and finish best suited for you.",
    image: "/assets/how-it-works/step-2-specify.png",
    imageAlt:
      "An IBC engineer checking a bolt against a bracket with vernier calipers",
  },
  {
    num: "03",
    title: "Delivered to Your Timeline",
    body: "We understand urgency and work to meet the timeline you need.",
    image: "/assets/how-it-works/step-3-dispatch.png",
    imageAlt: "IBC cartons being loaded onto a truck for dispatch",
  },
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
  { icon: MapPin, label: "Visit us", value: SITE.address, href: SITE.addressHref },
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

/** Banners shown in the full-bleed hero carousel. Each is exported at 2047x921
 *  (~20:9). The headline and copy are baked into each image (dark left panel),
 *  so slides carry no `caption` — they only overlay a CTA over the artwork. */
export const HERO_SLIDES: HeroSlide[] = [
  {
    src: "/assets/banners/ibc.png",
    alt: "Over 1 million fasteners under one roof — IBC's full range of bolts, nuts, screws, washers and anchors",
    bg: "#141414",
    // Dark warehouse art → translucent brand orange CTA pops.
    cta: {
      label: "Shop the Range",
      href: "#categories",
      Icon: ShoppingCart,
      className: "bg-brand-500/85 ring-white/40 hover:bg-brand-500",
    },
  },
  {
    src: "/assets/banners/3.png",
    alt: "Scale your procurement with confidence — bulk fastening solutions for manufacturers and distributors",
    bg: "#141414",
    // Bulk / B2B poster → contact CTA in clean white glass.
    cta: {
      label: "Get Bulk Pricing",
      href: "#contact",
      Icon: Phone,
      className: "bg-white/20 ring-white/50 hover:bg-white/35",
    },
  },
  {
    src: "/assets/banners/2.png",
    alt: "Smart fastener boxes for everyday fixes — curated IBC fastener kits for everyday needs",
    bg: "#141414",
    cta: {
      label: "Shop Fastener Kits",
      href: "#categories",
      Icon: ShoppingCart,
      className: "bg-brand-500/85 ring-white/40 hover:bg-brand-500",
    },
  },
  {
    src: "/assets/banners/4.png",
    alt: "Quality that meets global standards — IBC is ISO 9001:2015 certified",
    bg: "#141414",
    // Certification poster → trust CTA into the About page.
    cta: {
      label: "Why Choose IBC",
      href: "/about-us",
      Icon: ShieldCheck,
      className: "bg-white/20 ring-white/50 hover:bg-white/35",
    },
  },
];
