export type MarketplaceListingStatus = "draft" | "published" | "paused" | "archived";
export type MarketplacePriceType = "fixed" | "quote" | "free";

export interface MarketplaceListing {
  id: string;
  seller_user_id: string;
  seller_display_name: string | null;
  seller_profession: string | null;
  title: string;
  description: string;
  category: string;
  price_type: MarketplacePriceType;
  price_amount: number | null;
  tags: string[];
  status: MarketplaceListingStatus;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceInquiry {
  id: string;
  listing_id: string;
  buyer_user_id: string;
  message: string;
  status: "pending" | "replied" | "closed";
  created_at: string;
}

export interface CreateListingBody {
  title: string;
  description: string;
  category: string;
  price_type: MarketplacePriceType;
  price_amount?: number | null;
  tags?: string[];
}

export interface UpdateListingBody {
  title?: string;
  description?: string;
  category?: string;
  price_type?: MarketplacePriceType;
  price_amount?: number | null;
  tags?: string[];
  status?: MarketplaceListingStatus;
}

export interface SendInquiryBody {
  message: string;
}

export interface ListingsResponse {
  listings: MarketplaceListing[];
  total: number;
  page: number;
  limit: number;
}
