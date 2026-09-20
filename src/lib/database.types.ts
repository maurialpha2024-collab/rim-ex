// Hand-written types matching supabase/migrations/0001_init.sql.
// Once the schema is live, regenerate with:
//   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/database.types.ts

export type VerificationStatus =
  | "unverified"
  | "pending_verification"
  | "verified"
  | "rejected";

export type SubscriptionStatus = "active" | "inactive";

export type OrderType = "sell_um_for_ruble" | "sell_ruble_for_um";
export type OrderStatus = "open" | "locked" | "completed" | "cancelled";
export type TradeStatus = "locked" | "completed" | "cancelled";

export interface UserRow {
  id: string;
  email: string | null;
  email_verified: boolean;
  phone: string | null;
  phone_verified: boolean;
  whatsapp_number: string | null;
  passport_photo_url: string | null;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  display_name: string | null;
  avg_rating: number;
  completed_trades_count: number;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  is_suspended: boolean;
  created_at: string;
}

export type AdminRole = "owner" | "admin";

export interface AdminRow {
  id: string;
  email: string | null;
  name: string | null;
  // role / is_active / created_by come from 0007_admin_management.sql; optional so
  // the dashboard keeps working (everyone treated as an active owner) until it is run.
  role?: AdminRole;
  is_active?: boolean;
  created_by?: string | null;
  created_at: string;
}

export interface OrderRow {
  id: string;
  user_id: string;
  type: OrderType;
  amount: number;
  rate: number;
  status: OrderStatus;
  created_at: string;
}

export type CancelReason = "changed_mind" | "no_response" | "payment_issue" | "other";

export interface TradeRow {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  rate: number;
  status: TradeStatus;
  buyer_confirmed: boolean;
  seller_confirmed: boolean;
  // From 0008_cancel_trade.sql; optional so the app keeps working until it is run.
  // A cancelled trade without `cancelled_by` timed out.
  cancelled_by?: string | null;
  cancel_reason?: CancelReason | null;
  cancelled_at?: string | null;
  locked_at: string;
  completed_at: string | null;
}

export type ChatMessageType = "text" | "image" | "audio";

export interface ChatMessageRow {
  id: string;
  trade_id: string;
  sender_id: string;
  message: string | null;
  message_type: ChatMessageType;
  attachment_path: string | null;
  created_at: string;
}

export interface RatingRow {
  id: string;
  trade_id: string;
  rated_by: string;
  rated_user: string;
  stars: number;
  comment: string | null;
  created_at: string;
}

export interface AdminAuditLogRow {
  id: string;
  admin_id: string;
  user_id: string | null;
  trade_id: string | null;
  action: string;
  note: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Partial<UserRow>;
        Update: Partial<UserRow>;
        Relationships: [];
      };
      admins: {
        Row: AdminRow;
        Insert: Partial<AdminRow>;
        Update: Partial<AdminRow>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: Partial<OrderRow>;
        Update: Partial<OrderRow>;
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      trades: {
        Row: TradeRow;
        Insert: Partial<TradeRow>;
        Update: Partial<TradeRow>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessageRow;
        Insert: Partial<ChatMessageRow>;
        Update: Partial<ChatMessageRow>;
        Relationships: [];
      };
      ratings: {
        Row: RatingRow;
        Insert: Partial<RatingRow>;
        Update: Partial<RatingRow>;
        Relationships: [];
      };
      admin_audit_log: {
        Row: AdminAuditLogRow;
        Insert: Partial<AdminAuditLogRow>;
        Update: Partial<AdminAuditLogRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_order: { Args: { p_order_id: string }; Returns: TradeRow };
      confirm_trade: { Args: { p_trade_id: string }; Returns: TradeRow };
      cancel_trade: { Args: { p_trade_id: string; p_reason?: string }; Returns: TradeRow };
      release_expired_trades: { Args: Record<string, never>; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
