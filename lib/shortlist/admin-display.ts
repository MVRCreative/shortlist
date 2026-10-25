import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];
type DropStatus = Database["public"]["Enums"]["drop_status"];

export type AdminAccount = {
  id: string;
  position: number;
  company: string;
  domain: string | null;
  contact: string | null;
  fitReason: string;
};

export type AdminDigest = {
  id: string;
  status: DropStatus;
  scheduledFor: string;
  deliveredCount: number;
  targetCount: number;
  shortfallNote: string | null;
  accounts: AdminAccount[];
};

export type AdminUserSummary = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  businessName: string | null;
  websiteDomain: string | null;
  digestCount: number;
};

export type AdminAccountDetails = {
  description: string | null;
  services: string[];
  dealSize: string | null;
  onboardingCompletedAt: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  industries: string[];
  companySizes: string[];
  regions: string[];
  buyerTitles: string[];
  signals: string[];
};

export type AdminUserDetail = AdminUserSummary & {
  createdAt: string;
  account: AdminAccountDetails | null;
  digests: AdminDigest[];
};

const roleLabels: Record<UserRole, string> = {
  standard: "Standard",
  admin: "Admin",
};

const statusLabels: Record<DropStatus, string> = {
  scheduled: "Scheduled",
  building: "Building",
  delivered: "Delivered",
  failed: "Failed",
  skipped: "Skipped",
};

export function roleLabel(role: UserRole): string {
  return roleLabels[role];
}

export function digestStatusLabel(status: DropStatus): string {
  return statusLabels[status];
}
