/**
 * Permission management hook
 * Legacy attendance permissions are preserved while settings permissions resolve
 * from the authenticated API session.
 */

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";

export type PermissionKey =
  | "dashboard.analytics.view"
  | "admissions.applications.view"
  | "admissions.applications.manage"
  | "admissions.decisions.view"
  | "admissions.decisions.manage"
  | "admissions.documents.view"
  | "admissions.documents.manage"
  | "students.records.manage"
  | "students.guardians.view"
  | "students.guardians.manage"
  | "students.enrollments.manage"
  | "students.enrollments.view"
  | "students.documents.view"
  | "students.documents.manage"
  | "students.medical.view"
  | "students.medical.manage"
  | "students.notes.view"
  | "students.notes.manage"
  | "students.lifecycle.manage"
  | "students.records.view"
  | "teachers.records.view"
  | "teachers.records.manage"
  | "attendance.rollcall.submit"
  | "attendance.rollcall.unsubmit"
  | "attendance.excuses.approve"
  | "attendance.lateEarly.editMinutes"
  | "behavior.records.view"
  | "behavior.records.create"
  | "behavior.records.manage"
  | "behavior.records.review"
  | "behavior.categories.view"
  | "behavior.categories.manage"
  | "behavior.overview.view"
  | "settings.overview.view"
  | "settings.branding.view"
  | "settings.branding.manage"
  | "settings.users.view"
  | "settings.users.manage"
  | "settings.roles.view"
  | "settings.roles.manage"
  | "settings.permissions.view"
  | "settings.policies.view"
  | "settings.policies.manage"
  | "settings.email.connection.view"
  | "settings.email.connection.manage"
  | "settings.email.templates.view"
  | "settings.email.templates.manage"
  | "settings.email.deliveries.view"
  | "settings.email.deliveries.manage"
  | "settings.email.campaigns.view"
  | "settings.email.campaigns.manage"
  | "settings.email.credential_deliveries.view"
  | "settings.email.credential_deliveries.manage"
  | "settings.admissionsDocuments.view"
  | "settings.admissionsDocuments.manage"
  | "settings.templates.view"
  | "settings.templates.manage"
  | "settings.integrations.view"
  | "settings.integrations.configure"
  | "settings.security.view"
  | "settings.security.manage"
  | "settings.backup.view"
  | "settings.backup.manage"
  | "dismissal.settings.view"
  | "dismissal.settings.manage"
  | "dismissal.gates.view"
  | "dismissal.gates.manage"
  | "dismissal.staff.view"
  | "dismissal.staff.manage"
  | "dismissal.requests.view"
  | "dismissal.requests.manage"
  | "dismissal.requests.deliver"
  | "dismissal.requests.escalate"
  | "dismissal.requests.history.view"
  | "academics.overview.view"
  | "academics.subjects.view"
  | "academics.subjects.manage"
  | "academics.structure.view"
  | "academics.structure.manage"
  | "academics.calendar.view"
  | "academics.calendar.manage"
  | "academics.curriculum.view"
  | "academics.curriculum.manage"
  | "academics.lesson_plans.view"
  | "academics.lesson_plans.manage"
  | "files.uploads.manage"
  | "files.downloads.view"
  | "homework.assignments.view"
  | "homework.assignments.manage"
  | "homework.targets.view"
  | "homework.targets.manage"
  | "homework.submissions.view"
  | "grades.submissions.view"
  | "grades.submissions.submit"
  | "grades.submissions.review"
  | "grades.gradebook.view"
  | "grades.snapshots.view"
  | "grades.analytics.view"
  | "grades.assessments.view"
  | "grades.assessments.manage"
  | "grades.assessments.publish"
  | "grades.assessments.approve"
  | "grades.assessments.lock"
  | "grades.items.view"
  | "grades.items.manage"
  | "grades.questions.view"
  | "grades.questions.manage"
  | "grades.rules.view"
  | "grades.rules.manage"
  | "reinforcement.overview.view"
  | "reinforcement.templates.view"
  | "reinforcement.templates.manage"
  | "reinforcement.tasks.view"
  | "reinforcement.tasks.manage"
  | "reinforcement.xp.view"
  | "reinforcement.xp.manage"
  | "reinforcement.reviews.view"
  | "reinforcement.reviews.manage"
  | "reinforcement.rewards.view"
  | "reinforcement.rewards.manage"
  | "reinforcement.rewards.redemptions.view"
  | "reinforcement.rewards.redemptions.request"
  | "reinforcement.rewards.redemptions.review"
  | "reinforcement.rewards.fulfill"
  | "reinforcement.hero.view"
  | "reinforcement.hero.manage"
  | "reinforcement.hero.badges.view"
  | "reinforcement.hero.badges.manage"
  | "reinforcement.hero.progress.view"
  | "reinforcement.hero.progress.manage";

const legacyAdminPermissions: PermissionKey[] = [
  "attendance.rollcall.submit",
  "attendance.rollcall.unsubmit",
  "attendance.excuses.approve",
  "attendance.lateEarly.editMinutes",
  "academics.subjects.view",
  "academics.subjects.manage",
  "academics.structure.view",
  "academics.structure.manage",
];

