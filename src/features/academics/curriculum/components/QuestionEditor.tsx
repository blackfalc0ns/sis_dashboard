"use client";

import { useTranslations } from "next-intl";
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
import { AlertCircle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { AssignmentQuestion, QuestionOption } from "@/features/academics/curriculum/services/curriculumService";
import { useQuestionFormState } from "@/features/academics/curriculum/hooks/useQuestionFormState";
import QuestionOptionRow from "./QuestionOptionRow";

interface QuestionEditorProps {
  question: AssignmentQuestion;
  onChange: (updates: Partial<AssignmentQuestion>) => void;
  isReadOnly: boolean;
  validationErrors?: {
    textAr?: string;
    textEn?: string;
    points?: string;
    options?: string;
    correctAnswer?: string;
  };
}

interface OptionErrors {
  ar?: string;
  en?: string;
}

export default function QuestionEditor({
  question,
  onChange,
  isReadOnly,
  validationErrors,
}: QuestionEditorProps) {
  const t = useTranslations("academics.curriculum.questions");
  const tValidation = useTranslations("validation");

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
  } = useQuestionFormState({
    question,
    resetKey: question.id,
    onChange,
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

  const validateOption = (option: QuestionOption): OptionErrors => {
    const errors: OptionErrors = {};

    if (!option.textAr?.trim()) {
      errors.ar = tValidation("required_ar");
    }

    if (!option.textEn?.trim()) {
      errors.en = tValidation("required_en");
    }

    if (option.textAr?.trim() && option.textEn?.trim()) {
      if (option.textAr.trim().toLowerCase() === option.textEn.trim().toLowerCase()) {
        errors.ar = tValidation("arEnMustDiffer");
        errors.en = tValidation("arEnMustDiffer");
      }
    }

    return errors;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderOptions(String(active.id), String(over.id));
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
  const radioGroupName = `editor-correct-option-${question.id}`;
  const trueFalseGroupName = `editor-true-false-${question.id}`;

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <BilingualTextField
            label={t("question_text")}
            value={{ ar: questionTextAr, en: questionTextEn }}
            onChange={setQuestionText}
            requiredAr
            requiredEn
            disabled={isReadOnly}
            placeholder={{
              ar: "\u0623\u062f\u062e\u0644 \u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
              en: "Enter question text in English",
            }}
          />
          {validationErrors?.textAr && (
            <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
              <AlertCircle className="w-3 h-3" />
              <span>{validationErrors.textAr}</span>
            </div>
          )}
          {validationErrors?.textEn && (
            <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
              <AlertCircle className="w-3 h-3" />
              <span>{validationErrors.textEn}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t("question_type")}
            value={questionType}
            onChange={(value) => handleTypeChange(value as AssignmentQuestion["questionType"])}
            options={questionTypeOptions}
            disabled={isReadOnly}
            required
          />

          <div>
            <Input
              label={t("points")}
              type="number"
              value={points}
              onChange={(event) => {
                setPointsValue(Number(event.target.value));
              }}
              disabled={isReadOnly}
              min={0}
              placeholder="1"
              required
            />
            {validationErrors?.points && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.points}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <label className="text-sm font-medium block mb-4">{t("answers")} *</label>

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
                        onTextChange={updateOptionText}
                        onCorrectChange={updateOptionCorrect}
                        onRemove={canRemoveOption ? removeOption : () => {}}
                        onMoveUp={moveOptionUp}
                        onMoveDown={moveOptionDown}
                        errors={validateOption(option)}
                        t={t}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {validationErrors?.options && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                  <AlertCircle className="w-3 h-3" />
                  <span>{validationErrors.options}</span>
                </div>
              )}

              {validationErrors?.correctAnswer && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                  <AlertCircle className="w-3 h-3" />
                  <span>{validationErrors.correctAnswer}</span>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {questionType === "MCQ_SINGLE"
                  ? `${t("correct_answer")}: ${tValidation("selectCorrectSingle")}`
                  : `${t("correct_answer")}: ${tValidation("selectCorrectMulti")}`}
              </p>
            </div>
          )}

          {questionType === "TRUE_FALSE" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">{t("correct_answer")}</label>
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
                <label className="text-sm font-medium text-gray-600">{t("sample_answer")}</label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                    {t("sample_answer")} (\u0639\u0631\u0628\u064a)
                  </label>
                  <textarea
                    value={sampleAnswerAr}
                    onChange={(event) => {
                      setSampleAnswerArValue(event.target.value);
                    }}
                    placeholder="\u0625\u062c\u0627\u0628\u0629 \u0646\u0645\u0648\u0630\u062c\u064a\u0629 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)"
                    disabled={isReadOnly}
                    rows={3}
                    dir="rtl"
                    className="w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("sample_answer")} (English)
                  </label>
                  <textarea
                    value={sampleAnswerEn}
                    onChange={(event) => {
                      setSampleAnswerEnValue(event.target.value);
                    }}
                    placeholder="Sample answer (optional)"
                    disabled={isReadOnly}
                    rows={3}
                    dir="ltr"
                    className="w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none border-gray-200"
                  />
                </div>
              </div>
            </div>
          )}

          {questionType === "ESSAY" && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
              {t("manual_grading_hint")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
