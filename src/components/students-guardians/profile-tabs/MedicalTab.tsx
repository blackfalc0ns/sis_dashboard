// FILE: src/components/students-guardians/profile-tabs/MedicalTab.tsx

"use client";

import { useState } from "react";
import { Heart, AlertTriangle, FileText, Edit2, Save, X } from "lucide-react";
import { Student } from "@/types/students";

interface MedicalTabProps {
  student: Student;
}

// Mock medical data
const mockMedicalProfile = {
  allergies: ["Peanuts", "Penicillin"],
  chronic_conditions: ["Asthma"],
  medications: ["Inhaler (as needed)"],
  blood_type: "A+",
  emergency_contact: "+966 50 123 4567",
  medical_notes:
    "Student requires inhaler during physical activities. Keep emergency contact informed of any incidents.",
  emergency_plan:
    "In case of asthma attack: 1) Help student use inhaler, 2) Call emergency contact, 3) If severe, call emergency services",
  last_checkup: "2024-01-15",
  next_checkup: "2024-07-15",
};

export default function MedicalTab({ student }: MedicalTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [medicalData, setMedicalData] = useState(mockMedicalProfile);

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const handleCancel = () => {
    setMedicalData(mockMedicalProfile);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Medical Profile</h2>
          <p className="text-sm text-gray-500 mt-1">
            Confidential medical information
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {medicalData.allergies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Allergy Alert</h3>
              <p className="text-sm text-red-700">
                Student has known allergies: {medicalData.allergies.join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Medical Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blood Type
            </label>
            <input
              type="text"
              value={medicalData.blood_type}
              onChange={(e) =>
                setMedicalData({ ...medicalData, blood_type: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact
            </label>
            <input
              type="text"
              value={medicalData.emergency_contact}
              onChange={(e) =>
                setMedicalData({
                  ...medicalData,
                  emergency_contact: e.target.value,
                })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Checkup
            </label>
            <input
              type="date"
              value={medicalData.last_checkup}
              onChange={(e) =>
                setMedicalData({ ...medicalData, last_checkup: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Checkup
            </label>
            <input
              type="date"
              value={medicalData.next_checkup}
              onChange={(e) =>
                setMedicalData({ ...medicalData, next_checkup: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Allergies */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Allergies</h3>
        {isEditing ? (
          <textarea
            value={medicalData.allergies.join(", ")}
            onChange={(e) =>
              setMedicalData({
                ...medicalData,
                allergies: e.target.value.split(",").map((a) => a.trim()),
              })
            }
            rows={2}
            placeholder="Enter allergies separated by commas"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {medicalData.allergies.length > 0 ? (
              medicalData.allergies.map((allergy, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                >
                  {allergy}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500">No known allergies</p>
            )}
          </div>
        )}
      </div>

      {/* Chronic Conditions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Chronic Conditions
        </h3>
        {isEditing ? (
          <textarea
            value={medicalData.chronic_conditions.join(", ")}
            onChange={(e) =>
              setMedicalData({
                ...medicalData,
                chronic_conditions: e.target.value
                  .split(",")
                  .map((c) => c.trim()),
              })
            }
            rows={2}
            placeholder="Enter chronic conditions separated by commas"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {medicalData.chronic_conditions.length > 0 ? (
              medicalData.chronic_conditions.map((condition, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                >
                  {condition}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500">No chronic conditions</p>
            )}
          </div>
        )}
      </div>

      {/* Medications */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Medications</h3>
        {isEditing ? (
          <textarea
            value={medicalData.medications.join(", ")}
            onChange={(e) =>
              setMedicalData({
                ...medicalData,
                medications: e.target.value.split(",").map((m) => m.trim()),
              })
            }
            rows={2}
            placeholder="Enter medications separated by commas"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {medicalData.medications.length > 0 ? (
              medicalData.medications.map((medication, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {medication}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500">No medications</p>
            )}
          </div>
        )}
      </div>

      {/* Medical Notes */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          Medical Notes
        </h3>
        <textarea
          value={medicalData.medical_notes}
          onChange={(e) =>
            setMedicalData({ ...medicalData, medical_notes: e.target.value })
          }
          disabled={!isEditing}
          rows={4}
          placeholder="Enter any additional medical notes..."
          className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
            isEditing
              ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              : "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        />
      </div>

      {/* Emergency Plan */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-red-500">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Emergency Plan
        </h3>
        <textarea
          value={medicalData.emergency_plan}
          onChange={(e) =>
            setMedicalData({ ...medicalData, emergency_plan: e.target.value })
          }
          disabled={!isEditing}
          rows={4}
          placeholder="Enter emergency response plan..."
          className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
            isEditing
              ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              : "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        />
      </div>
    </div>
  );
}