const alwaysGrantedNedaaPermissions: PermissionKey[] = [
  "dismissal.settings.view",
  "dismissal.settings.manage",
  "dismissal.gates.view",
  "dismissal.gates.manage",
  "dismissal.staff.view",
  "dismissal.staff.manage",
  "dismissal.requests.view",
  "dismissal.requests.manage",
  "dismissal.requests.deliver",
  "dismissal.requests.escalate",
  "dismissal.requests.history.view",
];

export const settingsNavigationPermissionByKey: Partial<
  Record<string, PermissionKey>
> = {
  "settings-overview": "settings.overview.view",
  "settings-branding": "settings.branding.view",
  "settings-users": "settings.users.view",
  "settings-login-identity": "settings.users.view",
  "settings-credentials": "settings.users.view",
  "settings-roles": "settings.roles.view",
  "settings-policies": "settings.policies.view",
  "settings-admissions-documents": "settings.admissionsDocuments.view",
  "settings-templates": "settings.templates.view",
  "settings-integrations": "settings.integrations.view",
  "settings-email-connection": "settings.email.connection.view",
  "settings-email-templates": "settings.email.templates.view",
  "settings-email-credential-deliveries":
    "settings.email.credential_deliveries.view",
  "settings-email-deliveries": "settings.email.deliveries.view",
  "settings-email-campaigns": "settings.email.campaigns.view",
  "settings-security": "settings.security.view",
  "settings-backup": "settings.backup.view",
};

export const reinforcementNavigationPermissionByKey: Partial<
  Record<string, PermissionKey>
> = {
  "reinforcement-overview": "reinforcement.overview.view",
  "reinforcement-templates": "reinforcement.templates.view",
  "reinforcement-tasks": "reinforcement.tasks.view",
  "reinforcement-reviews": "reinforcement.reviews.view",
  "reinforcement-rewards": "reinforcement.rewards.view",
  "reinforcement-xp-policies": "reinforcement.xp.view",
  "reinforcement-xp-ledger": "reinforcement.xp.view",
  "hero-journey": "reinforcement.hero.view",
  "hero-journey-missions": "reinforcement.hero.view",
};

export const navigationPermissionByKey: Partial<Record<string, PermissionKey>> =
  {
    ...settingsNavigationPermissionByKey,
    ...reinforcementNavigationPermissionByKey,
    "admissions-applications": "admissions.applications.view",
    "admissions-workflow-policy": "admissions.applications.view",
    "admissions-decisions": "admissions.decisions.view",
    "admissions-enrollment": "students.enrollments.view",
    "students-list": "students.records.view",
    "guardians-list": "students.guardians.view",
    teachers: "teachers.records.view",
    "profile-correction-requests": "students.records.view",
    "documents-center": "students.documents.view",
    "academics-overview": "academics.overview.view",
    "academics-structure": "academics.structure.view",
    "academics-rooms": "academics.structure.view",
    "academics-subjects": "academics.subjects.view",
    "academics-teacher-allocation": "academics.structure.view",
    "academics-timetable": "academics.structure.view",
    "academics-calendar": "academics.calendar.view",
    "academics-curriculum": "academics.curriculum.view",
    "academics-lesson-plans": "academics.lesson_plans.view",
    "academics-homework": "homework.assignments.view",
    "behavior-overview": "behavior.overview.view",
    "behavior-reviews": "behavior.records.view",
    "behavior-records": "behavior.records.view",
    "behavior-categories": "behavior.categories.view",
    "nedaa-settings": "dismissal.settings.view",
    "nedaa-operations": "dismissal.requests.view",
    "nedaa-gates": "dismissal.gates.view",
    "nedaa-staff-assignments": "dismissal.staff.view",
    "dashboard-analytics": "dashboard.analytics.view",
  };

export function usePermissions() {
  const { user, isLoading } = useAuth();

  const membershipPermissions = useMemo(
    () => (user?.activeMembership?.permissions ?? []) as PermissionKey[],
    [user],
  );

  const grantedPermissions = useMemo(() => {
    return new Set<PermissionKey>([
      ...legacyAdminPermissions,
      ...alwaysGrantedNedaaPermissions,
      ...membershipPermissions,
    ]);
  }, [membershipPermissions]);

  const hasPermission = (key: PermissionKey): boolean =>
    grantedPermissions.has(key);
  const hasAnyPermission = (keys: PermissionKey[]): boolean =>
    keys.some((key) => grantedPermissions.has(key));
  const hasAllPermissions = (keys: PermissionKey[]): boolean =>
    keys.every((key) => grantedPermissions.has(key));

  return {
    role: user?.activeMembership?.roleKey ?? user?.userType ?? null,
    currentUser:
      user === null
        ? null
        : {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            roleId: user.activeMembership?.roleKey ?? user.userType,
          },
    grantedPermissions: Array.from(grantedPermissions),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    isPermissionsReady: !isLoading,
  };
}
