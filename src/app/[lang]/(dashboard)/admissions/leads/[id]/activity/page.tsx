"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  getActivitiesByLeadId,
  addActivity,
  getLeadById,
} from "@/api/mockLeadsApi";
import { ActivityType } from "@/features/admissions/types/enums";
import ActivityLog from "@/features/admissions/leads/components/ActivityLog";

export default function LeadActivityPage() {
  const params = useParams();
  const leadId = params.id as string;

  const lead = useMemo(() => getLeadById(leadId), [leadId]);
  const [activities, setActivities] = useState(getActivitiesByLeadId(leadId));

  if (!lead) return null;

  const handleAddActivity = (type: ActivityType, message: string) => {
    addActivity({
      leadId: lead.id,
      type,
      message,
      createdBy: String(lead.owner || "System"),
    });
    setActivities(getActivitiesByLeadId(leadId));
  };

  return (
    <ActivityLog activities={activities} onAddActivity={handleAddActivity} />
  );
}
