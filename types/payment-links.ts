// Payment Link types for admin analytics

export type PaymentLinkStatus = "ACTIVE" | "USED" | "EXPIRED";

export interface PaymentLink {
  id: string;
  token: string;
  prospect_email: string;
  prospect_name: string | null;
  product_id: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  status: PaymentLinkStatus;
  created_by: string | null;
  used_by: string | null;
  stripe_checkout_session_id: string | null;
}

export interface PaymentLinkWithDetails extends PaymentLink {
  product?: {
    id: string;
    name: string;
    code: string;
  };
  order?: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    paid_at: string | null;
  };
  created_by_agent?: {
    id: string;
    name: string;
    email: string;
  };
  used_by_user?: {
    id: string;
    full_name: string | null;
  };
}

export interface PaymentLinkFilters {
  status?: PaymentLinkStatus[];
  product_id?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface PaymentLinkAnalytics {
  total_links: number;
  active_links: number;
  conversion_rate: number;
  avg_time_to_conversion_hours: number;
  avg_time_to_conversion_days: number;
}

export interface ConversionFunnelData {
  created_count: number;
  clicked_count: number;
  registered_count: number;
  paid_count: number;
}

export interface PaymentLinkTimeline {
  event: string;
  timestamp: string;
  description: string;
}
