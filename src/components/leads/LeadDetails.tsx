// FILE: src/components/leads/LeadDetails.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  UserCircle,
  TrendingUp,
} from "lucide-react";
import LeadStatusBadge from "@/components/leads/LeadStatusBadge";
import ActivityLog from "@/components/leads/ActivityLog";
import NotesPanel from "@/components/leads/NotesPanel";
import TabNavigation from "@/components/admissions/TabNavigation";
import {
  getLeadById,
  updateLead,
  getActivitiesByLeadId,
  getNotesByLeadId,
  addActivity,
  addNote,
  convertLeadToApplication,
} from "@/api/mockLeadsApi";
import { Lead, LeadStatus, ActivityType } from "@/types/leads";

interface LeadDetailsProps {
  leadId: string;
}

export default function LeadDetails({ leadId }: LeadDetailsProps) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState(getActivitiesByLeadId(leadId));
  const [notes, setNotes] = useState(getNotesByLeadId(leadId));
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);

  useEffect(() => {
    const loadLead = () => {
      const foundLead = getLeadById(leadId);
      if (foundLead) {
        setLead(foundLead);
      } else {
        alert("Lead not found");
        router.push("/en/admissions/leads");
      }
    };
    loadLead();
  }, [leadId, router]);

  if (!lead) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const handleStatusChange = (newStatus: LeadStatus) => {
    const updated = updateLead(lead.id, { status: newStatus });
    if (updated) {
      setLead(updated);
      setActivities(getActivitiesByLeadId(leadId));
      setIsEditingStatus(false);
    }
  };

  const handleOwnerChange = (newOwner: string) => {
    const updated = updateLead(lead.id, { owner: newOwner });
    if (updated) {
      setLead(updated);
      setIsEditingOwner(false);
    }
  };

  const handleAddActivity = (type: ActivityType, message: string) => {
    addActivity({
      leadId: lead.id,
      type,
      message,
      createdBy: lead.owner,
    });
    setActivities(getActivitiesByLeadId(leadId));
  };

  const handleAddNote = (body: string) => {
    addNote({
      leadId: lead.id,
      body,
      createdBy: lead.owner,
    });
    setNotes(getNotesByLeadId(leadId));
  };

  const handleConvertToApplication = () => {
    if (confirm(`Convert lead "${lead.name}" to application?`)) {
      const draft = convertLeadToApplication(lead.id);
      alert(`Lead converted! Application draft created: ${draft.id}`);
      router.push(`/en/admissions/applications`);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <User className="w-4 h-4" /> },
    {
      id: "activity",
      label: "Activity Log",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    { id: "notes", label: "Notes", icon: <Tag className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/en/admissions/leads")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
          <p className="text-sm text-gray-500">Lead ID: {lead.id}</p>
        </div>
        <LeadStatusBadge status={lead.status} size="md" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleConvertToApplication}
            className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Convert to Application
          </button>
          <button
            onClick={() => setIsEditingStatus(true)}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Change Status
          </button>
          <button
            onClick={() => setIsEditingOwner(true)}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Reassign Owner
          </button>
        </div>
      </div>

      {/* Status Change Modal */}
      {isEditingStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Change Status
            </h3>
            <div className="space-y-2">
              {(["New", "Contacted"] as LeadStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                    lead.status === status
                      ? "bg-[#036b80] text-white"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-900"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsEditingStatus(false)}
              className="mt-4 w-full px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Owner Change Modal */}
      {isEditingOwner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Reassign Owner
            </h3>
            <div className="space-y-2">
              {["Sara Ahmed", "Mohammed Khalil", "Fatima Hassan"].map(
                (owner) => (
                  <button
                    key={owner}
                    onClick={() => handleOwnerChange(owner)}
                    className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                      lead.owner === owner
                        ? "bg-[#036b80] text-white"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-900"
                    }`}
                  >
                    {owner}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() => setIsEditingOwner(false)}
              className="mt-4 w-full px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 pt-4">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div className="px-6 py-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {lead.phone}
                    </p>
                  </div>
                  {lead.email && (
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Lead Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Channel</p>
                    <p className="text-sm font-medium text-gray-900">
                      {lead.channel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <UserCircle className="w-3 h-3" /> Owner
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {lead.owner}
                    </p>
                  </div>
                  {lead.gradeInterest && (
                    <div>
                      <p className="text-xs text-gray-500">Grade Interest</p>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.gradeInterest}
                      </p>
                    </div>
                  )}
                  {lead.source && (
                    <div>
                      <p className="text-xs text-gray-500">Source</p>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.source}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Created
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(lead.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Additional Notes
                  </h3>
                  <p className="text-sm text-gray-700">{lead.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <ActivityLog
              activities={activities}
              onAddActivity={handleAddActivity}
            />
          )}

          {activeTab === "notes" && (
            <NotesPanel notes={notes} onAddNote={handleAddNote} />
          )}
        </div>
      </div>
    </div>
  );
}
