"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  FormControlLabel,
  Switch,
  TextField,
  IconButton,
  Chip,
} from "@mui/material";
import {
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import Select from "@/components/ui/input/Select";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import WizardStepper from "./WizardStepper";
import {
  TimetableDay,
  TimetablePeriod,
  TimetableConfigScope,
  validateTimetableConfig,
} from "@/features/academics/timetable/types/timetableConfig";
import { getDefaultDays, generateDefaultPeriods } from "@/features/academics/timetable/services/timetableConfigService";
import { Classroom, Grade, Section } from "@/features/academics/academic-structure-tree/services/structureService";

interface TimetableConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: {
    scopeType: TimetableConfigScope;
    scopeId?: string;
    days: TimetableDay[];
    periods: TimetablePeriod[];
  }) => Promise<void>;
  initialDays?: TimetableDay[];
  initialPeriods?: TimetablePeriod[];
  initialScope?: TimetableConfigScope;
  initialScopeId?: string;
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  locale: string;
}

export default function TimetableConfigDialog({
  open,
  onClose,
  onSave,
  initialDays,
  initialPeriods,
  initialScope = "TERM",
  initialScopeId,
  grades,
  sections,
  classrooms,
  locale,
}: TimetableConfigDialogProps) {
  const t = useTranslations("academics.timetable.config");
  const tCommon = useTranslations("common");

  const [activeStep, setActiveStep] = useState(0);
  const [days, setDays] = useState<TimetableDay[]>([]);
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [scopeType, setScopeType] = useState<TimetableConfigScope>(initialScope);
  const [scopeId, setScopeId] = useState<string>(initialScopeId || "");
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [periodCount, setPeriodCount] = useState(8);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editingPeriodIndex, setEditingPeriodIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setDays(initialDays || getDefaultDays());
      setPeriods(initialPeriods || generateDefaultPeriods(8));
      setScopeType(initialScope);
      setScopeId(initialScopeId || "");
      
      // Initialize grade/section based on scope
      if (initialScope === "SECTION" && initialScopeId) {
        const section = sections.find(s => s.id === initialScopeId);
        if (section) {
          setSelectedGradeId(section.gradeId);
          setSelectedSectionId(initialScopeId);
          setSelectedClassroomId("");
        }
      } else if (initialScope === "CLASSROOM" && initialScopeId) {
        const classroom = classrooms.find((item) => item.id === initialScopeId);
        const section = classroom ? sections.find((item) => item.id === classroom.sectionId) : undefined;
        if (section && classroom) {
          setSelectedGradeId(section.gradeId);
          setSelectedSectionId(section.id);
          setSelectedClassroomId(classroom.id);
        }
      } else if (initialScope === "GRADE" && initialScopeId) {
        setSelectedGradeId(initialScopeId);
        setSelectedSectionId("");
        setSelectedClassroomId("");
      } else {
        setSelectedGradeId("");
        setSelectedSectionId("");
        setSelectedClassroomId("");
      }
      
      setPeriodCount(initialPeriods?.length || 8);
      setActiveStep(0);
      setErrors([]);
      setEditingDayIndex(null);
      setEditingPeriodIndex(null);
    }
  }, [open, initialDays, initialPeriods, initialScope, initialScopeId, sections, classrooms]);

  // Quick presets for days
  const applyDayPreset = (preset: "sun-thu" | "sat-thu" | "all") => {
    const newDays = [...days];
    newDays.forEach((day) => {
      if (preset === "sun-thu") {
        day.isActive = !["fri", "sat"].includes(day.key);
      } else if (preset === "sat-thu") {
        day.isActive = day.key !== "fri";
      } else {
        day.isActive = true;
      }
    });
    setDays(newDays);
  };

  // Quick templates for periods
  const applyPeriodTemplate = (count: 6 | 7 | 8) => {
    setPeriodCount(count);
    setPeriods(generateDefaultPeriods(count));
  };

  const handleDayToggle = (index: number) => {
    const newDays = [...days];
    newDays[index].isActive = !newDays[index].isActive;
    setDays(newDays);
  };

  const handleDayMove = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === days.length - 1)
    ) {
      return;
    }

    const newDays = [...days];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const tempIndex = newDays[index].index;
    newDays[index].index = newDays[targetIndex].index;
    newDays[targetIndex].index = tempIndex;
    [newDays[index], newDays[targetIndex]] = [newDays[targetIndex], newDays[index]];
    setDays(newDays);
  };

  const handleDayNameChange = (index: number, nameAr: string, nameEn: string) => {
    const newDays = [...days];
    newDays[index].nameAr = nameAr;
    newDays[index].nameEn = nameEn;
    setDays(newDays);
    setEditingDayIndex(null);
  };

  const handlePeriodCountChange = (count: number) => {
    setPeriodCount(count);
    if (count > periods.length) {
      const newPeriods = [...periods];
      for (let i = periods.length; i < count; i++) {
        newPeriods.push({
          id: `p${i + 1}`, // Stable ID
          index: i + 1,
          nameAr: `الحصة ${i + 1}`,
          nameEn: `Period ${i + 1}`,
        });
      }
      setPeriods(newPeriods);
    } else if (count < periods.length) {
      setPeriods(periods.slice(0, count));
    }
  };

  const handlePeriodChange = (
    index: number,
    field: keyof TimetablePeriod,
    value: string | number
  ) => {
    const newPeriods = [...periods];
    if (field === "index") {
      newPeriods[index][field] = value as number;
    } else {
      newPeriods[index][field] = value as string;
    }
    setPeriods(newPeriods);
  };

  const handlePeriodMove = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === periods.length - 1)
    ) {
      return;
    }

    const newPeriods = [...periods];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const tempIndex = newPeriods[index].index;
    newPeriods[index].index = newPeriods[targetIndex].index;
    newPeriods[targetIndex].index = tempIndex;
    [newPeriods[index], newPeriods[targetIndex]] = [
      newPeriods[targetIndex],
      newPeriods[index],
    ];
    setPeriods(newPeriods);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      const activeDays = days.filter((d) => d.isActive);
      if (activeDays.length === 0) {
        setErrors([t("validation.atLeastOneDay")]);
        return;
      }
    }
    setErrors([]);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrors([]);
    setActiveStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    const validation = validateTimetableConfig({ days, periods });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Determine the final scopeId based on scope type
    let finalScopeId = scopeId;
    if (scopeType === "GRADE") {
      finalScopeId = selectedGradeId;
      if (!finalScopeId) {
        setErrors([t("validation.selectGrade")]);
        return;
      }
    } else if (scopeType === "SECTION") {
      finalScopeId = selectedSectionId;
      if (!selectedGradeId) {
        setErrors([t("validation.selectGrade")]);
        return;
      }
      if (!finalScopeId) {
        setErrors([t("validation.selectSection")]);
        return;
      }
    } else if (scopeType === "CLASSROOM") {
      finalScopeId = selectedClassroomId;
      if (!selectedGradeId) {
        setErrors([t("validation.selectGrade")]);
        return;
      }
      if (!selectedSectionId) {
        setErrors([t("validation.selectSection")]);
        return;
      }
      if (!finalScopeId) {
        setErrors([t("validation.selectClassroom")]);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave({
        scopeType,
        scopeId: scopeType === "TERM" ? undefined : finalScopeId,
        days,
        periods,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save config:", error);
      setErrors([t("validation.saveFailed")]);
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { title: t("steps.days"), subtitle: t("daysDescription") },
    { title: t("steps.periods"), subtitle: t("periodsDescription") },
    { title: t("steps.scope"), subtitle: t("scopeDescription") },
  ];

  const filteredSections = sections.filter((s) =>
    (scopeType === "SECTION" || scopeType === "CLASSROOM") && selectedGradeId ? s.gradeId === selectedGradeId : true
  );
  const filteredClassrooms = classrooms.filter((classroom) =>
    scopeType === "CLASSROOM" && selectedSectionId ? classroom.sectionId === selectedSectionId : true
  );

  const activeDaysCount = days.filter((d) => d.isActive).length;
  const totalSlots = activeDaysCount * periods.length;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("title")}
      description={t("subtitle")}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button onClick={onClose} variant="secondary">
            {tCommon("cancel")}
          </Button>
          <div className="flex gap-2">
            {activeStep > 0 && (
              <Button onClick={handleBack} variant="secondary">
                {t("back")}
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button onClick={handleNext} variant="primary">
                {t("next")}
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving} variant="primary">
                {isSaving ? tCommon("saving") : tCommon("save")}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto">
        {/* Stepper */}
        <WizardStepper steps={steps} activeStep={activeStep} locale={locale} />

          {/* Errors */}
          {errors.length > 0 && (
            <Alert severity="error" className="mb-4">
              {errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </Alert>
          )}

          {/* Step Content */}
          <div className="min-h-[400px] py-6">
            {/* Step 1: Days */}
            {activeStep === 0 && (
              <div className="space-y-6">
                {/* Quick Presets */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {t("quickPresets")}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Chip
                      label={t("presets.sunThu")}
                      onClick={() => applyDayPreset("sun-thu")}
                      variant="outlined"
                      className="cursor-pointer hover:bg-primary/10"
                    />
                    <Chip
                      label={t("presets.satThu")}
                      onClick={() => applyDayPreset("sat-thu")}
                      variant="outlined"
                      className="cursor-pointer hover:bg-primary/10"
                    />
                    <Chip
                      label={t("presets.allDays")}
                      onClick={() => applyDayPreset("all")}
                      variant="outlined"
                      className="cursor-pointer hover:bg-primary/10"
                    />
                  </div>
                </div>

                {/* Days List */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {t("daysList")}
                  </h3>
                  <div className="space-y-2">
                    {days.map((day, index) => (
                      <div
                        key={day.key}
                        className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        {/* Toggle */}
                        <FormControlLabel
                          control={
                            <Switch
                              checked={day.isActive}
                              onChange={() => handleDayToggle(index)}
                              size="small"
                            />
                          }
                          label=""
                          className="m-0"
                        />

                        {/* Day Name */}
                        <div className="flex-1">
                          {editingDayIndex === index ? (
                            <div className="flex items-center gap-2">
                              <BilingualTextField
                                label=""
                                value={{ ar: day.nameAr, en: day.nameEn }}
                                onChange={(val) =>
                                  handleDayNameChange(index, val.ar, val.en)
                                }
                                placeholder={{
                                  ar: t("dayNameAr"),
                                  en: t("dayNameEn"),
                                }}
                                requiredAr={false}
                                requiredEn={false}
                              />
                              <IconButton
                                size="small"
                                onClick={() => setEditingDayIndex(null)}
                                className="text-green-600"
                              >
                                <Check className="w-4 h-4" />
                              </IconButton>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {locale === "ar" ? day.nameAr : day.nameEn}
                              </span>
                              <IconButton
                                size="small"
                                onClick={() => setEditingDayIndex(index)}
                                className="opacity-0 group-hover:opacity-100"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                              </IconButton>
                            </div>
                          )}
                        </div>

                        {/* Reorder Buttons */}
                        <div className="flex gap-1">
                          <IconButton
                            size="small"
                            onClick={() => handleDayMove(index, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDayMove(index, "down")}
                            disabled={index === days.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Periods */}
            {activeStep === 1 && (
              <div className="space-y-6">
                {/* Quick Templates */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {t("quickTemplates")}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Chip
                      label={t("templates.6periods")}
                      onClick={() => applyPeriodTemplate(6)}
                      variant="outlined"
                      className="cursor-pointer hover:bg-primary/10"
                    />
                    <Chip
                      label={t("templates.7periods")}
                      onClick={() => applyPeriodTemplate(7)}
                      variant="outlined"
                      className="cursor-pointer hover:bg-primary/10"
                    />
                    <Chip
                      label={t("templates.8periods")}
                      onClick={() => applyPeriodTemplate(8)}
                      variant="outlined"
                      className="cursor-pointer hover:bg-primary/10"
                    />
                  </div>
                </div>

                {/* Period Count */}
                <div>
                  <TextField
                    label={t("periodCount")}
                    type="number"
                    value={periodCount}
                    onChange={(e) =>
                      handlePeriodCountChange(parseInt(e.target.value) || 1)
                    }
                    inputProps={{ min: 1, max: 12 }}
                    size="small"
                    className="w-48"
                  />
                </div>

                {/* Periods List */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {t("periodsList")}
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {periods.map((period, index) => (
                      <div
                        key={period.index}
                        className="flex items-start gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        {/* Period Info */}
                        <div className="flex-1 space-y-2">
                          {editingPeriodIndex === index ? (
                            <>
                              <BilingualTextField
                                label=""
                                value={{ ar: period.nameAr, en: period.nameEn }}
                                onChange={(val) => {
                                  const newPeriods = [...periods];
                                  newPeriods[index].nameAr = val.ar;
                                  newPeriods[index].nameEn = val.en;
                                  setPeriods(newPeriods);
                                }}
                                placeholder={{
                                  ar: t("periodNameAr"),
                                  en: t("periodNameEn"),
                                }}
                                requiredAr={false}
                                requiredEn={false}
                              />
                              <IconButton
                                size="small"
                                onClick={() => setEditingPeriodIndex(null)}
                                className="text-green-600"
                              >
                                <Check className="w-4 h-4" />
                              </IconButton>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {locale === "ar" ? period.nameAr : period.nameEn}
                              </span>
                              <IconButton
                                size="small"
                                onClick={() => setEditingPeriodIndex(index)}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                              </IconButton>
                            </div>
                          )}

                          {/* Time Inputs */}
                          <div className="flex gap-2">
                            <TextField
                              label={t("startTime")}
                              type="time"
                              value={period.startTime || ""}
                              onChange={(e) =>
                                handlePeriodChange(index, "startTime", e.target.value)
                              }
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              className="flex-1"
                            />
                            <TextField
                              label={t("endTime")}
                              type="time"
                              value={period.endTime || ""}
                              onChange={(e) =>
                                handlePeriodChange(index, "endTime", e.target.value)
                              }
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        {/* Reorder Buttons */}
                        <div className="flex gap-1">
                          <IconButton
                            size="small"
                            onClick={() => handlePeriodMove(index, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handlePeriodMove(index, "down")}
                            disabled={index === periods.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Apply To */}
            {activeStep === 2 && (
              <div className="space-y-6">
                {/* Scope Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {t("selectScope")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Term Card */}
                    <div
                      onClick={() => setScopeType("TERM")}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        scopeType === "TERM"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            scopeType === "TERM"
                              ? "border-primary bg-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {scopeType === "TERM" && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="font-semibold text-sm">
                          {t("scope.term")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {t("scope.termDesc")}
                      </p>
                    </div>

                    {/* Grade Card */}
                    <div
                      onClick={() => setScopeType("GRADE")}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        scopeType === "GRADE"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            scopeType === "GRADE"
                              ? "border-primary bg-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {scopeType === "GRADE" && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="font-semibold text-sm">
                          {t("scope.grade")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {t("scope.gradeDesc")}
                      </p>
                    </div>

                    {/* Section Card */}
                    <div
                      onClick={() => setScopeType("SECTION")}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        scopeType === "SECTION"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            scopeType === "SECTION"
                              ? "border-primary bg-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {scopeType === "SECTION" && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="font-semibold text-sm">
                          {t("scope.section")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {t("scope.sectionDesc")}
                      </p>
                    </div>

                    <div
                      onClick={() => setScopeType("CLASSROOM")}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        scopeType === "CLASSROOM"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            scopeType === "CLASSROOM"
                              ? "border-primary bg-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {scopeType === "CLASSROOM" && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="font-semibold text-sm">
                          {t("scope.classroom")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {t("scope.classroomDesc")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grade/Section Selectors */}
                {scopeType === "GRADE" && (
                  <Select
                    label={t("selectGrade")}
                    value={selectedGradeId}
                    onChange={(value) => {
                      setSelectedGradeId(value);
                      setScopeId(value);
                    }}
                    options={grades.map((grade) => ({
                      value: grade.id,
                      label: locale === "ar" ? grade.nameAr : grade.nameEn,
                    }))}
                    placeholder={t("selectGrade")}
                    fullWidth
                  />
                )}

                {scopeType === "SECTION" && (
                  <div className="space-y-3">
                    <Select
                      label={t("selectGrade")}
                      value={selectedGradeId}
                      onChange={(value) => {
                        setSelectedGradeId(value);
                        setSelectedSectionId(""); // Reset section when grade changes
                      }}
                      options={grades.map((grade) => ({
                        value: grade.id,
                        label: locale === "ar" ? grade.nameAr : grade.nameEn,
                      }))}
                      placeholder={t("selectGrade")}
                      fullWidth
                    />
                    {selectedGradeId && (
                      <Select
                        label={t("selectSection")}
                        value={selectedSectionId}
                        onChange={(value) => {
                          setSelectedSectionId(value);
                          setScopeId(value);
                        }}
                        options={filteredSections.map((section) => ({
                          value: section.id,
                          label: locale === "ar" ? section.nameAr : section.nameEn,
                        }))}
                        placeholder={t("selectSection")}
                        fullWidth
                      />
                    )}
                  </div>
                )}

                {scopeType === "CLASSROOM" && (
                  <div className="space-y-3">
                    <Select
                      label={t("selectGrade")}
                      value={selectedGradeId}
                      onChange={(value) => {
                        setSelectedGradeId(value);
                        setSelectedSectionId("");
                        setSelectedClassroomId("");
                      }}
                      options={grades.map((grade) => ({
                        value: grade.id,
                        label: locale === "ar" ? grade.nameAr : grade.nameEn,
                      }))}
                      placeholder={t("selectGrade")}
                      fullWidth
                    />
                    {selectedGradeId && (
                      <Select
                        label={t("selectSection")}
                        value={selectedSectionId}
                        onChange={(value) => {
                          setSelectedSectionId(value);
                          setSelectedClassroomId("");
                        }}
                        options={filteredSections.map((section) => ({
                          value: section.id,
                          label: locale === "ar" ? section.nameAr : section.nameEn,
                        }))}
                        placeholder={t("selectSection")}
                        fullWidth
                      />
                    )}
                    {selectedSectionId && (
                      <Select
                        label={t("validation.selectClassroom")}
                        value={selectedClassroomId}
                        onChange={(value) => {
                          setSelectedClassroomId(value);
                          setScopeId(value);
                        }}
                        options={filteredClassrooms.map((classroom) => ({
                          value: classroom.id,
                          label: locale === "ar" ? classroom.nameAr : classroom.nameEn,
                        }))}
                        placeholder={t("validation.selectClassroom")}
                        fullWidth
                      />
                    )}
                  </div>
                )}

                {/* Summary Box */}
                <div className="bg-linear-to-br from-primary/5 to-primary/10 rounded-lg p-5 border border-primary/20">
                  <h4 className="font-semibold text-sm text-gray-900 mb-4">
                    {t("summary.title")}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        {t("summary.activeDays")}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {activeDaysCount}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {days
                          .filter((d) => d.isActive)
                          .map((d) => (locale === "ar" ? d.nameAr : d.nameEn))
                          .join(", ")}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        {t("summary.periods")}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {periods.length}
                      </div>
                      {periods[0]?.startTime && periods[periods.length - 1]?.endTime && (
                        <div className="text-xs text-gray-500 mt-1">
                          {periods[0].startTime} - {periods[periods.length - 1].endTime}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-600 mb-1">
                        {t("summary.totalSlots")}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {totalSlots}
                      </div>
                    </div>
                  </div>
                  {scopeType !== "TERM" && (
                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <div className="flex items-center gap-2 text-xs text-amber-700">
                        <span>⚠️</span>
                        <span>{t("summary.overridesTermSettings")}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
    </Modal>
  );
}
