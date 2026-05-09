// FILE: src/types/user.ts

export type UserType =
  | "PLATFORM_USER"
  | "ORGANIZATION_USER"
  | "SCHOOL_USER"
  | "TEACHER"
  | "PARENT"
  | "STUDENT"
  | "APPLICANT"
  | "PICKUP_DELEGATE"
  | "SERVICE_ACCOUNT";

export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED" | "DISABLED";

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
}

export interface ActiveMembership {
  membershipId: string;
  organizationId: string;
  schoolId: string | null;
  roleId: string;
  roleKey: string;
  permissions: string[];
}

export interface MeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  status: UserStatus;
  activeMembership: ActiveMembership | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface LoginRequest {
  email: string;
  password?: string; // Optional if we don't always need it
}

export interface RefreshRequest {
  refreshToken: string;
}
