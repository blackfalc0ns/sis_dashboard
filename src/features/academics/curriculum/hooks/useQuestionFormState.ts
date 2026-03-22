import { useCallback, useEffect, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  AssignmentQuestion,
  QuestionOption,
} from "@/features/academics/curriculum/services/curriculumService";

interface UseQuestionFormStateOptions {
  question?: AssignmentQuestion | null;
  isOpen?: boolean;
  resetKey?: string | null;
  onChange?: (updates: Partial<AssignmentQuestion>) => void;
}

interface UseQuestionFormStateReturn {
  questionTextAr: string;
  questionTextEn: string;
  questionType: AssignmentQuestion["questionType"];
  points: number;
  options: QuestionOption[];
  correctAnswer: boolean;
  sampleAnswerAr: string;
  sampleAnswerEn: string;
  setQuestionText: (value: { ar: string; en: string }) => void;
  setPointsValue: (value: number) => void;
  handleTypeChange: (newType: AssignmentQuestion["questionType"]) => void;
  addOption: () => void;
  removeOption: (id: string) => void;
  updateOptionText: (id: string, ar: string, en: string) => void;
  updateOptionCorrect: (id: string, checked: boolean) => void;
  moveOptionUp: (id: string) => void;
  moveOptionDown: (id: string) => void;
  reorderOptions: (activeId: string, overId: string) => void;
  setTrueFalseAnswer: (value: boolean) => void;
  setSampleAnswerArValue: (value: string) => void;
  setSampleAnswerEnValue: (value: string) => void;
  buildPayload: () => Partial<AssignmentQuestion>;
  resetFromQuestion: () => void;
}

function createDefaultOptions(): QuestionOption[] {
  return [
    { id: `opt-${Date.now()}-1`, textAr: "", textEn: "", isCorrect: false, order: 1 },
    { id: `opt-${Date.now()}-2`, textAr: "", textEn: "", isCorrect: false, order: 2 },
  ];
}

