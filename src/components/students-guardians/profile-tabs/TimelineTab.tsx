// FILE: src/components/students-guardians/profile-tabs/TimelineTab.tsx

"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  MessageSquare,
  GraduationCap,
  FileText,
  Filter,
} from "lucide-react";
import { Student } from "@/types/students";

interface TimelineTabProps {
  student: Student;
}

// Mock timeline events
const mockTimelineEvents = [
  {
    id: "1",
    type: "grade",
    title: "Math Quiz Published",
    description: "Scored 88% on Algebra quiz",
    date: "2024-02-10T10:30:00Z",
    icon: GraduationCap,
    color: "blue",
  },
  {
    id: "2",
    type: "reinforcement",
    title: "Positive Behavior Point",
    description: "Excellent performance in Math quiz (+10 points)",
    date: "2024-02-10T09:00:00Z",
    icon: Award,
    color: "green",
  },
  {
    id: "3",
    type: "absence",
    title: "Absent",
    description: "Reason: Sick",
    date: "2024-02-06T08:00:00Z",
    icon: Calendar,
    color: "red",
  },
  {
    id: "4",
    type: "note",
    title: "Teacher Note Added",
    description: "Student was very helpful to classmates during group project",
    date: "2024-02-08T14:20:00Z",
    icon: MessageSquare,
    color: "purple",
  },
  {
    id: "5",
    type: "late",
    title: "Late Arrival",
    description: "15 minutes late - Traffic",
    date: "2024-02-08T08:15:00Z",
    icon: Clock,
    color: "yellow",
  },
  {
    id: "6",
    type: "incident",
    title: "Behavior Incident",
    description: "Late to class - Verbal warning given",
    date: "2024-02-06T09:00:00Z",
    icon: AlertTriangle,
    color: "orange",
  },
  {
    id: "7",
    type: "grade",
    title: "Science Lab Report",
    description: "Scored 92% on lab report",
    date: "2024-02-05T11:00:00Z",
    icon: GraduationCap,
    color: "blue",
  },
  {
    id: "8",
    type: "reinforcement",
    title: "Helping Others",
    description: "Helped classmate with homework (+5 points)",
    date: "2024-02-08T13:30:00Z",
    icon: Award,
    color: "green",
  },
  {
    id: "9",
    type: "note",
    title: "Parent Meeting Scheduled",
    description: "Meeting scheduled for next week to discuss progress",
    date: "2024-02-05T10:00:00Z",
    icon: MessageSquare,
    color: "purple",
  },
  {
    id: "10",
    type: "grade",
    title: "English Essay",
    description: "Scored 85% on persuasive essay",
    date: "2024-02-03T14:00:00Z",
    icon: GraduationCap,
    color: "blue",
  },
];

export default function TimelineTab({ student }: TimelineTabProps) {
  const [events] = useState(mockTimelineEvents);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = events.filter((event) => {
    if (typeFilter === "all") return true;
    return event.type === typeFilter;
  });

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> =
      {
        blue: {
          bg: "bg-blue-100",
          border: "border-blue-500",
          text: "text-blue-700",
        },
        green: {
          bg: "bg-green-100",
          border: "border-green-500",
          text: "text-green-700",
        },
        red: {
          bg: "bg-red-100",
          border: "border-red-500",
          text: "text-red-700",
        },
        yellow: {
          bg: "bg-yellow-100",
          border: "border-yellow-500",
          text: "text-yellow-700",
        },
        orange: {
          bg: "bg-orange-100",
          border: "border-orange-500",
          text: "text-orange-700",
        },
        purple: {
          bg: "bg-purple-100",
          border: "border-purple-500",
          text: "text-purple-700",
        },
      };

    return colors[color] || colors.blue;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 24) {
      if (diffInHours < 1) return "Just now";
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Activity Timeline</h2>
          <p className="text-sm text-gray-500 mt-1">
            Chronological view of all student events
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showFilters
              ? "bg-[#036b80] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-64 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
          >
            <option value="all">All Events</option>
            <option value="grade">Grades</option>
            <option value="reinforcement">Positive Reinforcement</option>
            <option value="incident">Incidents</option>
            <option value="absence">Absences</option>
            <option value="late">Late Arrivals</option>
            <option value="note">Notes</option>
          </select>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <GraduationCap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 mb-1">Grades</p>
          <p className="text-lg font-bold text-gray-900">
            {events.filter((e) => e.type === "grade").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <Award className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 mb-1">Points</p>
          <p className="text-lg font-bold text-gray-900">
            {events.filter((e) => e.type === "reinforcement").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 mb-1">Incidents</p>
          <p className="text-lg font-bold text-gray-900">
            {events.filter((e) => e.type === "incident").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <Calendar className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 mb-1">Absences</p>
          <p className="text-lg font-bold text-gray-900">
            {events.filter((e) => e.type === "absence").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 mb-1">Late</p>
          <p className="text-lg font-bold text-gray-900">
            {events.filter((e) => e.type === "late").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <MessageSquare className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 mb-1">Notes</p>
          <p className="text-lg font-bold text-gray-900">
            {events.filter((e) => e.type === "note").length}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No events match your filters</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Events */}
            <div className="space-y-6">
              {filteredEvents.map((event) => {
                const Icon = event.icon;
                const colors = getColorClasses(event.color);

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 border-white ${colors.bg} shrink-0`}
                    >
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {event.title}
                          </h4>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {formatDate(event.date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
