// FILE: src/components/students-guardians/profile-tabs/GuardiansTab.tsx

"use client";

import { useState } from "react";
import {
  Plus,
  Phone,
  Mail,
  Shield,
  Star,
  Edit2,
  Trash2,
  Users,
} from "lucide-react";
import { Student } from "@/types/students";

interface GuardiansTabProps {
  student: Student;
}

// Mock guardian data
const mockGuardians = [
  {
    id: "1",
    name: "Hassan Ahmed",
    relation: "father",
    phone: "+966 50 123 4567",
    email: "hassan.ahmed@email.com",
    portal_access: true,
    is_primary: true,
  },
  {
    id: "2",
    name: "Fatima Hassan",
    relation: "mother",
    phone: "+966 50 765 4321",
    email: "fatima.hassan@email.com",
    portal_access: true,
    is_primary: false,
  },
];

export default function GuardiansTab({ student }: GuardiansTabProps) {
  const [guardians] = useState(mockGuardians);
  const [showAddModal, setShowAddModal] = useState(false);

  const getRelationBadge = (relation: string) => {
    const colors: Record<string, string> = {
      father: "bg-blue-100 text-blue-700",
      mother: "bg-pink-100 text-pink-700",
      guardian: "bg-purple-100 text-purple-700",
      other: "bg-gray-100 text-gray-700",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[relation] || colors.other}`}
      >
        {relation.charAt(0).toUpperCase() + relation.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Guardians</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage student guardians and their portal access
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Guardian
        </button>
      </div>

      {/* Guardians List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guardians.map((guardian) => (
          <div
            key={guardian.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-[#036b80] transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#036b80] to-[#024d5c] flex items-center justify-center text-white font-bold">
                  {guardian.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {guardian.name}
                    </h3>
                    {guardian.is_primary && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  {getRelationBadge(guardian.relation)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{guardian.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{guardian.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  Portal Access:{" "}
                  <span
                    className={`font-medium ${guardian.portal_access ? "text-green-600" : "text-red-600"}`}
                  >
                    {guardian.portal_access ? "Enabled" : "Disabled"}
                  </span>
                </span>
              </div>
            </div>

            {/* Primary Guardian Badge */}
            {guardian.is_primary && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full">
                  <Star className="w-3 h-3" />
                  Primary Guardian
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {guardians.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No guardians added yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-[#036b80] hover:text-[#024d5c] font-medium text-sm"
          >
            Add your first guardian
          </button>
        </div>
      )}
    </div>
  );
}
