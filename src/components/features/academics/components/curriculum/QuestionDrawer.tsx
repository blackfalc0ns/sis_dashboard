"use client";

import { useState, useEffect } from "react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";
import { AssignmentQuestion, QuestionOption } from "@/services/academics/curriculumService";

interface QuestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Partial<AssignmentQuestion>) => Promise<void>;
  question?: AssignmentQuestion | null;
  isReadOnly: boolean;
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
              name="correct-option"
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

        {/* Up/Down Buttons (Mobile fallback) */}
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

  const [questionTextAr, setQuestionTextAr] = useState("");
  const [questionTextEn, setQuestionTextEn] = useState("");
  const [questionType, setQuestionType] = useState<AssignmentQuestion["questionType"]>("MCQ_SINGLE");
  const [points, setPoints] = useState<number>(1);
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<boolean>(true); // For TRUE_FALSE
  const [sampleAnswerAr, setSampleAnswerAr] = useState(""); // For SHORT_ANSWER
  const [sampleAnswerEn, setSampleAnswerEn] = useState(""); // For SHORT_ANSWER
  const [errors, setErrors] = useState<{ 
    ar?: string; 
    en?: string; 
    points?: string;
    options?: Record<string, OptionErrors>;
    sampleAr?: string;
    sampleEn?: string;
    general?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  // DnD sensors with press delay for mobile
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
      if (question) {
        setQuestionTextAr(question.questionTextAr);
        setQuestionTextEn(question.questionTextEn);
        setQuestionType(question.questionType);
        setPoints(question.points);
        setOptions(question.options || []);
        setCorrectAnswer(question.correctAnswer ?? true);
        setSampleAnswerAr(question.sampleAnswerAr || "");
        setSampleAnswerEn(question.sampleAnswerEn || "");
      } else {
        setQuestionTextAr("");
        setQuestionTextEn("");
        setQuestionType("MCQ_SINGLE");
        setPoints(1);
        setOptions([]);
        setCorrectAnswer(true);
        setSampleAnswerAr("");
        setSampleAnswerEn("");
      }
      setErrors({});
    }
  }, [isOpen, question]);

  // Handle question type change
  const handleTypeChange = (newType: AssignmentQuestion["questionType"]) => {
    const oldType = questionType;
    setQuestionType(newType);

    // Initialize options for MCQ types
    if ((newType === "MCQ_SINGLE" || newType === "MCQ_MULTI") && 
        (oldType !== "MCQ_SINGLE" && oldType !== "MCQ_MULTI")) {
      // Switching TO MCQ from non-MCQ
      if (options.length === 0) {
        setOptions([
          { id: `opt-${Date.now()}-1`, textAr: "", textEn: "", isCorrect: false, order: 1 },
          { id: `opt-${Date.now()}-2`, textAr: "", textEn: "", isCorrect: false, order: 2 },
        ]);
      }
    } else if (newType !== "MCQ_SINGLE" && newType !== "MCQ_MULTI") {
      // Switching AWAY from MCQ
      setOptions([]);
    } else if (oldType === "MCQ_MULTI" && newType === "MCQ_SINGLE") {
      // Switching from MULTI to SINGLE - keep only first correct
      const correctOptions = options.filter(o => o.isCorrect).sort((a, b) => a.order - b.order);
      if (correctOptions.length > 1) {
        const firstCorrectId = correctOptions[0].id;
        setOptions(options.map(o => ({
          ...o,
          isCorrect: o.id === firstCorrectId
        })));
      }
    }

    // Initialize TRUE_FALSE with default true
    if (newType === "TRUE_FALSE") {
      setCorrectAnswer(true);
    }

    // Clear sample answers when switching away from SHORT_ANSWER
    if (oldType === "SHORT_ANSWER" && newType !== "SHORT_ANSWER") {
      setSampleAnswerAr("");
      setSampleAnswerEn("");
    }
  };

  const addOption = () => {
    const maxOrder = options.reduce((max, o) => Math.max(max, o.order), 0);
    setOptions([
      ...options,
      {
        id: `opt-${Date.now()}-${Math.random()}`,
        textAr: "",
        textEn: "",
        isCorrect: false,
        order: maxOrder + 1,
      },
    ]);
  };

  const removeOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id));
  };

  const updateOptionText = (id: string, ar: string, en: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, textAr: ar, textEn: en } : o)));
    // Clear errors for this option
    if (errors.options?.[id]) {
      const newOptionErrors = { ...errors.options };
      delete newOptionErrors[id];
      setErrors({ ...errors, options: newOptionErrors });
    }
  };

  const updateOptionCorrect = (id: string, checked: boolean) => {
    if (questionType === "MCQ_SINGLE") {
      // Radio behavior - only one can be correct
      setOptions(options.map((o) => ({ ...o, isCorrect: o.id === id ? checked : false })));
    } else {
      // Checkbox behavior - multiple can be correct
      setOptions(options.map((o) => (o.id === id ? { ...o, isCorrect: checked } : o)));
    }
  };

  const moveOptionUp = (id: string) => {
    const index = options.findIndex((o) => o.id === id);
    if (index > 0) {
      const newOptions = arrayMove(options, index, index - 1);
      // Update order values
      setOptions(newOptions.map((o, i) => ({ ...o, order: i + 1 })));
    }
  };

  const moveOptionDown = (id: string) => {
    const index = options.findIndex((o) => o.id === id);
    if (index < options.length - 1) {
      const newOptions = arrayMove(options, index, index + 1);
      // Update order values
      setOptions(newOptions.map((o, i) => ({ ...o, order: i + 1 })));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex((o) => o.id === active.id);
      const newIndex = options.findIndex((o) => o.id === over.id);

      const newOptions = arrayMove(options, oldIndex, newIndex);
      // Update order values
      setOptions(newOptions.map((o, i) => ({ ...o, order: i + 1 })));
    }
  };

  const normalizeText = (text: string): string => {
    return text.trim().toLowerCase().replace(/\s+/g, " ");
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    // Question text validation
    if (!questionTextAr.trim()) newErrors.ar = tValidation("required_ar");
    if (!questionTextEn.trim()) newErrors.en = tValidation("required_en");

    if (questionTextAr.trim() && questionTextEn.trim()) {
      const arEnErrors = validateArEnDifferent(questionTextAr, questionTextEn);
      if (arEnErrors.arError) newErrors.ar = tValidation("arEnMustDiffer");
      if (arEnErrors.enError) newErrors.en = tValidation("arEnMustDiffer");
    }

    // Points validation
    if (points < 0) {
      newErrors.points = "Points must be 0 or greater";
    }

    // MCQ validation
    if (questionType === "MCQ_SINGLE" || questionType === "MCQ_MULTI") {
      if (options.length < 2) {
        newErrors.general = tValidation("minTwoOptions");
      }

      const optionErrors: Record<string, OptionErrors> = {};
      const normalizedAr = new Set<string>();
      const normalizedEn = new Set<string>();

      options.forEach((option) => {
        const errors: OptionErrors = {};

        // Required fields
        if (!option.textAr.trim()) errors.ar = tValidation("required_ar");
        if (!option.textEn.trim()) errors.en = tValidation("required_en");

        // AR != EN
        if (option.textAr.trim() && option.textEn.trim()) {
          const arEnErrors = validateArEnDifferent(option.textAr, option.textEn);
          if (arEnErrors.arError) errors.ar = tValidation("arEnMustDiffer");
          if (arEnErrors.enError) errors.en = tValidation("arEnMustDiffer");
        }

        // Duplicate detection
        if (option.textAr.trim()) {
          const normalized = normalizeText(option.textAr);
          if (normalizedAr.has(normalized)) {
            errors.ar = tValidation("duplicateOptionAr");
          } else {
            normalizedAr.add(normalized);
          }
        }

        if (option.textEn.trim()) {
          const normalized = normalizeText(option.textEn);
          if (normalizedEn.has(normalized)) {
            errors.en = tValidation("duplicateOptionEn");
          } else {
            normalizedEn.add(normalized);
          }
        }

        if (Object.keys(errors).length > 0) {
          optionErrors[option.id] = errors;
        }
      });

      if (Object.keys(optionErrors).length > 0) {
        newErrors.options = optionErrors;
      }

      // Correct answer validation
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (questionType === "MCQ_SINGLE" && correctCount !== 1) {
        newErrors.general = tValidation("selectCorrectSingle");
      } else if (questionType === "MCQ_MULTI" && correctCount < 1) {
        newErrors.general = tValidation("selectCorrectMulti");
      }
    }

    // SHORT_ANSWER validation - AR != EN only if BOTH filled
    if (questionType === "SHORT_ANSWER") {
      const bothFilled = sampleAnswerAr.trim() && sampleAnswerEn.trim();
      if (bothFilled) {
        const arEnErrors = validateArEnDifferent(sampleAnswerAr, sampleAnswerEn);
        if (arEnErrors.arError) newErrors.sampleAr = tValidation("arEnMustDiffer");
        if (arEnErrors.enError) newErrors.sampleEn = tValidation("arEnMustDiffer");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave({
        questionTextAr: questionTextAr.trim(),
        questionTextEn: questionTextEn.trim(),
        questionType,
        points,
        options: (questionType === "MCQ_SINGLE" || questionType === "MCQ_MULTI") 
          ? options.map((o, i) => ({ ...o, order: i + 1 }))
          : undefined,
        correctAnswer: questionType === "TRUE_FALSE" ? correctAnswer : undefined,
        sampleAnswerAr: questionType === "SHORT_ANSWER" && sampleAnswerAr.trim() 
          ? sampleAnswerAr.trim() 
          : undefined,
        sampleAnswerEn: questionType === "SHORT_ANSWER" && sampleAnswerEn.trim() 
          ? sampleAnswerEn.trim() 
          : undefined,
      });
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
      {/* Drawer Header */}
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

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-4">
          <BilingualTextField
            label={t("question_text")}
            value={{ ar: questionTextAr, en: questionTextEn }}
            onChange={(value) => {
              setQuestionTextAr(value.ar);
              setQuestionTextEn(value.en);
              setErrors({ ...errors, ar: undefined, en: undefined });
            }}
            requiredAr
            requiredEn
            errors={errors}
            disabled={isReadOnly}
            placeholder={{
              ar: "أدخل نص السؤال بالعربية",
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
            onChange={(e) => {
              setPoints(Number(e.target.value));
              setErrors({ ...errors, points: undefined });
            }}
            error={errors.points}
            disabled={isReadOnly}
            min={0}
            placeholder="1"
            required
          />

          {/* Answers Section */}
          <div className="space-y-3">
            <div className="border-t pt-3">
              <label className="text-sm font-medium block mb-3">
                {t("answers")} *
              </label>

              {errors.general && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">
                  {errors.general}
                </div>
              )}

              {/* MCQ Options Editor */}
              {isMCQ && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">
                      {t("options")}
                    </label>
                    {!isReadOnly && (
                      <Button
                        onClick={addOption}
                        variant="secondary"
                        size="sm"
                      >
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
                            errors={errors.options?.[option.id]}
                            t={t}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <p className="text-xs text-gray-500">
                    {questionType === "MCQ_SINGLE"
                      ? t("correct_answer") + ": " + tValidation("selectCorrectSingle")
                      : t("correct_answer") + ": " + tValidation("selectCorrectMulti")}
                  </p>
                </div>
              )}

              {/* TRUE_FALSE Selector */}
              {questionType === "TRUE_FALSE" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    {t("correct_answer")}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="true-false"
                        checked={correctAnswer === true}
                        onChange={() => setCorrectAnswer(true)}
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
                        onChange={() => setCorrectAnswer(false)}
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
                    <label className="text-sm font-medium text-gray-600">
                      {t("sample_answer")}
                    </label>
                    
                    {/* Arabic Sample Answer */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                        {t("sample_answer")} (عربي)
                      </label>
                      <textarea
                        value={sampleAnswerAr}
                        onChange={(e) => {
                          setSampleAnswerAr(e.target.value);
                          setErrors({ ...errors, sampleAr: undefined });
                        }}
                        placeholder="إجابة نموذجية (اختياري)"
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

                    {/* English Sample Answer */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("sample_answer")} (English)
                      </label>
                      <textarea
                        value={sampleAnswerEn}
                        onChange={(e) => {
                          setSampleAnswerEn(e.target.value);
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

      {/* Drawer Footer */}
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
