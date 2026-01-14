export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  status: UserStatus;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export function isActiveUser(
  user: UserProfile
): user is UserProfile & { status: "ACTIVE" } {
  return user.status === "ACTIVE";
}

export function isPendingUser(
  user: UserProfile
): user is UserProfile & { status: "PENDING" } {
  return user.status === "PENDING";
}

export function isSuspendedUser(
  user: UserProfile
): user is UserProfile & { status: "SUSPENDED" } {
  return user.status === "SUSPENDED";
}
