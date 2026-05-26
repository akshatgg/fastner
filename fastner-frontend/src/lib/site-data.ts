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

export type Category = {
  name: string;
  /** Product image in /public/assets/categories. */
  image: string;
};

export const CATEGORIES: Category[] = [
  { name: "Nuts", image: "/assets/categories/nuts.png" },
  { name: "Washers", image: "/assets/categories/washers.png" },
  { name: "Eye Bolt", image: "/assets/categories/eye-bolt.png" },
  { name: "Grub Screws", image: "/assets/categories/grub-screws.png" },
  { name: "Brass Inserts", image: "/assets/categories/brass-inserts.png" },
  { name: "Spacers", image: "/assets/categories/spacers.png" },
  { name: "Circlips", image: "/assets/categories/circlips.png" },
  { name: "Rivets", image: "/assets/categories/rivets.png" },
  { name: "Couplers & Fittings", image: "/assets/categories/couplers-fittings.png" },
  { name: "Power Tools", image: "/assets/categories/power-tools.png" },
  { name: "Hand Tools", image: "/assets/categories/hand-tools.png" },
  { name: "Abrasives", image: "/assets/categories/abrasives.png" },
  { name: "Magnets", image: "/assets/categories/magnets.png" },
  { name: "Tapes", image: "/assets/categories/tapes.png" },
  { name: "Storage Boxes", image: "/assets/categories/storage-boxes.png" },
  { name: "Spray Paints", image: "/assets/categories/spray-paints.png" },
];

export type Industry = {
  name: string;
  /** Photo in /public/assets — represents the sector. */
  image: string;
  /** One-line note on how fasteners serve the sector. */
  blurb: string;
};

export const INDUSTRIES: Industry[] = [
  {
    name: "Aerospace & Aviation",
    image: "/assets/industries/aerospace.png",
    blurb: "Lightweight, high-strength fixings to aerospace tolerances.",
  },
  {
    name: "Defense & Military",
    image: "/assets/industries/defense.png",
    blurb: "High-spec fasteners for mission-critical equipment.",
  },
  {
    name: "Oil, Gas & Energy",
    image: "/assets/industries/energy.png",
    blurb: "Rigs, pipelines and turbines built to take extreme loads.",
  },
  {
    name: "Railway",
    image: "/assets/industries/railway.png",
    blurb: "Track, rolling stock and signalling hardware.",
  },
  {
    name: "Marine",
    image: "/assets/industries/marine.png",
    blurb: "Corrosion-resistant fasteners made for water and salt.",
  },
  {
    name: "Mining & Heavy Equipment",
    image: "/assets/industries/mining.png",
    blurb: "Rugged fasteners that hold up on the toughest machinery.",
  },
  {
    name: "Telecommunications",
    image: "/assets/industries/telecom.png",
    blurb: "Towers, enclosures and network infrastructure.",
  },
  {
    name: "HVAC",
    image: "/assets/industries/hvac.png",
    blurb: "Ducting, air handlers and outdoor condenser units.",
  },
  {
    name: "Medical Equipment",
    image: "/assets/industries/medical.png",
    blurb: "Precision fastening for critical medical devices.",
  },
  {
    name: "Packaging & Warehousing",
    image: "/assets/industries/packaging.png",
    blurb: "Conveyors, racking and high-throughput packaging lines.",
  },
  {
    name: "Furniture & Interiors",
    image: "/assets/industries/furniture.png",
    blurb: "Cabinetry, fit-outs and modular furniture assembly.",
  },
];

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
