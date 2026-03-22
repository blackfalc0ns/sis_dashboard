"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Drawer } from "@mui/material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";
import { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import { useQuestionFormState } from "@/features/academics/curriculum/hooks/useQuestionFormState";
import QuestionOptionRow, { QuestionOptionRowErrors } from "./QuestionOptionRow";

interface QuestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Partial<AssignmentQuestion>) => Promise<void>;
  question?: AssignmentQuestion | null;
  isReadOnly: boolean;
}

export default function QuestionDrawer({
  isOpen,
  onClose,
  onSave,
  question,
  isReadOnly,
}: QuestionDrawerProps) {
  const t = useTranslations("academics.curriculum.questions");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [errors, setErrors] = useState<{
    ar?: string;
    en?: string;
    points?: string;
    options?: Record<string, QuestionOptionRowErrors>;
    sampleAr?: string;
    sampleEn?: string;
    general?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  const {
    questionTextAr,
    questionTextEn,
    questionType,
    points,
    options,
    correctAnswer,
    sampleAnswerAr,
    sampleAnswerEn,
    setQuestionText,
    setPointsValue,
    handleTypeChange,
    addOption,
    removeOption,
    updateOptionText,
    updateOptionCorrect,
    moveOptionUp,
    moveOptionDown,
    reorderOptions,
    setTrueFalseAnswer,
    setSampleAnswerArValue,
    setSampleAnswerEnValue,
    buildPayload,
  } = useQuestionFormState({
    question,
    isOpen,
    resetKey: question?.id ?? null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isOpen) {
      setErrors({});
    }
  }, [isOpen, question?.id]);

  const handleOptionTextChange = (id: string, ar: string, en: string) => {
    updateOptionText(id, ar, en);
    if (errors.options?.[id]) {
      const nextOptionErrors = { ...errors.options };
      delete nextOptionErrors[id];
      setErrors({ ...errors, options: nextOptionErrors });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderOptions(String(active.id), String(over.id));
    }
  };

  const normalizeText = (text: string): string => text.trim().toLowerCase().replace(/\s+/g, " ");

  const validate = (): boolean => {
    const nextErrors: typeof errors = {};

    if (!questionTextAr.trim()) nextErrors.ar = tValidation("required_ar");
    if (!questionTextEn.trim()) nextErrors.en = tValidation("required_en");

    if (questionTextAr.trim() && questionTextEn.trim()) {
      const arEnErrors = validateArEnDifferent(questionTextAr, questionTextEn);
      if (arEnErrors.arError) nextErrors.ar = tValidation("arEnMustDiffer");
      if (arEnErrors.enError) nextErrors.en = tValidation("arEnMustDiffer");
    }

    if (points < 0) {
      nextErrors.points = "Points must be 0 or greater";
    }

    if (questionType === "MCQ_SINGLE" || questionType === "MCQ_MULTI") {
      if (options.length < 2) {
        nextErrors.general = tValidation("minTwoOptions");
      }

      const optionErrors: Record<string, QuestionOptionRowErrors> = {};
      const normalizedAr = new Set<string>();
      const normalizedEn = new Set<string>();

      options.forEach((option) => {
        const optionError: QuestionOptionRowErrors = {};

        if (!option.textAr.trim()) optionError.ar = tValidation("required_ar");
        if (!option.textEn.trim()) optionError.en = tValidation("required_en");

        if (option.textAr.trim() && option.textEn.trim()) {
          const arEnErrors = validateArEnDifferent(option.textAr, option.textEn);
          if (arEnErrors.arError) optionError.ar = tValidation("arEnMustDiffer");
          if (arEnErrors.enError) optionError.en = tValidation("arEnMustDiffer");
        }

        if (option.textAr.trim()) {
          const normalized = normalizeText(option.textAr);
          if (normalizedAr.has(normalized)) {
            optionError.ar = tValidation("duplicateOptionAr");
          } else {
            normalizedAr.add(normalized);
          }
        }

        if (option.textEn.trim()) {
          const normalized = normalizeText(option.textEn);
          if (normalizedEn.has(normalized)) {
            optionError.en = tValidation("duplicateOptionEn");
          } else {
            normalizedEn.add(normalized);
          }
        }

        if (Object.keys(optionError).length > 0) {
          optionErrors[option.id] = optionError;
        }
      });

      if (Object.keys(optionErrors).length > 0) {
        nextErrors.options = optionErrors;
      }

      const correctCount = options.filter((option) => option.isCorrect).length;
      if (questionType === "MCQ_SINGLE" && correctCount !== 1) {
        nextErrors.general = tValidation("selectCorrectSingle");
      } else if (questionType === "MCQ_MULTI" && correctCount < 1) {
        nextErrors.general = tValidation("selectCorrectMulti");
      }
    }

    if (questionType === "SHORT_ANSWER") {
      const bothFilled = sampleAnswerAr.trim() && sampleAnswerEn.trim();
      if (bothFilled) {
        const arEnErrors = validateArEnDifferent(sampleAnswerAr, sampleAnswerEn);
        if (arEnErrors.arError) nextErrors.sampleAr = tValidation("arEnMustDiffer");
        if (arEnErrors.enError) nextErrors.sampleEn = tValidation("arEnMustDiffer");
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave(buildPayload());
      onClose();
    } catch (error) {
      console.error("Failed to save question:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const questionTypeOptions = [
    { value: "MCQ_SINGLE", label: t("question_types.MCQ_SINGLE") },
    { value: "MCQ_MULTI", label: t("question_types.MCQ_MULTI") },
    { value: "TRUE_FALSE", label: t("question_types.TRUE_FALSE") },
    { value: "SHORT_ANSWER", label: t("question_types.SHORT_ANSWER") },
    { value: "ESSAY", label: t("question_types.ESSAY") },
  ];

  const isMCQ = questionType === "MCQ_SINGLE" || questionType === "MCQ_MULTI";
  const canRemoveOption = options.length > 2;
  const radioGroupName = `drawer-correct-option-${question?.id ?? "new"}`;
  const trueFalseGroupName = `drawer-true-false-${question?.id ?? "new"}`;

  return (
    <Drawer
      anchor={isRTL ? "left" : "right"}
      open={isOpen}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: "100%",
            maxWidth: { xs: "100%", sm: 600, md: 700 },
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-gray-900">
          {question ? t("edit_question") : t("add_question")}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-4">
          <BilingualTextField
            label={t("question_text")}
            value={{ ar: questionTextAr, en: questionTextEn }}
            onChange={(value) => {
              setQuestionText(value);
              setErrors({ ...errors, ar: undefined, en: undefined });
            }}
            requiredAr
            requiredEn
            errors={errors}
            disabled={isReadOnly}
            placeholder={{
              ar: "\u0623\u062f\u062e\u0644 \u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
              en: "Enter question text in English",
            }}
          />

          <Select
            label={t("question_type")}
            value={questionType}
            onChange={(value) => handleTypeChange(value as AssignmentQuestion["questionType"])}
            options={questionTypeOptions}
            disabled={isReadOnly}
            required
          />

          <Input
            label={t("points")}
            type="number"
            value={points}
            onChange={(event) => {
              setPointsValue(Number(event.target.value));
              setErrors({ ...errors, points: undefined });
            }}
            error={errors.points}
            disabled={isReadOnly}
            min={0}
            placeholder="1"
            required
          />

          <div className="space-y-3">
            <div className="border-t pt-3">
              <label className="text-sm font-medium block mb-3">{t("answers")} *</label>

              {errors.general && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">
                  {errors.general}
                </div>
              )}

              {isMCQ && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">{t("options")}</label>
                    {!isReadOnly && (
                      <Button onClick={addOption} variant="secondary" size="sm">
                        {t("add_option")}
                      </Button>
                    )}
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={options.map((option) => option.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {options.map((option, index) => (
                          <QuestionOptionRow
                            key={option.id}
                            option={option}
                            isMCQSingle={questionType === "MCQ_SINGLE"}
                            isReadOnly={isReadOnly}
                            radioGroupName={radioGroupName}
                            canMoveUp={index > 0}
                            canMoveDown={index < options.length - 1}
                            onTextChange={handleOptionTextChange}
                            onCorrectChange={updateOptionCorrect}
                            onRemove={canRemoveOption ? removeOption : () => {}}
                            onMoveUp={moveOptionUp}
                            onMoveDown={moveOptionDown}
                            errors={errors.options?.[option.id]}
                            t={t}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <p className="text-xs text-gray-500">
                    {questionType === "MCQ_SINGLE"
                      ? `${t("correct_answer")}: ${tValidation("selectCorrectSingle")}`
                      : `${t("correct_answer")}: ${tValidation("selectCorrectMulti")}`}
                  </p>
                </div>
              )}

              {questionType === "TRUE_FALSE" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    {t("correct_answer")}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={trueFalseGroupName}
                        checked={correctAnswer === true}
                        onChange={() => setTrueFalseAnswer(true)}
                        disabled={isReadOnly}
                        className="w-4 h-4"
                      />
                      <span>{t("true")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={trueFalseGroupName}
                        checked={correctAnswer === false}
                        onChange={() => setTrueFalseAnswer(false)}
                        disabled={isReadOnly}
                        className="w-4 h-4"
                      />
                      <span>{t("false")}</span>
                    </label>
                  </div>
                </div>
              )}

              {questionType === "SHORT_ANSWER" && (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                    {t("manual_grading_hint")}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-600">
                      {t("sample_answer")}
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                        {t("sample_answer")} (\u0639\u0631\u0628\u064a)
                      </label>
                      <textarea
                        value={sampleAnswerAr}
                        onChange={(event) => {
                          setSampleAnswerArValue(event.target.value);
                          setErrors({ ...errors, sampleAr: undefined });
                        }}
                        placeholder="\u0625\u062c\u0627\u0628\u0629 \u0646\u0645\u0648\u0630\u062c\u064a\u0629 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)"
                        disabled={isReadOnly}
                        rows={3}
                        dir="rtl"
                        className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${
                          errors.sampleAr
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-200"
                        } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
                      />
                      {errors.sampleAr && (
                        <div className="flex items-start gap-1 mt-1 text-xs text-red-600 text-right">
                          <span>{errors.sampleAr}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("sample_answer")} (English)
                      </label>
                      <textarea
                        value={sampleAnswerEn}
                        onChange={(event) => {
                          setSampleAnswerEnValue(event.target.value);
                          setErrors({ ...errors, sampleEn: undefined });
                        }}
                        placeholder="Sample answer (optional)"
                        disabled={isReadOnly}
                        rows={3}
                        dir="ltr"
                        className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${
                          errors.sampleEn
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-200"
                        } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
                      />
                      {errors.sampleEn && (
                        <div className="flex items-start gap-1 mt-1 text-xs text-red-600">
                          <span>{errors.sampleEn}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0">
        <Button onClick={onClose} variant="secondary" disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="primary" disabled={isReadOnly || isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </Drawer>
  );
}
