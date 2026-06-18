import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchSettingsRoles } from "@/features/settings/services/settingsRolesService";
import { fetchSettingsUsers } from "@/features/settings/services/settingsUsersService";
import { fetchTeacherAllocationTeachers } from "@/features/academics/teacher-allocation/services/teacherAllocationTeachersApiService";

vi.mock("@/features/settings/services/settingsRolesService", () => ({
  fetchSettingsRoles: vi.fn(),
}));

vi.mock("@/features/settings/services/settingsUsersService", () => ({
  fetchSettingsUsers: vi.fn(),
}));

const mockedFetchSettingsRoles = vi.mocked(fetchSettingsRoles);
const mockedFetchSettingsUsers = vi.mocked(fetchSettingsUsers);

describe("teacherAllocationTeachersApiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads active users from the backend teacher role without creating fake teachers", async () => {
    mockedFetchSettingsRoles.mockResolvedValueOnce({
      items: [
        {
          id: "role-1",
          key: "academics_teacher",
          name: "Academic Teacher",
          description: "Teachers",
          isSystem: true,
          memberCount: 1,
          permissions: [],
        },
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
      },
    });
    mockedFetchSettingsUsers.mockResolvedValueOnce({
      items: [
        {
          id: "teacher-user-1",
          fullName: "Mariam Ali",
          email: "teacher@example.test",
          status: "active",
          roles: [],
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
      },
    });

    await expect(fetchTeacherAllocationTeachers()).resolves.toEqual([
      {
        id: "teacher-user-1",
        nameAr: "Mariam Ali",
        nameEn: "Mariam Ali",
        email: "teacher@example.test",
        subjects: [],
        isActive: true,
      },
    ]);
    expect(mockedFetchSettingsRoles).toHaveBeenCalledWith({ limit: 100 });
    expect(mockedFetchSettingsUsers).toHaveBeenCalledWith({
      roleId: "role-1",
      status: "active",
    });
  });

  it("returns an honest empty list when the backend has no teacher role", async () => {
    mockedFetchSettingsRoles.mockResolvedValueOnce({
      items: [],
      pagination: {
        page: 1,
        limit: 100,
        total: 0,
      },
    });

    await expect(fetchTeacherAllocationTeachers()).resolves.toEqual([]);
    expect(mockedFetchSettingsUsers).not.toHaveBeenCalled();
  });
});
