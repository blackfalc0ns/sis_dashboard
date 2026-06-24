"use client";

import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  Circle,
  Clock3,
  Cloud,
  CloudRain,
  CloudSnow,
  Droplets,
  Eye,
  Gauge,
  ListTodo,
  MapPin,
  Plus,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Trash2,
  Wind,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "../button/Button";
import Input from "../input/Input";
import Select, { SelectOption } from "../input/Select";
import TextArea from "../input/TextArea";
import Modal from "../modal/Modal";

export type WeatherTone =
  | "amber"
  | "blue"
  | "green"
  | "purple"
  | "rose"
  | "sky";
export type LightModeDropdownLocale = "en" | "ar";
export type TodoPriority = "low" | "medium" | "high";

export interface LightModeDropdownHint {
  label: string;
  icon?: ReactNode;
}

export interface LightModeDropdownMetric {
  label: string;
  value: string;
  subLabel: string;
  icon?: ReactNode;
  tone?: WeatherTone;
}

export interface LightModeDropdownCity {
  city: string;
  country: string;
  temp: string;
  condition: string;
  flag?: string;
  icon?: ReactNode;
}

export interface LightModeDropdownForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
  icon?: ReactNode;
}

export interface LightModeDropdownCalendarDay {
  date: number;
  isCurrentMonth?: boolean;
  isToday?: boolean;
  hasEvent?: boolean;
}

export interface LightModeDropdownTodo {
  id?: string;
  title: string;
  description?: string;
  time: string;
  completed?: boolean;
  tone?: WeatherTone;
  priority?: TodoPriority;
}

export interface LightModeDropdownPlannerData {
  time: string;
  period: string;
  timezone: string;
  dateLabel: string;
  monthLabel: string;
  weekDays: string[];
  eventDates?: string[];
  calendarDays: LightModeDropdownCalendarDay[];
  todos: LightModeDropdownTodo[];
}

type PlannerTodo = Required<Pick<LightModeDropdownTodo, "id">> &
  Omit<LightModeDropdownTodo, "id">;

export interface LightModeDropdownData {
  eyebrow?: string;
  location: string;
  dateLabel: string;
  compactDateLabel?: string;
  temperature: string;
  lowTemperature: string;
  feelsLike: string;
  condition: string;
  mainIcon?: ReactNode;
  hints: LightModeDropdownHint[];
  highlights: LightModeDropdownMetric[];
  cities: LightModeDropdownCity[];
  forecast: LightModeDropdownForecastDay[];
  planner: LightModeDropdownPlannerData;
}

