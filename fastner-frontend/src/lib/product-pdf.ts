/** Build and download a product spec sheet as a PDF, client-side.
 *
 * Captures everything shown on the product page: name, part number, category trail,
 * key features, attributes (filter values), the full specifications table,
 * B2C/B2B pricing, and the long description — plus the primary image when it
 * can be fetched. Uses jsPDF (loaded lazily, browser-only); no server round-trip. */
import { SITE, LOGOS } from "@/lib/site-data";
import type { Product } from "@/features/catalog/types";

// jsPDF's built-in Helvetica is Latin-1 only, so the ₹ glyph (U+20B9) renders
// as garbage. Use a plain "Rs." prefix with en-IN grouping for the spec sheet.
const inrGroup = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const pdfPrice = (amount: number) => `Rs. ${inrGroup.format(amount)}`;

const MARGIN = 48;
const LINE = 16;

// Brand palette (kept in sync with the site theme).
const BRAND: [number, number, number] = [236, 58, 38]; // #EC3A26 brand red
const INK: [number, number, number] = [20, 18, 18]; // #141212
const MUTED: [number, number, number] = [130, 125, 125]; // #827D7D steel grey
const BODY: [number, number, number] = [70, 70, 70];
const HAIRLINE: [number, number, number] = [228, 228, 228];
const ZEBRA: [number, number, number] = [247, 247, 247];

const HEADER_H = 86; // height of the top header band
const FOOTER_H = 44; // reserved space at the bottom of every page

type ImageData = { dataUrl: string; format: "PNG" | "JPEG" };

/** Fetch a remote image and turn it into a data URL so jsPDF can embed it.
 *  Returns null on any failure (CORS, network, decode) so the PDF still builds. */
async function fetchImageData(url: string): Promise<ImageData | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const format: ImageData["format"] = blob.type.includes("png")
      ? "PNG"
      : "JPEG";
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { dataUrl, format };
  } catch {
    return null;
  }
}

