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
import QuestionTypeSpecificFields from "./QuestionTypeSpecificFields";

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
    acceptedAnswers?: string;
    matchingPairs?: string;
    media?: string;
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
    acceptedAnswersAr,
    acceptedAnswersEn,
    matchingPairs,
    mediaMode,
    mediaTitle,
    mediaUrl,
    mediaFileName,
    mediaMimeType,
    mediaSize,
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
    setAcceptedAnswersArValue,
    setAcceptedAnswersEnValue,
    addMatchingPair,
    updateMatchingPair,
    removeMatchingPair,
    moveMatchingPairUp,
    moveMatchingPairDown,
    setMediaModeValue,
    setMediaTitleValue,
    setMediaUrlValue,
    setMediaFileValue,
    clearMedia,
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
    { value: "FILL_IN_BLANK", label: t("question_types.FILL_IN_BLANK") },
    { value: "MATCHING", label: t("question_types.MATCHING") },
    { value: "MEDIA", label: t("question_types.MEDIA") },
  ];

  const isMCQ = questionType === "MCQ_SINGLE" || questionType === "MCQ_MULTI";
  const canRemoveOption = options.length > 2;
  const radioGroupName = `editor-correct-option-${question.id}`;

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <BilingualTextField
            label={t("question_text")}
            value={{ ar: questionTextAr, en: questionTextEn }}
            onChange={setQuestionText}
            requiredAr={questionType !== "MEDIA"}
            requiredEn={questionType !== "MEDIA"}
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
          <label className="text-sm font-medium block mb-4">
            {questionType === "MEDIA" ? t("media") : t("answers")}
            {questionType !== "ESSAY" && questionType !== "SHORT_ANSWER" && questionType !== "MEDIA"
              ? " *"
              : ""}
          </label>

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

          {!isMCQ && (
            <QuestionTypeSpecificFields
              questionId={question.id}
              questionType={questionType}
              isReadOnly={isReadOnly}
              correctAnswer={correctAnswer}
              sampleAnswerAr={sampleAnswerAr}
              sampleAnswerEn={sampleAnswerEn}
              acceptedAnswersAr={acceptedAnswersAr}
              acceptedAnswersEn={acceptedAnswersEn}
              matchingPairs={matchingPairs}
              mediaMode={mediaMode}
              mediaTitle={mediaTitle}
              mediaUrl={mediaUrl}
              mediaFileName={mediaFileName}
              mediaMimeType={mediaMimeType}
              mediaSize={mediaSize}
              setTrueFalseAnswer={setTrueFalseAnswer}
              setSampleAnswerArValue={setSampleAnswerArValue}
              setSampleAnswerEnValue={setSampleAnswerEnValue}
              setAcceptedAnswersArValue={setAcceptedAnswersArValue}
              setAcceptedAnswersEnValue={setAcceptedAnswersEnValue}
              addMatchingPair={addMatchingPair}
              updateMatchingPair={updateMatchingPair}
              removeMatchingPair={removeMatchingPair}
              moveMatchingPairUp={moveMatchingPairUp}
              moveMatchingPairDown={moveMatchingPairDown}
              setMediaModeValue={setMediaModeValue}
              setMediaTitleValue={setMediaTitleValue}
              setMediaUrlValue={setMediaUrlValue}
              setMediaFileValue={setMediaFileValue}
              clearMedia={clearMedia}
              validationErrors={validationErrors}
            />
          )}
        </div>
      </div>
    </div>
  );
}
