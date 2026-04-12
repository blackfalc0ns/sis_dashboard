import type { Teacher, TeacherFormData } from "@/features/teachers/types";

export async function listTeachers(): Promise<Teacher[]> {
  // TODO: Replace this scaffold with a real teachers listing API call.
  throw new Error("Teachers API adapter is not implemented yet.");
}

export async function createTeacher(
  _data: TeacherFormData,
): Promise<Teacher> {
  void _data;
  // TODO: Replace this scaffold with a real teacher creation API call.
  throw new Error("Teachers API adapter is not implemented yet.");
}

export async function updateTeacher(
  _id: string,
  _data: TeacherFormData,
): Promise<Teacher> {
  void _id;
  void _data;
  // TODO: Replace this scaffold with a real teacher update API call.
  throw new Error("Teachers API adapter is not implemented yet.");
}

export async function deleteTeacher(_id: string): Promise<void> {
  void _id;
  // TODO: Replace this scaffold with a real teacher deletion API call.
  throw new Error("Teachers API adapter is not implemented yet.");
}

export async function toggleTeacherStatus(
  _id: string,
): Promise<Teacher> {
  void _id;
  // TODO: Replace this scaffold with a real teacher activation API call.
  throw new Error("Teachers API adapter is not implemented yet.");
}

export async function changeTeacherPassword(
  _id: string,
  _newPassword: string,
): Promise<void> {
  void _id;
  void _newPassword;
  // TODO: Replace this scaffold with a real teacher password API call.
  throw new Error("Teachers API adapter is not implemented yet.");
}