export function useQuestionFormState({
  question,
  isOpen = true,
  resetKey,
  onChange,
}: UseQuestionFormStateOptions): UseQuestionFormStateReturn {
  const [questionTextAr, setQuestionTextAr] = useState("");
  const [questionTextEn, setQuestionTextEn] = useState("");
  const [questionType, setQuestionType] =
    useState<AssignmentQuestion["questionType"]>("MCQ_SINGLE");
  const [points, setPoints] = useState<number>(1);
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState(true);
  const [sampleAnswerAr, setSampleAnswerAr] = useState("");
  const [sampleAnswerEn, setSampleAnswerEn] = useState("");

  const emitChange = useCallback(
    (overrides: Partial<AssignmentQuestion>) => {
      if (!onChange) {
        return;
      }

      const nextQuestionTextAr = overrides.questionTextAr ?? questionTextAr;
      const nextQuestionTextEn = overrides.questionTextEn ?? questionTextEn;
      const nextQuestionType = overrides.questionType ?? questionType;
      const nextPoints = overrides.points ?? points;
      const nextOptions = overrides.options ?? options;
      const nextCorrectAnswer = overrides.correctAnswer ?? correctAnswer;
      const hasSampleAnswerArOverride = Object.prototype.hasOwnProperty.call(
        overrides,
        "sampleAnswerAr"
      );
      const hasSampleAnswerEnOverride = Object.prototype.hasOwnProperty.call(
        overrides,
        "sampleAnswerEn"
      );
      const nextSampleAnswerAr =
        hasSampleAnswerArOverride ? overrides.sampleAnswerAr : sampleAnswerAr;
      const nextSampleAnswerEn =
        hasSampleAnswerEnOverride ? overrides.sampleAnswerEn : sampleAnswerEn;

      onChange({
        questionTextAr: nextQuestionTextAr,
        questionTextEn: nextQuestionTextEn,
        questionType: nextQuestionType,
        points: nextPoints,
        options:
          nextQuestionType === "MCQ_SINGLE" || nextQuestionType === "MCQ_MULTI"
            ? nextOptions
            : undefined,
        correctAnswer: nextQuestionType === "TRUE_FALSE" ? nextCorrectAnswer : undefined,
        sampleAnswerAr:
          nextQuestionType === "SHORT_ANSWER" && nextSampleAnswerAr?.trim()
            ? nextSampleAnswerAr.trim()
            : undefined,
        sampleAnswerEn:
          nextQuestionType === "SHORT_ANSWER" && nextSampleAnswerEn?.trim()
            ? nextSampleAnswerEn.trim()
            : undefined,
        ...overrides,
      });
    },
    [
      correctAnswer,
      onChange,
      options,
      points,
      questionTextAr,
      questionTextEn,
      questionType,
      sampleAnswerAr,
      sampleAnswerEn,
    ]
  );

  const resetFromQuestion = useCallback(() => {
    if (question) {
      setQuestionTextAr(question.questionTextAr);
      setQuestionTextEn(question.questionTextEn);
      setQuestionType(question.questionType);
      setPoints(question.points);
      setOptions(question.options || []);
      setCorrectAnswer(question.correctAnswer ?? true);
      setSampleAnswerAr(question.sampleAnswerAr || "");
      setSampleAnswerEn(question.sampleAnswerEn || "");
      return;
    }

    setQuestionTextAr("");
    setQuestionTextEn("");
    setQuestionType("MCQ_SINGLE");
    setPoints(1);
    setOptions([]);
    setCorrectAnswer(true);
    setSampleAnswerAr("");
    setSampleAnswerEn("");
  }, [question]);

  // This hook owns a local editable form model, so it must resync when a different
  // question/drawer session is opened.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetFromQuestion();
  }, [isOpen, resetFromQuestion, resetKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setQuestionText = useCallback(
    (value: { ar: string; en: string }) => {
      setQuestionTextAr(value.ar);
      setQuestionTextEn(value.en);
      emitChange({
        questionTextAr: value.ar,
        questionTextEn: value.en,
      });
    },
    [emitChange]
  );

  const setPointsValue = useCallback(
    (value: number) => {
      setPoints(value);
      emitChange({ points: value });
    },
    [emitChange]
  );

  const handleTypeChange = useCallback(
    (newType: AssignmentQuestion["questionType"]) => {
      let nextOptions = options;
      let nextCorrectAnswer = correctAnswer;
      let nextSampleAnswerAr = sampleAnswerAr;
      let nextSampleAnswerEn = sampleAnswerEn;

      if (
        (newType === "MCQ_SINGLE" || newType === "MCQ_MULTI") &&
        questionType !== "MCQ_SINGLE" &&
        questionType !== "MCQ_MULTI" &&
        options.length === 0
      ) {
        nextOptions = createDefaultOptions();
        setOptions(nextOptions);
      } else if (newType !== "MCQ_SINGLE" && newType !== "MCQ_MULTI") {
        nextOptions = [];
        setOptions([]);
      } else if (questionType === "MCQ_MULTI" && newType === "MCQ_SINGLE") {
        const correctOptions = options
          .filter((option) => option.isCorrect)
          .sort((left, right) => left.order - right.order);

        if (correctOptions.length > 1) {
          const firstCorrectId = correctOptions[0].id;
          nextOptions = options.map((option) => ({
            ...option,
            isCorrect: option.id === firstCorrectId,
          }));
          setOptions(nextOptions);
        }
      }

      if (newType === "TRUE_FALSE") {
        nextCorrectAnswer = true;
        setCorrectAnswer(true);
      }

      if (questionType === "SHORT_ANSWER" && newType !== "SHORT_ANSWER") {
        nextSampleAnswerAr = "";
        nextSampleAnswerEn = "";
        setSampleAnswerAr("");
        setSampleAnswerEn("");
      }

      setQuestionType(newType);
      emitChange({
        questionType: newType,
        options:
          newType === "MCQ_SINGLE" || newType === "MCQ_MULTI" ? nextOptions : undefined,
        correctAnswer: newType === "TRUE_FALSE" ? nextCorrectAnswer : undefined,
        sampleAnswerAr:
          newType === "SHORT_ANSWER" && nextSampleAnswerAr.trim()
            ? nextSampleAnswerAr.trim()
            : undefined,
        sampleAnswerEn:
          newType === "SHORT_ANSWER" && nextSampleAnswerEn.trim()
            ? nextSampleAnswerEn.trim()
            : undefined,
      });
    },
    [correctAnswer, emitChange, options, questionType, sampleAnswerAr, sampleAnswerEn]
  );

  const addOption = useCallback(() => {
    const maxOrder = options.reduce((max, option) => Math.max(max, option.order), 0);
    const nextOptions = [
      ...options,
      {
        id: `opt-${Date.now()}-${Math.random()}`,
        textAr: "",
        textEn: "",
        isCorrect: false,
        order: maxOrder + 1,
      },
    ];
    setOptions(nextOptions);
    emitChange({ options: nextOptions });
  }, [emitChange, options]);

  const removeOption = useCallback(
    (id: string) => {
      const nextOptions = options.filter((option) => option.id !== id);
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options]
  );

  const updateOptionText = useCallback(
    (id: string, ar: string, en: string) => {
      const nextOptions = options.map((option) =>
        option.id === id ? { ...option, textAr: ar, textEn: en } : option
      );
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options]
  );

  const updateOptionCorrect = useCallback(
    (id: string, checked: boolean) => {
      const nextOptions =
        questionType === "MCQ_SINGLE"
          ? options.map((option) => ({
              ...option,
              isCorrect: option.id === id ? checked : false,
            }))
          : options.map((option) =>
              option.id === id ? { ...option, isCorrect: checked } : option
            );
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options, questionType]
  );

  const moveOptionUp = useCallback(
    (id: string) => {
      const index = options.findIndex((option) => option.id === id);
      if (index <= 0) {
        return;
      }

      const nextOptions = arrayMove(options, index, index - 1).map((option, optionIndex) => ({
        ...option,
        order: optionIndex + 1,
      }));
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options]
  );

  const moveOptionDown = useCallback(
    (id: string) => {
      const index = options.findIndex((option) => option.id === id);
      if (index < 0 || index >= options.length - 1) {
        return;
      }

      const nextOptions = arrayMove(options, index, index + 1).map((option, optionIndex) => ({
        ...option,
        order: optionIndex + 1,
      }));
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options]
  );

  const reorderOptions = useCallback(
    (activeId: string, overId: string) => {
      const oldIndex = options.findIndex((option) => option.id === activeId);
      const newIndex = options.findIndex((option) => option.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return;
      }

      const nextOptions = arrayMove(options, oldIndex, newIndex).map((option, optionIndex) => ({
        ...option,
        order: optionIndex + 1,
      }));
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options]
  );

  const setTrueFalseAnswer = useCallback(
    (value: boolean) => {
      setCorrectAnswer(value);
      emitChange({ correctAnswer: value });
    },
    [emitChange]
  );

  const setSampleAnswerArValue = useCallback(
    (value: string) => {
      setSampleAnswerAr(value);
      emitChange({ sampleAnswerAr: value.trim() || undefined });
    },
    [emitChange]
  );

  const setSampleAnswerEnValue = useCallback(
    (value: string) => {
      setSampleAnswerEn(value);
      emitChange({ sampleAnswerEn: value.trim() || undefined });
    },
    [emitChange]
  );

  const buildPayload = useCallback(
    () => ({
      questionTextAr: questionTextAr.trim(),
      questionTextEn: questionTextEn.trim(),
      questionType,
      points,
      options:
        questionType === "MCQ_SINGLE" || questionType === "MCQ_MULTI"
          ? options.map((option, index) => ({ ...option, order: index + 1 }))
          : undefined,
      correctAnswer: questionType === "TRUE_FALSE" ? correctAnswer : undefined,
      sampleAnswerAr:
        questionType === "SHORT_ANSWER" && sampleAnswerAr.trim()
          ? sampleAnswerAr.trim()
          : undefined,
      sampleAnswerEn:
        questionType === "SHORT_ANSWER" && sampleAnswerEn.trim()
          ? sampleAnswerEn.trim()
          : undefined,
    }),
    [
      correctAnswer,
      options,
      points,
      questionTextAr,
      questionTextEn,
      questionType,
      sampleAnswerAr,
      sampleAnswerEn,
    ]
  );

  return {
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
    resetFromQuestion,
  };
}