export async function downloadProductPdf(product: Product): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  let y = MARGIN;

  // Fetch the logo and primary image up front (both may be null on failure).
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [logo, productImg] = await Promise.all([
    // encodeURI: the brand logo filenames contain spaces.
    fetchImageData(encodeURI(`${origin}${LOGOS.dark}`)),
    product.images[0] ? fetchImageData(product.images[0]) : Promise.resolve(null),
  ]);

  /** Draw the branded header band on the current page. */
  const drawHeader = () => {
    // Thin brand accent strip flush to the top edge.
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, pageW, 5, "F");

    // Logo (left). Preserve aspect ratio; fall back to wordmark text.
    const logoH = 34;
    const logoY = 26;
    if (logo) {
      try {
        const props = doc.getImageProperties(logo.dataUrl);
        const logoW = (props.width / props.height) * logoH;
        doc.addImage(logo.dataUrl, logo.format, MARGIN, logoY, logoW, logoH);
      } catch {
        drawWordmark(logoY);
      }
    } else {
      drawWordmark(logoY);
    }

    // Contact block (right), right-aligned.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const right = pageW - MARGIN;
    doc.text(SITE.phone, right, 30, { align: "right" });
    doc.text(SITE.email, right, 44, { align: "right" });
    doc.text(SITE.tagline, right, 58, { align: "right" });

    // Divider under the header.
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(1);
    doc.line(MARGIN, HEADER_H, pageW - MARGIN, HEADER_H);
  };

  const drawWordmark = (topY: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...INK);
    doc.text(SITE.fullName, MARGIN, topY + 22);
  };

  /** Move down by `h`, starting a new page (with header) if we'd overflow. */
  const ensure = (h: number) => {
    if (y + h > pageH - FOOTER_H) {
      doc.addPage();
      drawHeader();
      y = HEADER_H + 24;
    }
  };

  /** Write wrapped text and advance the cursor. */
  const text = (
    value: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {},
  ) => {
    const { size = 10, bold = false, color = BODY, gap = 4 } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(value, contentW) as string[];
    for (const line of lines) {
      ensure(size + 4);
      doc.text(line, MARGIN, y);
      y += size + 4;
    }
    y += gap;
  };

  /** Section heading: small uppercase label with an orange accent rule. */
  const section = (label: string) => {
    ensure(34);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(label.toUpperCase(), MARGIN, y);
    // short accent underline
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(2);
    doc.line(MARGIN, y + 6, MARGIN + 28, y + 6);
    y += 20;
  };

  // ----- page 1 header -----
  drawHeader();
  y = HEADER_H + 28;

  // ----- title block -----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND);
  doc.text("PRODUCT SPECIFICATION SHEET", MARGIN, y);
  y += 18;

  text(product.name, { size: 20, bold: true, color: INK, gap: 4 });

  const trail = [...product.categories]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    .map((c) => c.name);
  if (trail.length > 0) {
    text(trail.join("  ›  "), { size: 9, color: MUTED, gap: 2 });
  }
  if (product.sku) {
    text(`Part Number: ${product.sku}`, { size: 9, color: MUTED, gap: 2 });
  }
  y += 6;

  // ----- image (framed) -----
  if (productImg) {
    try {
      const props = doc.getImageProperties(productImg.dataUrl);
      const maxW = 220;
      const maxH = 220;
      const ratio = Math.min(maxW / props.width, maxH / props.height);
      const w = props.width * ratio;
      const h = props.height * ratio;
      const pad = 8;
      ensure(h + pad * 2 + 8);
      // light frame around the image
      doc.setDrawColor(...HAIRLINE);
      doc.setLineWidth(1);
      doc.setFillColor(252, 252, 252);
      doc.roundedRect(MARGIN, y, w + pad * 2, h + pad * 2, 4, 4, "FD");
      doc.addImage(productImg.dataUrl, productImg.format, MARGIN + pad, y + pad, w, h);
      y += h + pad * 2 + 12;
    } catch {
      /* skip image if jsPDF can't decode it */
    }
  }

  // ----- key features -----
  // Lifted out of the specifications table for the same reason as on the
  // product page: the value is a list, and a table cell turns it into one
  // unreadable comma-joined line.
  const norm = (k: string) => k.toLowerCase().replace(/[\s_-]/g, "");
  const allSpecs = Object.entries(product.specifications ?? {});
  const rawFeatures = allSpecs.find(([k]) => norm(k) === "keyfeatures")?.[1];
  const keyFeatures = (
    Array.isArray(rawFeatures)
      ? rawFeatures.map(String)
      : typeof rawFeatures === "string"
        ? rawFeatures.split(",")
        : []
  )
    .map((f) => f.trim())
    .filter(Boolean);

  if (keyFeatures.length > 0) {
    section("Key Features");
    for (const f of keyFeatures) {
      text(`•  ${f}`, { size: 10, gap: 2 });
    }
  }

  // ----- attributes (filter values) -----
  if (product.filter_values.length > 0) {
    section("Attributes");
    for (const f of product.filter_values) {
      text(`•  ${f.group_name}: ${f.value}`, { size: 10, gap: 2 });
    }
  }

  // ----- specifications table (zebra striped, with header row) -----
  const specs = allSpecs.filter(([k]) => norm(k) !== "keyfeatures");
  if (specs.length > 0) {
    section("Specifications");
    const labelW = contentW * 0.4;
    const padX = 10;

    // header row
    ensure(LINE + 6);
    doc.setFillColor(...INK);
    doc.rect(MARGIN, y, contentW, LINE + 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("SPECIFICATION", MARGIN + padX, y + LINE - 2);
    doc.text("VALUE", MARGIN + labelW + padX, y + LINE - 2);
    y += LINE + 6;

    let zebra = false;
    for (const [k, v] of specs) {
      const valLines = doc.splitTextToSize(
        String(v),
        contentW - labelW - padX * 2,
      ) as string[];
      const rowH = Math.max(LINE + 8, valLines.length * LINE + 8);
      ensure(rowH);
      if (zebra) {
        doc.setFillColor(...ZEBRA);
        doc.rect(MARGIN, y, contentW, rowH, "F");
      }
      const textY = y + LINE;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...MUTED);
      doc.text(String(k), MARGIN + padX, textY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...INK);
      doc.text(valLines, MARGIN + labelW + padX, textY);
      y += rowH;
      zebra = !zebra;
    }
    // bottom border of table
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(1);
    doc.line(MARGIN, y, MARGIN + contentW, y);
    y += 8;
  }

  // ----- industries served -----
  if (product.industries.length > 0) {
    section("Industries Served");
    text(product.industries.map((i) => i.name).join("   ·   "), {
      size: 10,
      color: BODY,
    });
  }

  // ----- pricing (highlighted box) -----
  section("Pricing");
  const priceLines: string[] = [];
  if (product.price_b2c != null) {
    priceLines.push(`Retail (B2C):  ${pdfPrice(product.price_b2c)} / piece`);
  }
  if (product.price_b2b != null) {
    priceLines.push(
      `Bulk (B2B):  ${pdfPrice(product.price_b2b)} / piece  —  minimum ${product.b2b_min_qty} pcs`,
    );
  }
  if (priceLines.length === 0) {
    priceLines.push("Contact us for pricing.");
  }
  const boxPad = 12;
  const boxH = priceLines.length * LINE + boxPad * 2 - 4;
  ensure(boxH + 6);
  doc.setFillColor(255, 245, 238); // soft brand tint
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(1);
  doc.roundedRect(MARGIN, y, contentW, boxH, 4, 4, "FD");
  let py = y + boxPad + 8;
  for (const pl of priceLines) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(pl, MARGIN + boxPad, py);
    py += LINE;
  }
  y += boxH + 12;

  // ----- long description -----
  if (product.description) {
    section("Description");
    text(product.description, { size: 10, color: BODY });
  }

  // ----- footer on every page -----
  const generated = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(1);
    doc.line(MARGIN, pageH - FOOTER_H + 10, pageW - MARGIN, pageH - FOOTER_H + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `${SITE.fullName} · ${SITE.phone} · ${SITE.email}`,
      MARGIN,
      pageH - 22,
    );
    doc.text(
      `Generated ${generated}    Page ${p} of ${pages}`,
      pageW - MARGIN,
      pageH - 22,
      { align: "right" },
    );
  }

  doc.save(`${product.slug || "product"}.pdf`);
}
