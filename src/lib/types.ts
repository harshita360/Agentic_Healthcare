export type FamilyRole = "patient" | "coordinator" | "caregiver" | "viewer";

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
}

export interface Permission {
  id: string;
  memberId: string;
  grantedToMemberId: string;
  scope: string;
}

export interface CareTask {
  id: string;
  memberId: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
}

export interface Approval {
  id: string;
  taskId: string;
  requestedFromMemberId: string;
  status: "pending" | "approved" | "declined";
}

export interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  occurredAt: string;
}
