// FILE: src/components/admissions/InterviewRatingModal.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Star } from "lucide-react";
import { Interview } from "@/types/admissions";

interface InterviewRatingModalProps {
  interview: Interview & { studentName: string };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (interviewId: string, rating: number, notes?: string) => void;
}

export default function InterviewRatingModal({
  interview,
  isOpen,
  onClose,
  onSubmit,
}: InterviewRatingModalProps) {
  const t = useTranslations("admissions.interview_rating_modal");
  const [rating, setRating] = useState<number>(interview.rating || 0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>(interview.notes || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = t("errors.rating_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit(interview.id, rating, notes.trim() || undefined);
    onClose();
  };

  const ratingLabels = [
    {
      value: 1,
      label: t("rating_labels.poor"),
      description: t("rating_descriptions.poor"),
    },
    {
      value: 2,
      label: t("rating_labels.below_average"),
      description: t("rating_descriptions.below_average"),
    },
    {
      value: 3,
      label: t("rating_labels.average"),
      description: t("rating_descriptions.average"),
    },
    {
      value: 4,
      label: t("rating_labels.good"),
      description: t("rating_descriptions.good"),
    },
    {
      value: 5,
      label: t("rating_labels.excellent"),
      description: t("rating_descriptions.excellent"),
    },
  ];

  const getRatingColor = (value: number) => {
    if (value <= 2) return "text-red-500";
    if (value === 3) return "text-yellow-500";
    if (value === 4) return "text-blue-500";
    return "text-green-500";
  };

  const currentLabel = ratingLabels.find(
    (r) => r.value === (hoveredRating || rating),
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#036b80] to-[#024d5c] text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{t("title")}</h2>
              <p className="text-sm text-white/80 mt-1">
                {t("subtitle", { studentName: interview.studentName })}
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
          {/* Interview Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{t("interviewer")}:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {interview.interviewer}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{t("location")}:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {interview.location}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{t("date")}:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {new Date(interview.date).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{t("time")}:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {interview.time}
                </span>
              </div>
            </div>
          </div>

          {/* Rating Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t("overall_rating")} <span className="text-red-500">*</span>
            </label>

            {/* Star Rating */}
            <div className="flex items-center justify-center gap-3 p-6 bg-gray-50 rounded-lg">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-12 h-12 ${
                      value <= (hoveredRating || rating)
                        ? getRatingColor(value)
                        : "text-gray-300"
                    }`}
                    fill={
                      value <= (hoveredRating || rating)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
              ))}
            </div>

            {/* Rating Label */}
            {currentLabel && (
              <div className="mt-3 text-center">
                <div
                  className={`text-xl font-bold ${getRatingColor(currentLabel.value)}`}
                >
                  {currentLabel.label}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {currentLabel.description}
                </div>
              </div>
            )}

            {errors.rating && (
              <p className="text-red-500 text-sm mt-2 text-center">
                {errors.rating}
              </p>
            )}
          </div>

          {/* Rating Scale Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              {t("rating_guide")}
            </h4>
            <div className="space-y-1 text-xs text-blue-800">
              {ratingLabels.map((item) => (
                <div key={item.value} className="flex items-start gap-2">
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <Star className="w-3 h-3" fill="currentColor" />
                    <span className="font-semibold">
                      {t("star_count", { count: item.value })}:
                    </span>
                  </div>
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("interview_notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent resize-none"
              placeholder={t("notes_placeholder")}
            />
            <p className="text-xs text-gray-500 mt-1">{t("notes_help")}</p>
          </div>

          {/* Quick Assessment Checklist */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              {t("assessment_areas")}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>✓ {t("areas.communication")}</div>
              <div>✓ {t("areas.academic_interest")}</div>
              <div>✓ {t("areas.motivation")}</div>
              <div>✓ {t("areas.social_skills")}</div>
              <div>✓ {t("areas.maturity")}</div>
              <div>✓ {t("areas.parent_engagement")}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium transition-colors"
            >
              {t("save_rating")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
