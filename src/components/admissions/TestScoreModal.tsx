// FILE: src/components/admissions/TestScoreModal.tsx

"use client";

import { useState } from "react";
import { X, CheckCircle, XCircle } from "lucide-react";
import { Test } from "@/types/admissions";

interface TestScoreModalProps {
  test: Test & { studentName: string };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    testId: string,
    score: number,
    maxScore: number,
    status: "completed" | "failed",
    notes?: string,
  ) => void;
}

export default function TestScoreModal({
  test,
  isOpen,
  onClose,
  onSubmit,
}: TestScoreModalProps) {
  const [score, setScore] = useState<string>(test.score?.toString() || "");
  const [maxScore, setMaxScore] = useState<string>(
    (test.maxScore || 100).toString(),
  );
  const [status, setStatus] = useState<"completed" | "failed">(
    test.status === "failed" ? "failed" : "completed",
  );
  const [notes, setNotes] = useState<string>(test.notes || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!score.trim()) {
      newErrors.score = "Score is required";
    } else {
      const scoreNum = parseFloat(score);
      if (isNaN(scoreNum)) {
        newErrors.score = "Score must be a number";
      } else if (scoreNum < 0) {
        newErrors.score = "Score cannot be negative";
      } else {
        const maxScoreNum = parseFloat(maxScore);
        if (!isNaN(maxScoreNum) && scoreNum > maxScoreNum) {
          newErrors.score = `Score cannot exceed ${maxScore}`;
        }
      }
    }

    if (!maxScore.trim()) {
      newErrors.maxScore = "Max score is required";
    } else {
      const maxScoreNum = parseFloat(maxScore);
      if (isNaN(maxScoreNum)) {
        newErrors.maxScore = "Max score must be a number";
      } else if (maxScoreNum <= 0) {
        newErrors.maxScore = "Max score must be greater than 0";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const scoreNum = parseFloat(score);
    const maxScoreNum = parseFloat(maxScore);

    onSubmit(test.id, scoreNum, maxScoreNum, status, notes.trim() || undefined);
    onClose();
  };

  const percentage =
    score &&
    maxScore &&
    !isNaN(parseFloat(score)) &&
    !isNaN(parseFloat(maxScore))
      ? ((parseFloat(score) / parseFloat(maxScore)) * 100).toFixed(1)
      : "0";

  const getScoreColor = () => {
    const pct = parseFloat(percentage);
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#036b80] to-[#024d5c] text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Enter Test Score</h2>
              <p className="text-sm text-white/80 mt-1">
                Record the test results for {test.studentName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Test Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Test Type:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {test.type}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Subject:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {test.subject}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {new Date(test.date).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {test.time}
                </span>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Test Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("completed")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  status === "completed"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle
                    className={`w-6 h-6 ${
                      status === "completed"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="text-left">
                    <div
                      className={`font-semibold ${
                        status === "completed"
                          ? "text-green-900"
                          : "text-gray-700"
                      }`}
                    >
                      Completed
                    </div>
                    <div className="text-xs text-gray-500">
                      Student passed the test
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus("failed")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  status === "failed"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <XCircle
                    className={`w-6 h-6 ${
                      status === "failed" ? "text-red-600" : "text-gray-400"
                    }`}
                  />
                  <div className="text-left">
                    <div
                      className={`font-semibold ${
                        status === "failed" ? "text-red-900" : "text-gray-700"
                      }`}
                    >
                      Failed
                    </div>
                    <div className="text-xs text-gray-500">
                      Student did not pass
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Score Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Test Score <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  min="0"
                  step="0.5"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-lg font-semibold ${
                    errors.score ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter score"
                />
                {errors.score && (
                  <p className="text-red-500 text-xs mt-1">{errors.score}</p>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-400">/</div>
              <div className="w-32">
                <input
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  min="1"
                  step="1"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-lg font-semibold ${
                    errors.maxScore ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Max"
                />
                {errors.maxScore && (
                  <p className="text-red-500 text-xs mt-1">{errors.maxScore}</p>
                )}
              </div>
            </div>

            {/* Percentage Display */}
            {score && !errors.score && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Percentage:</span>
                  <span className={`text-2xl font-bold ${getScoreColor()}`}>
                    {percentage}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      parseFloat(percentage) >= 80
                        ? "bg-green-500"
                        : parseFloat(percentage) >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(parseFloat(percentage), 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent resize-none"
              placeholder="Add any observations or comments about the test..."
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes will be visible to the admissions team
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium transition-colors"
            >
              Save Score
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