export interface LightModeDropdownProps {
  weatherData?: Partial<LightModeDropdownData>;
  locale?: LightModeDropdownLocale;
  className?: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const toneClasses: Record<WeatherTone, string> = {
  amber: "bg-amber-50 border-amber-100",
  blue: "bg-blue-50 border-blue-100",
  green: "bg-green-50 border-green-100",
  purple: "bg-purple-50 border-purple-100",
  rose: "bg-rose-50 border-rose-100",
  sky: "bg-sky-50 border-sky-100",
};

const priorityClasses: Record<TodoPriority, string> = {
  low: "bg-green-50 text-green-700 border-green-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  high: "bg-rose-50 text-rose-700 border-rose-100",
};

const priorityTone: Record<TodoPriority, WeatherTone> = {
  low: "green",
  medium: "amber",
  high: "rose",
};

const localeCode: Record<LightModeDropdownLocale, string> = {
  en: "en-US",
  ar: "ar-EG",
};

interface LocalizedText {
  collapse: string;
  low: string;
  feels: string;
  todaysHighlight: string;
  otherCountries: string;
  tenDayForecast: string;
  clock: string;
  calendar: string;
  previousMonth: string;
  nextMonth: string;
  todoTitle: string;
  done: string;
  addTitle: string;
  addDescription: string;
  add: string;
  inputHint: string;
  priority: string;
  priorities: Record<TodoPriority, string>;
  markDone: string;
  markIncomplete: string;
  deleteTask: string;
  todoDetails: string;
  title: string;
  description: string;
  status: string;
  completed: string;
  pending: string;
  time: string;
  close: string;
  edit: string;
  save: string;
  update: string;
  cancel: string;
}

function localizedTextFromMessages(
  t: ReturnType<typeof useTranslations>,
): LocalizedText {
  return {
    collapse: t("collapse"),
    low: t("low"),
    feels: t("feels"),
    todaysHighlight: t("todaysHighlight"),
    otherCountries: t("otherCountries"),
    tenDayForecast: t("tenDayForecast"),
    clock: t("clock"),
    calendar: t("calendar"),
    previousMonth: t("previousMonth"),
    nextMonth: t("nextMonth"),
    todoTitle: t("todoTitle"),
    done: t("done"),
    addTitle: t("addTitle"),
    addDescription: t("addDescription"),
    add: t("add"),
    inputHint: t("inputHint"),
    priority: t("priority"),
    priorities: {
      low: t("priorities.low"),
      medium: t("priorities.medium"),
      high: t("priorities.high"),
    },
    markDone: t("markDone"),
    markIncomplete: t("markIncomplete"),
    deleteTask: t("deleteTask"),
    todoDetails: t("todoDetails"),
    title: t("title"),
    description: t("description"),
    status: t("status"),
    completed: t("completed"),
    pending: t("pending"),
    time: t("time"),
    close: t("close"),
    edit: t("edit"),
    save: t("save"),
    update: t("update"),
    cancel: t("cancel"),
  };
}

function priorityOptions(text: LocalizedText): SelectOption[] {
  return [
    { value: "low", label: text.priorities.low },
    { value: "medium", label: text.priorities.medium },
    { value: "high", label: text.priorities.high },
  ];
}

const defaultWeatherData: LightModeDropdownData = {
  eyebrow: "Weather Dashboard",
  location: "Dhaka, Bangladesh",
  dateLabel: "Sun, 04 Aug 2024",
  compactDateLabel: "Sun, 04 Aug",
  temperature: "28°C",
  lowTemperature: "24°C",
  feelsLike: "31°C",
  condition: "Heavy Rain",
  mainIcon: (
    <CloudRain size={56} className="text-white opacity-90" strokeWidth={1.5} />
  ),
  hints: [
    { icon: <Wind size={12} className="text-[#6B7280]" />, label: "7.90 km/h" },
    { icon: <Droplets size={12} className="text-blue-400" />, label: "85%" },
    {
      icon: <Sunrise size={12} className="text-amber-400" />,
      label: "4:50 AM",
    },
    {
      icon: <Sunset size={12} className="text-orange-400" />,
      label: "6:45 PM",
    },
  ],
  highlights: [
    {
      label: "UV Index",
      value: "3",
      subLabel: "Moderate",
      icon: <Sun size={18} className="text-amber-400" />,
      tone: "amber",
    },
    {
      label: "Humidity",
      value: "85%",
      subLabel: "Very humid",
      icon: <Droplets size={18} className="text-blue-400" />,
      tone: "blue",
    },
    {
      label: "Visibility",
      value: "4.2 km",
      subLabel: "Moderate",
      icon: <Eye size={18} className="text-purple-400" />,
      tone: "purple",
    },
    {
      label: "Pressure",
      value: "1012 hPa",
      subLabel: "Normal",
      icon: <Gauge size={18} className="text-green-400" />,
      tone: "green",
    },
    {
      label: "Wind Speed",
      value: "7.9 km/h",
      subLabel: "Light breeze",
      icon: <Wind size={18} className="text-sky-400" />,
      tone: "sky",
    },
    {
      label: "Feels Like",
      value: "31°C",
      subLabel: "Warmer",
      icon: <Thermometer size={18} className="text-rose-400" />,
      tone: "rose",
    },
  ],
  cities: [
    {
      city: "London",
      country: "UK",
      temp: "16°C",
      condition: "Cloudy",
      icon: <Cloud size={16} className="text-[#9CA3AF]" />,
      flag: "GB",
    },
    {
      city: "New York",
      country: "USA",
      temp: "24°C",
      condition: "Sunny",
      icon: <Sun size={16} className="text-amber-400" />,
      flag: "US",
    },
    {
      city: "Tokyo",
      country: "Japan",
      temp: "31°C",
      condition: "Humid",
      icon: <CloudRain size={16} className="text-blue-400" />,
      flag: "JP",
    },
    {
      city: "Dubai",
      country: "UAE",
      temp: "42°C",
      condition: "Sunny",
      icon: <Sun size={16} className="text-amber-500" />,
      flag: "AE",
    },
    {
      city: "Sydney",
      country: "Australia",
      temp: "19°C",
      condition: "Partly cloudy",
      icon: <Cloud size={16} className="text-[#9CA3AF]" />,
      flag: "AU",
    },
    {
      city: "Oslo",
      country: "Norway",
      temp: "8°C",
      condition: "Snow",
      icon: <CloudSnow size={16} className="text-sky-300" />,
      flag: "NO",
    },
  ],
  forecast: [
    {
      day: "Today",
      high: 28,
      low: 24,
      condition: "Heavy Rain",
      icon: <CloudRain size={14} className="text-blue-400" />,
    },
    {
      day: "Mon",
      high: 27,
      low: 23,
      condition: "Rain",
      icon: <CloudRain size={14} className="text-blue-400" />,
    },
    {
      day: "Tue",
      high: 26,
      low: 22,
      condition: "Cloudy",
      icon: <Cloud size={14} className="text-[#9CA3AF]" />,
    },
    {
      day: "Wed",
      high: 29,
      low: 24,
      condition: "Partly Sunny",
      icon: <Cloud size={14} className="text-[#9CA3AF]" />,
    },
    {
      day: "Thu",
      high: 32,
      low: 26,
      condition: "Sunny",
      icon: <Sun size={14} className="text-amber-400" />,
    },
    {
      day: "Fri",
      high: 33,
      low: 27,
      condition: "Sunny",
      icon: <Sun size={14} className="text-amber-400" />,
    },
    {
      day: "Sat",
      high: 31,
      low: 25,
      condition: "Partly Cloudy",
      icon: <Cloud size={14} className="text-[#9CA3AF]" />,
    },
    {
      day: "Sun",
      high: 29,
      low: 23,
      condition: "Rain",
      icon: <CloudRain size={14} className="text-blue-400" />,
    },
    {
      day: "Mon",
      high: 27,
      low: 22,
      condition: "Cloudy",
      icon: <Cloud size={14} className="text-[#9CA3AF]" />,
    },
    {
      day: "Tue",
      high: 30,
      low: 25,
      condition: "Sunny",
      icon: <Sun size={14} className="text-amber-400" />,
    },
  ],
  planner: {
    time: "10:24",
    period: "AM",
    timezone: "GMT+6",
    dateLabel: "Sunday, 04 August",
    monthLabel: "August 2024",
    weekDays: ["S", "M", "T", "W", "T", "F", "S"],
    eventDates: [
      "2024-08-03",
      "2024-08-04",
      "2024-08-07",
      "2024-08-14",
      "2024-08-23",
    ],
    calendarDays: [
      { date: 28, isCurrentMonth: false },
      { date: 29, isCurrentMonth: false },
      { date: 30, isCurrentMonth: false },
      { date: 31, isCurrentMonth: false },
      { date: 1, isCurrentMonth: true },
      { date: 2, isCurrentMonth: true },
      { date: 3, isCurrentMonth: true, hasEvent: true },
      { date: 4, isCurrentMonth: true, isToday: true, hasEvent: true },
      { date: 5, isCurrentMonth: true },
      { date: 6, isCurrentMonth: true },
      { date: 7, isCurrentMonth: true, hasEvent: true },
      { date: 8, isCurrentMonth: true },
      { date: 9, isCurrentMonth: true },
      { date: 10, isCurrentMonth: true },
      { date: 11, isCurrentMonth: true },
      { date: 12, isCurrentMonth: true },
      { date: 13, isCurrentMonth: true },
      { date: 14, isCurrentMonth: true, hasEvent: true },
      { date: 15, isCurrentMonth: true },
      { date: 16, isCurrentMonth: true },
      { date: 17, isCurrentMonth: true },
      { date: 18, isCurrentMonth: true },
      { date: 19, isCurrentMonth: true },
      { date: 20, isCurrentMonth: true },
      { date: 21, isCurrentMonth: true },
      { date: 22, isCurrentMonth: true },
      { date: 23, isCurrentMonth: true, hasEvent: true },
      { date: 24, isCurrentMonth: true },
      { date: 25, isCurrentMonth: true },
      { date: 26, isCurrentMonth: true },
      { date: 27, isCurrentMonth: true },
      { date: 28, isCurrentMonth: true },
      { date: 29, isCurrentMonth: true },
      { date: 30, isCurrentMonth: true },
      { date: 31, isCurrentMonth: true },
    ],
    todos: [
      {
        id: "attendance-review",
        title: "Review class attendance",
        description:
          "Check today's attendance summary, review late arrivals, and flag students who need follow-up.",
        time: "09:00 AM",
        completed: true,
        tone: "green",
        priority: "medium",
      },
      {
        id: "homework-feedback",
        title: "Publish homework feedback",
        description:
          "Finalize comments for submitted assignments and publish feedback for the classroom.",
        time: "11:30 AM",
        tone: "blue",
        priority: "high",
      },
      {
        id: "weekly-dashboard",
        title: "Prepare weekly dashboard",
        description:
          "Update the weekly dashboard with attendance, homework, and academic progress highlights.",
        time: "02:15 PM",
        tone: "amber",
        priority: "low",
      },
    ],
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function resolveWeatherData(
  weatherData?: Partial<LightModeDropdownData>,
): LightModeDropdownData {
  return {
    ...defaultWeatherData,
    ...weatherData,
    hints: weatherData?.hints ?? defaultWeatherData.hints,
    highlights: weatherData?.highlights ?? defaultWeatherData.highlights,
    cities: weatherData?.cities ?? defaultWeatherData.cities,
    forecast: weatherData?.forecast ?? defaultWeatherData.forecast,
    planner: weatherData?.planner ?? defaultWeatherData.planner,
  };
}

function todoItemsFromPlanner(todos: LightModeDropdownTodo[]): PlannerTodo[] {
  return todos.map((todo, index) => ({
    ...todo,
    id: todo.id ?? `${todo.title}-${todo.time}-${index}`,
  }));
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date, locale: LightModeDropdownLocale) {
  return date.toLocaleDateString(localeCode[locale], {
    month: "long",
    year: "numeric",
  });
}

function calendarDaysForMonth(
  visibleMonth: Date,
  eventDates: string[],
): LightModeDropdownCalendarDay[] {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());
  const todayKey = dateKey(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + index);

    return {
      date: currentDate.getDate(),
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: dateKey(currentDate) === todayKey,
      hasEvent: eventDates.includes(dateKey(currentDate)),
    };
  });
}

