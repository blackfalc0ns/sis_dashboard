"use client";

import { useState, useEffect } from "react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { AssignmentQuestion, QuestionOption } from "@/features/academics/curriculum/services/curriculumService";

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

// Sortable Option Row Component
function SortableOptionRow({
  option,
  isMCQSingle,
  isReadOnly,
  canMoveUp,
  canMoveDown,
  onTextChange,
  onCorrectChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  errors,
  t,
}: {
  option: QuestionOption;
  isMCQSingle: boolean;
  isReadOnly: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onTextChange: (id: string, ar: string, en: string) => void;
  onCorrectChange: (id: string, checked: boolean) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  errors?: OptionErrors;
  t: (key: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-border rounded-lg p-3 bg-white ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        {!isReadOnly && (
          <button
            {...attributes}
            {...listeners}
            className="mt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            aria-label={t("reorder_option")}
          >
            <GripVertical className="w-5 h-5" />
          </button>
        )}

        {/* Correct Selector */}
        <div className="mt-2">
          {isMCQSingle ? (
            <input
              type="radio"
              name={`correct-option-${option.id}`}
              checked={option.isCorrect}
              onChange={() => onCorrectChange(option.id, true)}
              disabled={isReadOnly}
              className="w-4 h-4"
            />
          ) : (
            <input
              type="checkbox"
              checked={option.isCorrect}
              onChange={(e) => onCorrectChange(option.id, e.target.checked)}
              disabled={isReadOnly}
              className="w-4 h-4"
            />
          )}
        </div>

        {/* Option Text Inputs */}
        <div className="flex-1 space-y-2">
          <Input
            value={option.textAr}
            onChange={(e) => onTextChange(option.id, e.target.value, option.textEn)}
            placeholder={`${t("option_text")} (عربي)`}
            disabled={isReadOnly}
            error={errors?.ar}
          />
          <Input
            value={option.textEn}
            onChange={(e) => onTextChange(option.id, option.textAr, e.target.value)}
            placeholder={`${t("option_text")} (English)`}
            disabled={isReadOnly}
            error={errors?.en}
          />
        </div>

        {/* Up/Down Buttons */}
        {!isReadOnly && (
          <div className="flex flex-col gap-1 mt-1">
            <button
              onClick={() => onMoveUp(option.id)}
              disabled={!canMoveUp}
              className={`p-1 rounded ${
                canMoveUp
                  ? "text-gray-600 hover:bg-gray-100"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              aria-label={t("move_up")}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMoveDown(option.id)}
              disabled={!canMoveDown}
              className={`p-1 rounded ${
                canMoveDown
                  ? "text-gray-600 hover:bg-gray-100"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              aria-label={t("move_down")}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Remove Button */}
        {!isReadOnly && (
          <button
            onClick={() => onRemove(option.id)}
            className="mt-2 p-1 text-red-600 hover:bg-red-50 rounded"
            aria-label={t("remove_option")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function QuestionEditor({
  question,
  onChange,
  isReadOnly,
  validationErrors,
}: QuestionEditorProps) {
  const t = useTranslations("academics.curriculum.questions");
  const tValidation = useTranslations("validation");

  const [questionTextAr, setQuestionTextAr] = useState(question.questionTextAr);
  const [questionTextEn, setQuestionTextEn] = useState(question.questionTextEn);
  const [questionType, setQuestionType] = useState(question.questionType);
  const [points, setPoints] = useState(question.points);
  const [options, setOptions] = useState<QuestionOption[]>(question.options || []);
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer ?? true);
  const [sampleAnswerAr, setSampleAnswerAr] = useState(question.sampleAnswerAr || "");
  const [sampleAnswerEn, setSampleAnswerEn] = useState(question.sampleAnswerEn || "");

  // DnD sensors
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

  // Sync with prop changes when question changes
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    setQuestionTextAr(question.questionTextAr);
    setQuestionTextEn(question.questionTextEn);
    setQuestionType(question.questionType);
    setPoints(question.points);
    setOptions(question.options || []);
    setCorrectAnswer(question.correctAnswer ?? true);
    setSampleAnswerAr(question.sampleAnswerAr || "");
    setSampleAnswerEn(question.sampleAnswerEn || "");
  }, [question.id]); // Reset only when switching to a different question
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleTypeChange = (newType: AssignmentQuestion["questionType"]) => {
    const oldType = questionType;
    setQuestionType(newType);

    // Initialize options for MCQ types
    let newOptions = options;
    if (
      (newType === "MCQ_SINGLE" || newType === "MCQ_MULTI") &&
      oldType !== "MCQ_SINGLE" &&
      oldType !== "MCQ_MULTI"
    ) {
      if (options.length === 0) {
        newOptions = [
          { id: `opt-${Date.now()}-1`, textAr: "", textEn: "", isCorrect: false, order: 1 },
          { id: `opt-${Date.now()}-2`, textAr: "", textEn: "", isCorrect: false, order: 2 },
        ];
        setOptions(newOptions);
      }
    } else if (newType !== "MCQ_SINGLE" && newType !== "MCQ_MULTI") {
      newOptions = [];
      setOptions([]);
    }

    // Notify parent immediately
    onChange({
      questionTextAr,
      questionTextEn,
      questionType: newType,
      points,
      options: (newType === "MCQ_SINGLE" || newType === "MCQ_MULTI") ? newOptions : undefined,
      correctAnswer: newType === "TRUE_FALSE" ? correctAnswer : undefined,
      sampleAnswerAr: newType === "SHORT_ANSWER" && sampleAnswerAr.trim() ? sampleAnswerAr.trim() : undefined,
      sampleAnswerEn: newType === "SHORT_ANSWER" && sampleAnswerEn.trim() ? sampleAnswerEn.trim() : undefined,
    });
  };

  const addOption = () => {
    const maxOrder = options.reduce((max, o) => Math.max(max, o.order), 0);
    const newOptions = [
      ...options,
      {
        id: `opt-${Date.now()}-${Math.random()}`,
        textAr: "",
        textEn: "",
        isCorrect: false,
        order: maxOrder + 1,
      },
    ];
    setOptions(newOptions);
    onChange({ options: newOptions });
  };

  const removeOption = (id: string) => {
    const newOptions = options.filter((o) => o.id !== id);
    setOptions(newOptions);
    onChange({ options: newOptions });
  };

  const updateOptionText = (id: string, ar: string, en: string) => {
    const newOptions = options.map((o) => (o.id === id ? { ...o, textAr: ar, textEn: en } : o));
    setOptions(newOptions);
    onChange({ options: newOptions });
  };

  // Validate individual option
  const validateOption = (option: QuestionOption): OptionErrors => {
    const errors: OptionErrors = {};
    
    if (!option.textAr?.trim()) {
      errors.ar = tValidation("required_ar");
    }
    
    if (!option.textEn?.trim()) {
      errors.en = tValidation("required_en");
    }
    
    // Check if AR == EN
    if (option.textAr?.trim() && option.textEn?.trim()) {
      if (option.textAr.trim().toLowerCase() === option.textEn.trim().toLowerCase()) {
        errors.ar = tValidation("arEnMustDiffer");
        errors.en = tValidation("arEnMustDiffer");
      }
    }
    
    return errors;
  };

  const updateOptionCorrect = (id: string, checked: boolean) => {
    let newOptions;
    if (questionType === "MCQ_SINGLE") {
      newOptions = options.map((o) => ({ ...o, isCorrect: o.id === id ? checked : false }));
    } else {
      newOptions = options.map((o) => (o.id === id ? { ...o, isCorrect: checked } : o));
    }
    setOptions(newOptions);
    onChange({ options: newOptions });
  };

  const moveOptionUp = (id: string) => {
    const index = options.findIndex((o) => o.id === id);
    if (index > 0) {
      const newOptions = arrayMove(options, index, index - 1).map((o, i) => ({ ...o, order: i + 1 }));
      setOptions(newOptions);
      onChange({ options: newOptions });
    }
  };

  const moveOptionDown = (id: string) => {
    const index = options.findIndex((o) => o.id === id);
    if (index < options.length - 1) {
      const newOptions = arrayMove(options, index, index + 1).map((o, i) => ({ ...o, order: i + 1 }));
      setOptions(newOptions);
      onChange({ options: newOptions });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex((o) => o.id === active.id);
      const newIndex = options.findIndex((o) => o.id === over.id);

      const newOptions = arrayMove(options, oldIndex, newIndex).map((o, i) => ({ ...o, order: i + 1 }));
      setOptions(newOptions);
      onChange({ options: newOptions });
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

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <BilingualTextField
            label={t("question_text")}
            value={{ ar: questionTextAr, en: questionTextEn }}
            onChange={(value) => {
              setQuestionTextAr(value.ar);
              setQuestionTextEn(value.en);
              onChange({
                questionTextAr: value.ar,
                questionTextEn: value.en,
              });
            }}
            requiredAr
            requiredEn
            disabled={isReadOnly}
            placeholder={{
              ar: "أدخل نص السؤال بالعربية",
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
              onChange={(e) => {
                const newPoints = Number(e.target.value);
                setPoints(newPoints);
                onChange({ points: newPoints });
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

        {/* Answers Section */}
        <div className="border-t pt-6">
          <label className="text-sm font-medium block mb-4">
            {t("answers")} *
          </label>

          {/* MCQ Options Editor */}
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
                  items={options.map((o) => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <SortableOptionRow
                        key={option.id}
                        option={option}
                        isMCQSingle={questionType === "MCQ_SINGLE"}
                        isReadOnly={isReadOnly}
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

              {(validationErrors?.options) && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                  <AlertCircle className="w-3 h-3" />
                  <span>{validationErrors.options}</span>
                </div>
              )}

              {(validationErrors?.correctAnswer) && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                  <AlertCircle className="w-3 h-3" />
                  <span>{validationErrors.correctAnswer}</span>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {questionType === "MCQ_SINGLE"
                  ? t("correct_answer") + ": " + tValidation("selectCorrectSingle")
                  : t("correct_answer") + ": " + tValidation("selectCorrectMulti")}
              </p>
            </div>
          )}

          {/* TRUE_FALSE Selector */}
          {questionType === "TRUE_FALSE" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">{t("correct_answer")}</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="true-false"
                    checked={correctAnswer === true}
                    onChange={() => {
                      setCorrectAnswer(true);
                      onChange({ correctAnswer: true });
                    }}
                    disabled={isReadOnly}
                    className="w-4 h-4"
                  />
                  <span>{t("true")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="true-false"
                    checked={correctAnswer === false}
                    onChange={() => {
                      setCorrectAnswer(false);
                      onChange({ correctAnswer: false });
                    }}
                    disabled={isReadOnly}
                    className="w-4 h-4"
                  />
                  <span>{t("false")}</span>
                </label>
              </div>
            </div>
          )}

          {/* SHORT_ANSWER Sample Answer */}
          {questionType === "SHORT_ANSWER" && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                {t("manual_grading_hint")}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-600">{t("sample_answer")}</label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                    {t("sample_answer")} (عربي)
                  </label>
                  <textarea
                    value={sampleAnswerAr}
                    onChange={(e) => {
                      setSampleAnswerAr(e.target.value);
                      onChange({
                        sampleAnswerAr: e.target.value.trim() || undefined,
                      });
                    }}
                    placeholder="إجابة نموذجية (اختياري)"
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
                    onChange={(e) => {
                      setSampleAnswerEn(e.target.value);
                      onChange({
                        sampleAnswerEn: e.target.value.trim() || undefined,
                      });
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

          {/* ESSAY - No answer configuration needed */}
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
