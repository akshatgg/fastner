/** Types mirroring the backend `app/industries/schemas.py` contracts. */

export type Industry = {
  id: string;
  name: string;
  slug: string;
  blurb: string | null;
  image_url: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type IndustryCreateInput = {
  name: string;
  slug?: string | null;
  blurb?: string | null;
  image_url?: string | null;
  position?: number;
  is_active?: boolean;
};

export type IndustryUpdateInput = Partial<IndustryCreateInput>;