function clockParts(date: Date, locale: LightModeDropdownLocale) {
  const [time, period] = date
    .toLocaleTimeString(localeCode[locale], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .split(" ");

  return { time, period };
}

function localizedWeekDays(locale: LightModeDropdownLocale) {
  return locale === "ar"
    ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"]
    : ["S", "M", "T", "W", "T", "F", "S"];
}

export default function LightModeDropdown({
  weatherData,
  locale,
  className,
  defaultExpanded = false,
  expanded,
  onExpandedChange,
}: LightModeDropdownProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const currentLocale = useLocale();
  const t = useTranslations("lightModeDropdown");
  const activeLocale: LightModeDropdownLocale =
    locale ?? (currentLocale === "ar" ? "ar" : "en");
  const text = localizedTextFromMessages(t);
  const weather = resolveWeatherData(weatherData);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [todos, setTodos] = useState<PlannerTodo[]>(() =>
    todoItemsFromPlanner(weather.planner.todos),
  );
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoPriority, setNewTodoPriority] =
    useState<TodoPriority>("medium");
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const isControlled = expanded !== undefined;
  const isExpanded = isControlled ? expanded : internalExpanded;
  const isRTL = activeLocale === "ar";
  const selectedTodo = todos.find((todo) => todo.id === selectedTodoId) ?? null;
  const generatedCalendarDays = useMemo(
    () => calendarDaysForMonth(visibleMonth, weather.planner.eventDates ?? []),
    [visibleMonth, weather.planner.eventDates],
  );

  const livePlanner: LightModeDropdownPlannerData = {
    ...weather.planner,
    ...clockParts(currentDate, activeLocale),
    dateLabel: currentDate.toLocaleDateString(localeCode[activeLocale], {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }),
    monthLabel: monthLabel(visibleMonth, activeLocale),
    weekDays: localizedWeekDays(activeLocale),
    calendarDays: generatedCalendarDays,
    todos,
  };

  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        if (!isControlled) setInternalExpanded(false);
        onExpandedChange?.(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!isControlled) setInternalExpanded(false);
        onExpandedChange?.(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isControlled, isExpanded, onExpandedChange]);

  useEffect(() => {
    const clockTimer = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => window.clearInterval(clockTimer);
  }, []);

  const setExpanded = (nextExpanded: boolean) => {
    if (!isControlled) setInternalExpanded(nextExpanded);
    onExpandedChange?.(nextExpanded);
  };

  const changeVisibleMonth = (monthOffset: number) => {
    setVisibleMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + monthOffset,
          1,
        ),
    );
  };

  const toggleTodo = (todoId: string) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const deleteTodo = (todoId: string) => {
    setTodos((currentTodos) =>
      currentTodos.filter((todo) => todo.id !== todoId),
    );
    setSelectedTodoId((currentTodoId) =>
      currentTodoId === todoId ? null : currentTodoId,
    );
  };

  const addTodo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTodoTitle.trim();
    const description = newTodoDescription.trim();
    if (!title) return;

    setTodos((currentTodos) => [
      ...currentTodos,
      {
        id: `todo-${Date.now()}`,
        title,
        description,
        time: currentDate.toLocaleTimeString(localeCode[activeLocale], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        priority: newTodoPriority,
        tone: priorityTone[newTodoPriority],
      },
    ]);
    setNewTodoTitle("");
    setNewTodoDescription("");
  };

  const updateTodo = (
    todoId: string,
    updates: Partial<LightModeDropdownTodo>,
  ) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              ...updates,
              tone: updates.priority
                ? priorityTone[updates.priority]
                : todo.tone,
            }
          : todo,
      ),
    );
  };

  return (
    <div
      ref={rootRef}
      className={cx("w-full mb-4 font-sans", className)}
      dir={isRTL ? "rtl" : "ltr"}
      style={{ fontFamily: "Inter, 'DM Sans', var(--font-somar), sans-serif" }}
    >
      <div className="relative">
        {!isExpanded ? (
          <CollapsedHeader
            weather={weather}
            text={text}
            panelId={panelId}
            onExpand={() => setExpanded(true)}
          />
        ) : (
          <ExpandedContent
            weather={{ ...weather, planner: livePlanner }}
            text={text}
            panelId={panelId}
            onCollapse={() => setExpanded(false)}
            onPreviousMonth={() => changeVisibleMonth(-1)}
            onNextMonth={() => changeVisibleMonth(1)}
            onResetMonth={() =>
              setVisibleMonth(
                new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
              )
            }
            newTodoTitle={newTodoTitle}
            onNewTodoTitleChange={setNewTodoTitle}
            newTodoDescription={newTodoDescription}
            onNewTodoDescriptionChange={setNewTodoDescription}
            newTodoPriority={newTodoPriority}
            onNewTodoPriorityChange={setNewTodoPriority}
            onAddTodo={addTodo}
            onOpenTodo={setSelectedTodoId}
            onToggleTodo={toggleTodo}
            onDeleteTodo={deleteTodo}
          />
        )}
      </div>
      <TodoDetailsModal
        todo={selectedTodo}
        text={text}
        locale={activeLocale}
        onUpdateTodo={updateTodo}
        onClose={() => setSelectedTodoId(null)}
      />
    </div>
  );
}

