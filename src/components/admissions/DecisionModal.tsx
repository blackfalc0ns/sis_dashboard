// FILE: src/components/admissions/DecisionModal.tsx

"use client";

import React, { useState } from "react";
import { X, CheckCircle, Clock, XCircle } from "lucide-react";
import { Application, DecisionType } from "@/types/admissions";

interface DecisionModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (decision: DecisionType, reason: string, date: string) => void;
}

export default function DecisionModal({
  application,
  isOpen,
  onClose,
  onSubmit,
}: DecisionModalProps) {
  const [decision, setDecision] = useState<DecisionType>("accept");
  const [reason, setReason] = useState("");
  const [decisionDate, setDecisionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [sendNotification, setSendNotification] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(decision, reason, decisionDate);
    onClose();
  };

  const hasCompletedTest = application.tests.some(
    (t) => t.status === "completed",
  );
  const hasCompletedInterview = application.interviews.some(
    (i) => i.status === "completed",
  );
  const hasAllDocuments = application.documents.every(
    (d) => d.status === "complete",
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Make Admission Decision
            </h2>
            <p className="text-sm text-gray-500">
              {application.studentName} - {application.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Evaluation Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Evaluation Summary
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {hasCompletedTest ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm text-gray-700">
                  Test: {hasCompletedTest ? "Completed" : "Not Completed"}
                </span>
                {hasCompletedTest && application.tests[0]?.score && (
                  <span className="text-sm font-medium text-[#036b80]">
                    ({application.tests[0].score}/
                    {application.tests[0].maxScore})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasCompletedInterview ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm text-gray-700">
                  Interview:{" "}
                  {hasCompletedInterview ? "Completed" : "Not Completed"}
                </span>
                {hasCompletedInterview && application.interviews[0]?.rating && (
                  <span className="text-sm font-medium text-[#036b80]">
                    (Rating: {application.interviews[0].rating}/5)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasAllDocuments ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm text-gray-700">
                  Documents: {hasAllDocuments ? "Complete" : "Incomplete"}
                </span>
              </div>
            </div>
          </div>

          {/* Decision Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Decision *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDecision("accept")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  decision === "accept"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <CheckCircle
                  className={`w-6 h-6 mx-auto mb-2 ${
                    decision === "accept" ? "text-emerald-600" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    decision === "accept" ? "text-emerald-900" : "text-gray-700"
                  }`}
                >
                  Accept
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDecision("waitlist")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  decision === "waitlist"
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Clock
                  className={`w-6 h-6 mx-auto mb-2 ${
                    decision === "waitlist" ? "text-amber-600" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    decision === "waitlist" ? "text-amber-900" : "text-gray-700"
                  }`}
                >
                  Waitlist
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDecision("reject")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  decision === "reject"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <XCircle
                  className={`w-6 h-6 mx-auto mb-2 ${
                    decision === "reject" ? "text-red-600" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    decision === "reject" ? "text-red-900" : "text-gray-700"
                  }`}
                >
                  Reject
                </p>
              </button>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm resize-none"
              placeholder="Provide a detailed reason for this decision..."
              required
            />
          </div>

          {/* Decision Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Decision Date *
            </label>
            <input
              type="date"
              value={decisionDate}
              onChange={(e) => setDecisionDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
              required
            />
          </div>

          {/* Send Notification */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="w-4 h-4 text-[#036b80] border-gray-300 rounded focus:ring-[#036b80]"
              />
              <span className="text-sm text-gray-700">
                Email parents immediately
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium text-sm transition-colors"
            >
              Submit Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
