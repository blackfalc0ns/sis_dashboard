// FILE: src/components/admissions/Application360Modal.tsx

"use client";

import { useState } from "react";
import {
  X,
  FileText,
  ClipboardCheck,
  MessageSquare,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Heart,
  FileCheck,
} from "lucide-react";
import { Application } from "@/types/admissions";
import StatusBadge from "./StatusBadge";
import TabNavigation from "./TabNavigation";

interface Application360ModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onScheduleTest: () => void;
  onScheduleInterview: () => void;
  onMakeDecision: () => void;
  onEnroll: () => void;
}

export default function Application360Modal({
  application,
  isOpen,
  onClose,
  onScheduleTest,
  onScheduleInterview,
  onMakeDecision,
  onEnroll,
}: Application360ModalProps) {
  const [activeTab, setActiveTab] = useState("details");

  if (!isOpen) return null;

  const tabs = [
    { id: "details", label: "Details", icon: <FileText className="w-4 h-4" /> },
    { id: "guardians", label: "Guardians", icon: <User className="w-4 h-4" /> },
    {
      id: "documents",
      label: "Documents",
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      id: "tests",
      label: "Tests",
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: "interviews",
      label: "Interviews",
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: <Calendar className="w-4 h-4" />,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Application {application.id}
            </h2>
            <p className="text-sm text-gray-500">
              {application.studentName} - {application.gradeRequested}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Student Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">English Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {application.full_name_en || application.studentName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Arabic Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {application.full_name_ar ||
                          application.studentNameArabic ||
                          "N/A"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.gender || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date of Birth</p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.date_of_birth
                            ? new Date(
                                application.date_of_birth,
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Nationality</p>
                      <p className="text-sm font-medium text-gray-900">
                        {application.nationality || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Grade Requested</p>
                      <p className="text-sm font-medium text-gray-900">
                        {application.grade_requested ||
                          application.gradeRequested}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    {application.address_line && (
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.address_line}
                        </p>
                        {(application.district || application.city) && (
                          <p className="text-xs text-gray-600">
                            {[application.district, application.city]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                    {application.student_phone && (
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Student Phone
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.student_phone}
                        </p>
                      </div>
                    )}
                    {application.student_email && (
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Student Email
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.student_email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {application.previous_school && (
                    <div>
                      <p className="text-xs text-gray-500">Previous School</p>
                      <p className="text-sm font-medium text-gray-900">
                        {application.previous_school}
                      </p>
                    </div>
                  )}
                  {application.join_date && (
                    <div>
                      <p className="text-xs text-gray-500">
                        Intended Join Date
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(application.join_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Application Status</p>
                    <StatusBadge status={application.status} size="md" />
                  </div>
                </div>
              </div>

              {/* Medical & Notes */}
              {(application.medical_conditions || application.notes) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Medical & Additional Information
                  </h3>
                  <div className="space-y-3">
                    {application.medical_conditions && (
                      <div>
                        <p className="text-xs text-gray-500">
                          Medical Conditions
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.medical_conditions}
                        </p>
                      </div>
                    )}
                    {application.notes && (
                      <div>
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Application Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Important Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Submitted Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(application.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                  {application.join_date && (
                    <div>
                      <p className="text-xs text-gray-500">
                        Expected Start Date
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(application.join_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "guardians" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Guardian Information
              </h3>
              {application.guardians && application.guardians.length > 0 ? (
                <div className="space-y-4">
                  {application.guardians.map((guardian, index) => (
                    <div
                      key={guardian.id || index}
                      className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#036b80]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {guardian.full_name}
                            {guardian.is_primary && (
                              <span className="text-xs bg-[#036b80] text-white px-2 py-0.5 rounded-full">
                                Primary
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600 capitalize">
                            {guardian.relation}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> Primary Phone
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {guardian.phone_primary}
                            </p>
                          </div>
                          {guardian.phone_secondary && (
                            <div>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Secondary Phone
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {guardian.phone_secondary}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Email
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {guardian.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">National ID</p>
                            <p className="text-sm font-medium text-gray-900">
                              {guardian.national_id}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Briefcase className="w-3 h-3" /> Job Title
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {guardian.job_title}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Workplace</p>
                            <p className="text-sm font-medium text-gray-900">
                              {guardian.workplace}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Permissions
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {guardian.can_pickup && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  Can Pickup
                                </span>
                              )}
                              {guardian.can_receive_notifications && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  Receives Notifications
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Primary Guardian:</strong>{" "}
                    {application.guardianName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Phone:</strong> {application.guardianPhone}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Email:</strong> {application.guardianEmail}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Required Documents
              </h3>
              <div className="space-y-2">
                {application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {doc.type}
                        </p>
                        {doc.name && (
                          <p className="text-xs text-gray-500">{doc.name}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge
                      status={
                        doc.status === "complete" ? "completed" : "scheduled"
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "tests" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Placement Tests</h3>
                <button
                  onClick={onScheduleTest}
                  className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Schedule Test
                </button>
              </div>
              {application.tests.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No tests scheduled yet
                </p>
              ) : (
                <div className="space-y-2">
                  {application.tests.map((test) => (
                    <div
                      key={test.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {test.subject} - {test.type}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {test.date} at {test.time} • {test.location}
                          </p>
                          {test.score !== undefined && (
                            <p className="text-sm font-medium text-[#036b80] mt-2">
                              Score: {test.score}/{test.maxScore}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={test.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "interviews" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Interviews</h3>
                <button
                  onClick={onScheduleInterview}
                  className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Schedule Interview
                </button>
              </div>
              {application.interviews.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No interviews scheduled yet
                </p>
              ) : (
                <div className="space-y-2">
                  {application.interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Interview with {interview.interviewer}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {interview.date} at {interview.time} •{" "}
                            {interview.location}
                          </p>
                          {interview.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              {interview.notes}
                            </p>
                          )}
                          {interview.rating && (
                            <p className="text-sm font-medium text-[#036b80] mt-2">
                              Rating: {interview.rating}/5
                            </p>
                          )}
                        </div>
                        <StatusBadge status={interview.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Application Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#036b80] mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Application Submitted
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(application.submittedDate).toLocaleString()}
                    </p>
                  </div>
                </div>
                {application.tests.map((test) => (
                  <div key={test.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {test.subject} Test{" "}
                        {test.status === "completed"
                          ? "Completed"
                          : "Scheduled"}
                      </p>
                      <p className="text-xs text-gray-500">{test.date}</p>
                    </div>
                  </div>
                ))}
                {application.interviews.map((interview) => (
                  <div key={interview.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Interview{" "}
                        {interview.status === "completed"
                          ? "Completed"
                          : "Scheduled"}
                      </p>
                      <p className="text-xs text-gray-500">{interview.date}</p>
                    </div>
                  </div>
                ))}
                {application.decision && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Decision: {application.decision.decision.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {application.decision.decisionDate}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Bar */}
        <div className="border-t border-gray-200 px-6 py-4 bg-white">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onScheduleTest}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Schedule Test
            </button>
            <button
              onClick={onScheduleInterview}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Schedule Interview
            </button>
            <button
              onClick={onMakeDecision}
              className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Make Decision
            </button>
            {application.status === "accepted" && (
              <button
                onClick={onEnroll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Enroll Student
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
