import { fetchSettingsRoles } from "@/features/settings/services/settingsRolesService";
import { fetchSettingsUsers } from "@/features/settings/services/settingsUsersService";
import type { RoleDefinition, SettingsUserRecord } from "@/features/settings/types";
import type { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";

function isTeacherRole(role: RoleDefinition) {
  const roleKey = (role.key || "").toLowerCase();
  const roleName = (role.name || "").toLowerCase();
  return (
    roleKey === "teacher" ||
    roleKey.endsWith(".teacher") ||
    roleKey.endsWith("_teacher") ||
    roleName === "teacher" ||
    roleName.includes("teacher")
  );
}

function mapUserToTeacher(user: SettingsUserRecord): Teacher {
  return {
    id: user.id,
    nameAr: user.fullName,
    nameEn: user.fullName,
    email: user.email,
    subjects: [],
    isActive: (user.status || "").toLowerCase() === "active",
  };
}

export async function fetchTeacherAllocationTeachers(): Promise<Teacher[]> {
  const rolesResult = await fetchSettingsRoles({ limit: 100 });
  const teacherRole = rolesResult.items.find(isTeacherRole);

  if (!teacherRole) {
    return [];
  }

  const usersResult = await fetchSettingsUsers({
    roleId: teacherRole.id,
    status: "active",
  });

  return usersResult.items.map(mapUserToTeacher);
}