function CollapsedHeader({
  weather,
  text,
  panelId,
  onExpand,
}: {
  weather: LightModeDropdownData;
  text: LocalizedText;
  panelId: string;
  onExpand: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={false}
      aria-controls={panelId}
      onClick={onExpand}
      className="group w-full text-left"
    >
      <div className="rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <MapPin size={15} className="text-primary-500" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="truncate text-[15px] font-semibold leading-tight text-[#111827]">
                  {weather.location}
                </span>
                <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#9CA3AF]">
                  {weather.dateLabel}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold leading-none text-[#111827]">
                  {weather.temperature}
                </span>
                <span className="text-[13px] font-medium text-primary-500">
                  {weather.condition}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden items-center justify-center gap-2 sm:flex sm:flex-wrap">
            {weather.hints.map((hint) => (
              <HintChip key={hint.label} icon={hint.icon} label={hint.label} />
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden flex-col items-end gap-0.5 md:flex">
              <span className="text-[11px] text-[#9CA3AF]">
                {text.low}{" "}
                <span className="font-medium text-[#6B7280]">
                  {weather.lowTemperature}
                </span>
              </span>
              <span className="text-[11px] text-[#9CA3AF]">
                {text.feels}{" "}
                <span className="font-medium text-[#6B7280]">
                  {weather.feelsLike}
                </span>
              </span>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] transition-colors group-hover:bg-[#E5E7EB]">
              <ChevronDown size={16} className="text-[#6B7280]" />
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
          {weather.hints.map((hint) => (
            <HintChip key={hint.label} icon={hint.icon} label={hint.label} />
          ))}
        </div>
      </div>
    </button>
  );
}

function HintChip({ icon, label }: LightModeDropdownHint) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
      {icon}
      {label}
    </span>
  );
}

function ExpandedContent({
  weather,
  text,
  panelId,
  onCollapse,
  onPreviousMonth,
  onNextMonth,
  onResetMonth,
  newTodoTitle,
  onNewTodoTitleChange,
  newTodoDescription,
  onNewTodoDescriptionChange,
  newTodoPriority,
  onNewTodoPriorityChange,
  onAddTodo,
  onOpenTodo,
  onToggleTodo,
  onDeleteTodo,
}: {
  weather: LightModeDropdownData;
  text: LocalizedText;
  panelId: string;
  onCollapse: () => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onResetMonth: () => void;
  newTodoTitle: string;
  onNewTodoTitleChange: (title: string) => void;
  newTodoDescription: string;
  onNewTodoDescriptionChange: (description: string) => void;
  newTodoPriority: TodoPriority;
  onNewTodoPriorityChange: (priority: TodoPriority) => void;
  onAddTodo: (event: FormEvent<HTMLFormElement>) => void;
  onOpenTodo: (todoId: string) => void;
  onToggleTodo: (todoId: string) => void;
  onDeleteTodo: (todoId: string) => void;
}) {
  return (
    <div
      id={panelId}
      className="animate-fadeIn overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] shadow-md"
    >
      <button
        type="button"
        aria-expanded={true}
        aria-controls={panelId}
        onClick={onCollapse}
        className="group flex w-full items-center justify-between border-b border-[#E5E7EB] bg-white px-5 py-3.5 transition-colors hover:bg-[#F8FAFC]"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <MapPin size={13} className="text-primary-500" />
          </span>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-[#111827]">
              {weather.location}
            </span>
            <span className="hidden rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] text-[#9CA3AF] sm:inline">
              {weather.dateLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[12px] text-[#9CA3AF] sm:block">
            {text.collapse}
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3F4F6] transition-colors group-hover:bg-[#E5E7EB]">
            <ChevronUp size={15} className="text-[#6B7280]" />
          </span>
        </div>
      </button>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <TodoListCard
          todos={weather.planner.todos}
          text={text}
          newTodoTitle={newTodoTitle}
          onNewTodoTitleChange={onNewTodoTitleChange}
          newTodoDescription={newTodoDescription}
          onNewTodoDescriptionChange={onNewTodoDescriptionChange}
          newTodoPriority={newTodoPriority}
          onNewTodoPriorityChange={onNewTodoPriorityChange}
          onAddTodo={onAddTodo}
          onOpenTodo={onOpenTodo}
          onToggleTodo={onToggleTodo}
          onDeleteTodo={onDeleteTodo}
        />
        <MainWeatherCard weather={weather} text={text} />
        <ClockCard planner={weather.planner} text={text} />

        <OtherCountriesCard cities={weather.cities} text={text} />
        <ForecastCard forecast={weather.forecast} text={text} />
        <HighlightCard weather={weather} text={text} />

        <CalendarCard
          planner={weather.planner}
          text={text}
          onPreviousMonth={onPreviousMonth}
          onNextMonth={onNextMonth}
          onResetMonth={onResetMonth}
        />
      </div>
    </div>
  );
}

function MainWeatherCard({
  weather,
  text,
}: {
  weather: LightModeDropdownData;
  text: LocalizedText;
}) {
  return (
    <section className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-hover)] p-5 text-white">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative">
        <div className="mb-3 flex items-center gap-1.5">
          <MapPin size={13} className="opacity-80" />
          <span className="text-[13px] font-medium opacity-90">
            {weather.location}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="mb-1 text-5xl font-bold leading-none">
              {weather.temperature}
            </div>
            <div className="mb-3 text-[13px] font-medium opacity-80">
              {weather.condition}
            </div>
            <div className="flex flex-wrap gap-3 text-[12px] opacity-75">
              <span>
                {text.low} {weather.lowTemperature}
              </span>
              <span>
                {text.feels} {weather.feelsLike}
              </span>
            </div>
          </div>
          <div className="flex h-16 w-16 items-center justify-center">
            {weather.mainIcon}
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {weather.hints.map((hint) => (
          <span
            key={hint.label}
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium"
          >
            {hint.icon}
            {hint.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function HighlightCard({
  weather,
  text,
}: {
  weather: LightModeDropdownData;
  text: LocalizedText;
}) {
  return (
    <section className="h-full rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#111827]">
          {text.todaysHighlight}
        </h3>
        <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] text-[#9CA3AF]">
          {weather.compactDateLabel ?? weather.dateLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {weather.highlights.map((metric) => (
          <div
            key={metric.label}
            className={cx(
              "rounded-xl border p-3",
              toneClasses[metric.tone ?? "blue"],
            )}
          >
            <div className="mb-1.5">{metric.icon}</div>
            <div className="text-[15px] font-bold leading-tight text-[#111827]">
              {metric.value}
            </div>
            <div className="mt-0.5 text-[10px] text-[#6B7280]">
              {metric.label}
            </div>
            <div className="text-[10px] text-[#9CA3AF]">{metric.subLabel}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OtherCountriesCard({
  cities,
  text,
}: {
  cities: LightModeDropdownCity[];
  text: LocalizedText;
}) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <h3 className="mb-4 text-[14px] font-semibold text-[#111827]">
        {text.otherCountries}
      </h3>
      <div className="space-y-2">
        {cities.map((city) => (
          <div
            key={`${city.city}-${city.country}`}
            className="flex items-center justify-between border-b border-[#F3F4F6] py-2 last:border-0"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {city.flag && (
                <span className="grid h-7 min-w-7 place-items-center rounded-full bg-[#F3F4F6] px-1.5 text-[10px] font-semibold text-[#6B7280]">
                  {city.flag}
                </span>
              )}
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[#111827]">
                  {city.city}
                </div>
                <div className="text-[11px] text-[#9CA3AF]">{city.country}</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {city.icon}
              <div className="text-right">
                <div className="text-[13px] font-bold text-[#111827]">
                  {city.temp}
                </div>
                <div className="text-[10px] text-[#9CA3AF]">
                  {city.condition}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ForecastCard({
  forecast,
  text,
}: {
  forecast: LightModeDropdownForecastDay[];
  text: LocalizedText;
}) {
  const highs = forecast.map((day) => day.high);
  const lows = forecast.map((day) => day.low);
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const range = Math.max(maxHigh - minLow, 1);

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <h3 className="mb-4 text-[14px] font-semibold text-[#111827]">
        {text.tenDayForecast}
      </h3>
      <div className="space-y-1.5">
        {forecast.map((day) => {
          const lowPct = ((day.low - minLow) / range) * 100;
          const highPct = ((day.high - minLow) / range) * 100;

          return (
            <div
              key={`${day.day}-${day.high}-${day.low}`}
              className="flex items-center gap-3 py-1"
            >
              <span className="w-9 shrink-0 text-[12px] font-medium text-[#6B7280]">
                {day.day}
              </span>
              <div className="flex w-5 shrink-0 justify-center">{day.icon}</div>
              <span className="hidden w-20 shrink-0 text-[11px] text-[#9CA3AF] sm:block">
                {day.condition}
              </span>
              <span className="w-7 shrink-0 text-right text-[12px] font-medium text-[#6B7280]">
                {day.low}°
              </span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-blue-300 to-amber-400"
                  style={{
                    left: `${lowPct}%`,
                    width: `${Math.max(highPct - lowPct, 8)}%`,
                  }}
                />
              </div>
              <span className="w-7 shrink-0 text-[12px] font-semibold text-[#111827]">
                {day.high}°
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ClockCard({
  planner,
  text,
}: {
  planner: LightModeDropdownPlannerData;
  text: LocalizedText;
}) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
            <Clock3 size={16} className="text-primary-500" />
          </span>
          <h3 className="text-[14px] font-semibold text-[#111827]">
            {text.clock}
          </h3>
        </div>
        <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF]">
          {planner.timezone}
        </span>
      </div>
      <div className="flex flex-col items-center justify-between gap-5 flex-1 mx-auto w-1/2">
        <div>
          <div className="flex items-end gap-1.5">
            <span className="text-5xl font-bold leading-none text-[#111827]">
              {planner.time}
            </span>
            <span className="pb-1 text-[13px] font-semibold text-primary-500">
              {planner.period}
            </span>
          </div>
          <p className="mt-2 text-[12px] font-medium text-[#9CA3AF] text-center">
            {planner.dateLabel}
          </p>
        </div>

        <div className="relative h-24 w-24 shrink-0 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] shadow-inner">
          <span className="absolute left-1/2 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#CBD5E1]" />
          <span className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#CBD5E1]" />
          <span className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#CBD5E1]" />
          <span className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#CBD5E1]" />
          <span className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-full origin-bottom rotate-[30deg] rounded-full bg-[#111827]" />
          <span className="absolute left-1/2 top-1/2 h-10 w-0.5 -translate-x-1/2 -translate-y-full origin-bottom rotate-[130deg] rounded-full bg-primary-500" />
          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary-500 shadow-sm" />
        </div>
      </div>
    </section>
  );
}

function CalendarCard({
  planner,
  text,
  onPreviousMonth,
  onNextMonth,
  onResetMonth,
}: {
  planner: LightModeDropdownPlannerData;
  text: LocalizedText;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onResetMonth: () => void;
}) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
            <CalendarDays size={16} className="text-amber-500" />
          </span>
          <h3 className="text-[14px] font-semibold text-[#111827]">
            {text.calendar}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onPreviousMonth}
            aria-label={text.previousMonth}
            className="h-7 w-7 rounded-full bg-[#F3F4F6] p-0 text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onResetMonth}
            className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF] hover:bg-[#E5E7EB] hover:text-[#6B7280]"
          >
            {planner.monthLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onNextMonth}
            aria-label={text.nextMonth}
            className="h-7 w-7 rounded-full bg-[#F3F4F6] p-0 text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {planner.weekDays.map((weekDay, index) => (
          <span
            key={`${weekDay}-${index}`}
            className="grid h-7 place-items-center text-[11px] font-semibold text-[#9CA3AF]"
          >
            {weekDay}
          </span>
        ))}
        {planner.calendarDays.map((day, index) => (
          <span
            key={`${day.date}-${index}`}
            className={cx(
              "relative grid h-8 place-items-center rounded-full text-[12px] font-semibold",
              day.isToday
                ? "bg-primary-500 text-white shadow-sm"
                : day.isCurrentMonth
                  ? "text-[#111827] hover:bg-[#F3F4F6]"
                  : "text-[#CBD5E1]",
            )}
          >
            {day.date}
            {day.hasEvent && (
              <span
                className={cx(
                  "absolute bottom-1 h-1 w-1 rounded-full",
                  day.isToday ? "bg-white" : "bg-primary-500",
                )}
              />
            )}
          </span>
        ))}
      </div>
    </section>
  );
}

function TodoListCard({
  todos,
  text,
  newTodoTitle,
  onNewTodoTitleChange,
  newTodoDescription,
  onNewTodoDescriptionChange,
  newTodoPriority,
  onNewTodoPriorityChange,
  onAddTodo,
  onOpenTodo,
  onToggleTodo,
  onDeleteTodo,
}: {
  todos: LightModeDropdownTodo[];
  text: LocalizedText;
  newTodoTitle: string;
  onNewTodoTitleChange: (title: string) => void;
  newTodoDescription: string;
  onNewTodoDescriptionChange: (description: string) => void;
  newTodoPriority: TodoPriority;
  onNewTodoPriorityChange: (priority: TodoPriority) => void;
  onAddTodo: (event: FormEvent<HTMLFormElement>) => void;
  onOpenTodo: (todoId: string) => void;
  onToggleTodo: (todoId: string) => void;
  onDeleteTodo: (todoId: string) => void;
}) {
  const submitTodoFromKeyboard = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50">
            <ListTodo size={16} className="text-green-500" />
          </span>
          <h3 className="text-[14px] font-semibold text-[#111827]">
            {text.todoTitle}
          </h3>
        </div>
        <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF]">
          {todos.filter((todo) => todo.completed).length}/{todos.length}{" "}
          {text.done}
        </span>
      </div>

      <form onSubmit={onAddTodo} className="mb-3 space-y-2.5">
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="grid min-w-0 flex-1 gap-2">
            <Input
              value={newTodoTitle}
              onChange={(event) => onNewTodoTitleChange(event.target.value)}
              placeholder={text.addTitle}
              inputSize="sm"
              className="rounded-full border-[#E5E7EB] bg-[#F8FAFC] text-[13px] font-medium text-[#111827] focus:bg-white"
            />
            <TextArea
              value={newTodoDescription}
              onChange={(event) =>
                onNewTodoDescriptionChange(event.target.value)
              }
              onKeyDown={submitTodoFromKeyboard}
              placeholder={text.addDescription}
              rows={2}
              resize="none"
              className="rounded-2xl border-[#E5E7EB] bg-[#F8FAFC] text-[13px] font-medium text-[#111827] focus:bg-white"
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <Select
              value={newTodoPriority}
              onChange={(value) =>
                onNewTodoPriorityChange(value as TodoPriority)
              }
              options={priorityOptions(text)}
              placeholder={text.priority}
              fullWidth={false}
              selectSize="sm"
              className="h-10 rounded-full border-[#E5E7EB] bg-[#F8FAFC] text-[12px] font-semibold text-[#6B7280] focus:bg-white"
            />
            <Button
              type="submit"
              size="sm"
              leftIcon={<Plus size={14} />}
              className="h-10 rounded-full bg-primary-500 px-3.5 text-[12px] font-semibold hover:bg-blue-600"
            >
              {text.add}
            </Button>
          </div>
        </div>
        <p className="px-1 text-[11px] font-medium text-[#9CA3AF]">
          {text.inputHint}
        </p>
      </form>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {todos.map((todo) => {
          const priority = todo.priority ?? "medium";

          return (
            <div
              key={todo.id ?? `${todo.title}-${todo.time}`}
              role="button"
              tabIndex={0}
              onClick={() => todo.id && onOpenTodo(todo.id)}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && todo.id) {
                  event.preventDefault();
                  onOpenTodo(todo.id);
                }
              }}
              className={cx(
                "cursor-pointer rounded-xl border p-3 transition-transform hover:-translate-y-0.5 hover:shadow-sm",
                toneClasses[todo.tone ?? "blue"],
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[#9CA3AF]">
                    {todo.time}
                  </span>
                  <span
                    className={cx(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      priorityClasses[priority],
                    )}
                  >
                    {text.priorities[priority]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (todo.id) onToggleTodo(todo.id);
                    }}
                    aria-label={
                      todo.completed ? text.markIncomplete : text.markDone
                    }
                    className="h-6 w-6 p-0 text-[#CBD5E1] hover:bg-transparent hover:text-green-500"
                  >
                    {todo.completed ? (
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-green-500"
                      />
                    ) : (
                      <Circle size={16} className="shrink-0" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (todo.id) onDeleteTodo(todo.id);
                    }}
                    aria-label={text.deleteTask}
                    className="h-6 w-6 p-0 text-[#CBD5E1] hover:bg-transparent hover:text-rose-500"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
              <p
                className={cx(
                  "text-[13px] font-semibold leading-snug",
                  todo.completed ? "text-[#6B7280]" : "text-[#111827]",
                )}
              >
                {todo.title}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TodoDetailsModal({
  todo,
  text,
  locale,
  onUpdateTodo,
  onClose,
}: {
  todo: LightModeDropdownTodo | null;
  text: LocalizedText;
  locale: LightModeDropdownLocale;
  onUpdateTodo: (
    todoId: string,
    updates: Partial<LightModeDropdownTodo>,
  ) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen={!!todo}
      onClose={onClose}
      title={text.todoDetails}
      size="md"
      className="!rounded-2xl"
    >
      {todo && (
        <TodoDetailsModalContent
          key={todo.id}
          todo={todo}
          text={text}
          locale={locale}
          onClose={onClose}
          onUpdateTodo={onUpdateTodo}
        />
      )}
    </Modal>
  );
}

function TodoDetailsModalContent({
  todo,
  text,
  locale,
  onUpdateTodo,
  onClose,
}: {
  todo: LightModeDropdownTodo;
  text: LocalizedText;
  locale: LightModeDropdownLocale;
  onUpdateTodo: (
    todoId: string,
    updates: Partial<LightModeDropdownTodo>,
  ) => void;
  onClose: () => void;
}) {
  const priority = todo.priority ?? "medium";
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(todo.title);
  const [draftDescription, setDraftDescription] = useState(
    todo.description ?? "",
  );
  const [draftPriority, setDraftPriority] = useState<TodoPriority>(priority);
  const [draftCompleted, setDraftCompleted] = useState(!!todo.completed);

  const saveTodoChanges = () => {
    if (!todo.id || !draftTitle.trim()) return;

    onUpdateTodo(todo.id, {
      title: draftTitle.trim(),
      description: draftDescription.trim(),
      priority: draftPriority,
      completed: draftCompleted,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4 pb-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
            {text.time}: {todo.time}
          </span>
          <span
            className={cx(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              priorityClasses[isEditing ? draftPriority : priority],
            )}
          >
            {text.priority}:{" "}
            {text.priorities[isEditing ? draftPriority : priority]}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
            {text.status}:{" "}
            {(isEditing ? draftCompleted : todo.completed)
              ? text.completed
              : text.pending}
          </span>
        </div>
        {isEditing ? (
          <Input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            aria-label={text.title}
            variant="default"
            inputSize="sm"
            className="rounded-full border-[#E5E7EB] text-sm font-semibold text-[#111827]"
          />
        ) : (
          <h3 className="text-base font-semibold text-[#111827]">
            {todo.title}
          </h3>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
              {text.description}
            </span>
            <TextArea
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              rows={5}
              resize="none"
              className="rounded-2xl border-[#E5E7EB] text-sm leading-6 text-[#374151]"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                {text.priority}
              </span>
              <Select
                value={draftPriority}
                onChange={(value) => setDraftPriority(value as TodoPriority)}
                options={priorityOptions(text)}
                placeholder={text.priority}
                selectSize="sm"
                className="h-10 rounded-full border-[#E5E7EB] bg-white text-sm font-semibold text-[#6B7280]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                {text.status}
              </span>
              <Select
                value={draftCompleted ? "completed" : "pending"}
                onChange={(value) => setDraftCompleted(value === "completed")}
                options={[
                  { value: "pending", label: text.pending },
                  { value: "completed", label: text.completed },
                ]}
                placeholder={text.status}
                selectSize="sm"
                className="h-10 rounded-full border-[#E5E7EB] bg-white text-sm font-semibold text-[#6B7280]"
              />
            </label>
          </div>
        </div>
      ) : (
        <div>
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            {text.description}
          </h4>
          <p className="whitespace-pre-wrap rounded-2xl border border-[#E5E7EB] bg-white p-4 text-sm leading-6 text-[#374151]">
            {todo.description || todo.title}
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-[#F3F4F6] pt-4">
        {isEditing ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="rounded-full border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F8FAFC]"
            >
              {text.cancel}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveTodoChanges}
              disabled={!draftTitle.trim()}
              className="rounded-full bg-primary-500 text-white hover:bg-blue-600"
            >
              {text.save}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="rounded-full border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F8FAFC]"
            >
              {text.edit}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className="rounded-full bg-primary-500 text-white hover:bg-blue-600"
            >
              {text.close}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export { defaultWeatherData };
