"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock3,
  ListTodo,
  Plus,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import Button from "../button/Button";
import Input from "../input/Input";
import Select, { SelectOption } from "../input/Select";
import {
  createDashboardTodo,
  deleteDashboardTodo,
  fetchLightModeDropdown,
  updateDashboardTodo,
  type DashboardLightModeDropdownResponse,
  type DashboardTodo,
} from "@/features/dashboard/services/dashboardApiService";

export type LightModeDropdownLocale = "en" | "ar";
export type TodoPriority = "low" | "medium" | "high";
export type WeatherTone = "amber" | "blue" | "green" | "purple" | "rose" | "sky";
export interface LightModeDropdownHint { label: string; }
export interface LightModeDropdownMetric { label: string; value: string; subLabel: string; }
export interface LightModeDropdownCity { city: string; country: string; temp: string; condition: string; }
export interface LightModeDropdownForecastDay { day: string; high: number; low: number; condition: string; }
export interface LightModeDropdownCalendarDay { date: number; }

export interface LightModeDropdownTodo {
  id?: string;
  title: string;
  description?: string;
  time: string;
  completed?: boolean;
  priority?: TodoPriority;
}

export interface LightModeDropdownPlannerData {
  date?: string;
  timezone: string;
  eventDates?: string[];
  todos: LightModeDropdownTodo[];
}

export interface LightModeDropdownData {
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

interface LocalizedText {
  collapse: string;
  previousDay: string;
  nextDay: string;
  today: string;
  agenda: string;
  todoTitle: string;
  done: string;
  addTitle: string;
  add: string;
  priority: string;
  pending: string;
  markDone: string;
  markIncomplete: string;
  deleteTask: string;
  priorities: Record<TodoPriority, string>;
}

const localeCode: Record<LightModeDropdownLocale, string> = {
  en: "en-US",
  ar: "ar-EG",
};

const priorityClasses: Record<TodoPriority, string> = {
  low: "border-emerald-100 bg-emerald-50 text-emerald-700",
  medium: "border-amber-100 bg-amber-50 text-amber-700",
  high: "border-rose-100 bg-rose-50 text-rose-700",
};

function localizedTextFromMessages(
  t: ReturnType<typeof useTranslations>,
): LocalizedText {
  return {
    collapse: t("collapse"),
    previousDay: t("previousDay"),
    nextDay: t("nextDay"),
    today: t("today"),
    agenda: t("agenda"),
    todoTitle: t("todoTitle"),
    done: t("done"),
    addTitle: t("addTitle"),
    add: t("add"),
    priority: t("priority"),
    pending: t("pending"),
    markDone: t("markDone"),
    markIncomplete: t("markIncomplete"),
    deleteTask: t("deleteTask"),
    priorities: {
      low: t("priorities.low"),
      medium: t("priorities.medium"),
      high: t("priorities.high"),
    },
  };
}

function priorityOptions(text: LocalizedText): SelectOption[] {
  return (Object.keys(text.priorities) as TodoPriority[]).map((priority) => ({
    value: priority,
    label: text.priorities[priority],
  }));
}

function civilDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapPlannerResponse(
  response: DashboardLightModeDropdownResponse,
  locale: LightModeDropdownLocale,
): LightModeDropdownPlannerData {
  return {
    date: response.planner.date,
    timezone: response.location?.timezone ?? "",
    eventDates: response.planner.eventDates ?? [],
    todos: response.planner.todos.map((todo: DashboardTodo) => ({
      id: todo.todoId,
      title: todo.title,
      description: todo.notes ?? "",
      time: todo.createdAt
        ? new Date(todo.createdAt).toLocaleTimeString(localeCode[locale], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      completed: todo.status === "completed",
      priority: todo.priority === "normal" ? "medium" : todo.priority,
    })),
  };
}

function emptyPlanner(weatherData?: Partial<LightModeDropdownData>) {
  return weatherData?.planner ?? {
    date: civilDate(new Date()),
    timezone: "",
    eventDates: [],
    todos: [],
  };
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
  const [planner, setPlanner] = useState<LightModeDropdownPlannerData>(() =>
    emptyPlanner(weatherData),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoPriority, setNewTodoPriority] =
    useState<TodoPriority>("medium");
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isControlled = expanded !== undefined;
  const isExpanded = isControlled ? expanded : internalExpanded;
  const isRTL = activeLocale === "ar";
  const todos = useMemo(
    () => [...planner.todos].sort(compareTodos),
    [planner.todos],
  );
  const pendingCount = todos.filter((todo) => !todo.completed).length;

  useEffect(() => {
    let active = true;

    async function loadPlanner() {
      setIsLoading(true);
      try {
        const response = await fetchLightModeDropdown({
          locale: activeLocale,
          date: civilDate(selectedDate),
        });
        if (active) setPlanner(mapPlannerResponse(response, activeLocale));
      } catch (error) {
        console.error("Failed to load planner data:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadPlanner();
    return () => {
      active = false;
    };
  }, [activeLocale, selectedDate]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isExpanded) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        if (!isControlled) setInternalExpanded(false);
        onExpandedChange?.(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!isControlled) setInternalExpanded(false);
        onExpandedChange?.(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isControlled, isExpanded, onExpandedChange]);

  function setExpanded(nextExpanded: boolean) {
    if (!isControlled) setInternalExpanded(nextExpanded);
    onExpandedChange?.(nextExpanded);
  }

  function moveSelectedDate(dayOffset: number) {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + dayOffset);
    setSelectedDate(nextDate);
  }

  async function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTodoTitle.trim();
    if (!title) return;

    const response = await createDashboardTodo({
      date: planner.date ?? civilDate(selectedDate),
      title,
      notes: null,
      priority: newTodoPriority === "medium" ? "normal" : newTodoPriority,
    });
    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      todos: [...currentPlanner.todos, mapTodo(response.todo, activeLocale)],
    }));
    setNewTodoTitle("");
  }

  async function toggleTodo(todoId: string) {
    const todo = planner.todos.find((currentTodo) => currentTodo.id === todoId);
    if (!todo) return;

    const nextCompleted = !todo.completed;
    setPlanner((currentPlanner) => updatePlannerTodo(currentPlanner, todoId, {
      completed: nextCompleted,
    }));
    try {
      await updateDashboardTodo(todoId, {
        status: nextCompleted ? "completed" : "pending",
      });
    } catch (error) {
      console.error("Failed to toggle todo:", error);
      setPlanner((currentPlanner) => updatePlannerTodo(currentPlanner, todoId, {
        completed: todo.completed,
      }));
    }
  }

  async function removeTodo(todoId: string) {
    const todo = planner.todos.find((currentTodo) => currentTodo.id === todoId);
    if (!todo) return;

    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      todos: currentPlanner.todos.filter((currentTodo) => currentTodo.id !== todoId),
    }));
    try {
      await deleteDashboardTodo(todoId);
    } catch (error) {
      console.error("Failed to delete todo:", error);
      setPlanner((currentPlanner) => ({
        ...currentPlanner,
        todos: [...currentPlanner.todos, todo],
      }));
    }
  }

  return (
    <div ref={rootRef} className={`mb-4 w-full ${className ?? ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {isExpanded ? (
        <ExpandedPlanner
          panelId={panelId}
          text={text}
          locale={activeLocale}
          planner={planner}
          todos={todos}
          pendingCount={pendingCount}
          selectedDate={selectedDate}
          currentTime={currentTime}
          isLoading={isLoading}
          newTodoTitle={newTodoTitle}
          newTodoPriority={newTodoPriority}
          onCollapse={() => setExpanded(false)}
          onPreviousDay={() => moveSelectedDate(-1)}
          onNextDay={() => moveSelectedDate(1)}
          onToday={() => setSelectedDate(new Date())}
          onNewTodoTitleChange={setNewTodoTitle}
          onNewTodoPriorityChange={setNewTodoPriority}
          onAddTodo={addTodo}
          onToggleTodo={toggleTodo}
          onDeleteTodo={removeTodo}
        />
      ) : (
        <CollapsedPlanner
          panelId={panelId}
          text={text}
          locale={activeLocale}
          selectedDate={selectedDate}
          currentTime={currentTime}
          pendingCount={pendingCount}
          totalCount={todos.length}
          eventCount={planner.eventDates?.length ?? 0}
          onExpand={() => setExpanded(true)}
        />
      )}
    </div>
  );
}

function CollapsedPlanner({
  panelId,
  text,
  locale,
  selectedDate,
  currentTime,
  pendingCount,
  totalCount,
  eventCount,
  onExpand,
}: {
  panelId: string;
  text: LocalizedText;
  locale: LightModeDropdownLocale;
  selectedDate: Date;
  currentTime: Date;
  pendingCount: number;
  totalCount: number;
  eventCount: number;
  onExpand: () => void;
}) {
  return (
    <button type="button" aria-expanded={false} aria-controls={panelId} onClick={onExpand} className="group w-full cursor-pointer text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-2xl">
      <div className="flex flex-col gap-4 rounded-2xl border border-primary-100 bg-[linear-gradient(115deg,#ffffff,#f0fbfc)] px-5 py-4 shadow-[0_10px_30px_rgba(3,107,128,0.08)] transition-shadow duration-200 hover:shadow-[0_16px_36px_rgba(3,107,128,0.14)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm"><ListTodo size={19} /></span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-gray-950">{text.agenda}</p>
            <p className="mt-0.5 truncate text-xs font-medium text-gray-600">{selectedDate.toLocaleDateString(localeCode[locale], { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiveClock time={currentTime} locale={locale} compact />
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">{pendingCount} {text.pending}</span>
          {eventCount ? <span className="rounded-full border border-primary-100 bg-white px-3 py-1.5 text-xs font-bold text-primary-700">{eventCount} {text.agenda}</span> : null}
          <span className="hidden text-xs font-semibold text-gray-500 sm:inline">{totalCount} {text.todoTitle}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 transition-colors group-hover:bg-primary-50 group-hover:text-primary"><ChevronDown size={17} /></span>
        </div>
      </div>
    </button>
  );
}

function ExpandedPlanner({
  panelId,
  text,
  locale,
  planner,
  todos,
  pendingCount,
  selectedDate,
  currentTime,
  isLoading,
  newTodoTitle,
  newTodoPriority,
  onCollapse,
  onPreviousDay,
  onNextDay,
  onToday,
  onNewTodoTitleChange,
  onNewTodoPriorityChange,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}: {
  panelId: string;
  text: LocalizedText;
  locale: LightModeDropdownLocale;
  planner: LightModeDropdownPlannerData;
  todos: LightModeDropdownTodo[];
  pendingCount: number;
  selectedDate: Date;
  currentTime: Date;
  isLoading: boolean;
  newTodoTitle: string;
  newTodoPriority: TodoPriority;
  onCollapse: () => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onNewTodoTitleChange: (title: string) => void;
  onNewTodoPriorityChange: (priority: TodoPriority) => void;
  onAddTodo: (event: FormEvent<HTMLFormElement>) => void;
  onToggleTodo: (todoId: string) => void;
  onDeleteTodo: (todoId: string) => void;
}) {
  return (
    <section id={panelId} className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.09)]">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-[linear-gradient(115deg,#ffffff,#f0fbfc)] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"><ListTodo size={17} /></span>
          <div>
            <h2 className="text-base font-extrabold text-gray-950">{text.agenda}</h2>
            <p className="mt-0.5 text-xs font-medium text-gray-600">{pendingCount} {text.pending} · {planner.timezone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiveClock time={currentTime} locale={locale} />
          <button type="button" onClick={onCollapse} aria-label={text.collapse} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"><ChevronUp size={17} /></button>
        </div>
      </header>

      <div className="border-b border-gray-100 px-5 py-3">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
          <button type="button" onClick={onPreviousDay} aria-label={text.previousDay} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm transition-colors hover:bg-primary-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"><ChevronLeft size={16} /></button>
          <button type="button" onClick={onToday} className="min-w-0 rounded-lg px-3 py-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer">
            <span className="block truncate text-sm font-bold text-gray-950">{selectedDate.toLocaleDateString(localeCode[locale], { weekday: "long", day: "numeric", month: "long" })}</span>
            <span className="mt-0.5 block text-xs font-semibold text-primary">{text.today}</span>
          </button>
          <button type="button" onClick={onNextDay} aria-label={text.nextDay} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm transition-colors hover:bg-primary-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <form onSubmit={onAddTodo} className="flex flex-col gap-2 sm:flex-row">
          <Input value={newTodoTitle} onChange={(event) => onNewTodoTitleChange(event.target.value)} placeholder={text.addTitle} inputSize="sm" className="min-w-0 flex-1 rounded-xl border-gray-200 bg-gray-50 text-sm font-medium text-gray-950 focus:bg-white" />
          <Select value={newTodoPriority} onChange={(value) => onNewTodoPriorityChange(value as TodoPriority)} options={priorityOptions(text)} placeholder={text.priority} fullWidth={false} selectSize="sm" className="rounded-xl border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700" />
          <Button type="submit" size="sm" leftIcon={<Plus size={15} />} className="rounded-xl bg-primary px-4 text-xs font-bold text-white hover:bg-hover">{text.add}</Button>
        </form>

        <div className="space-y-2" aria-live="polite">
          {isLoading ? <PlannerLoading /> : todos.length ? todos.map((todo) => <TodoRow key={todo.id} todo={todo} text={text} onToggleTodo={onToggleTodo} onDeleteTodo={onDeleteTodo} />) : <EmptyTasks text={text} />}
        </div>
      </div>
    </section>
  );
}

function TodoRow({ todo, text, onToggleTodo, onDeleteTodo }: { todo: LightModeDropdownTodo; text: LocalizedText; onToggleTodo: (todoId: string) => void; onDeleteTodo: (todoId: string) => void }) {
  const priority = todo.priority ?? "medium";
  return <article className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 transition-colors duration-200 hover:border-primary-200 hover:bg-primary-50/20"><button type="button" onClick={() => todo.id && onToggleTodo(todo.id)} disabled={!todo.id} aria-label={todo.completed ? text.markIncomplete : text.markDone} className="shrink-0 text-gray-300 transition-colors hover:text-emerald-600 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-full cursor-pointer">{todo.completed ? <CheckCircle2 size={19} className="text-emerald-500" /> : <Circle size={19} />}</button><div className="min-w-0 flex-1"><p className={`truncate text-sm font-bold ${todo.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>{todo.title}</p>{todo.time ? <p className="mt-0.5 text-xs text-gray-500">{todo.time}</p> : null}</div><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${priorityClasses[priority]}`}>{text.priorities[priority]}</span><button type="button" onClick={() => todo.id && onDeleteTodo(todo.id)} disabled={!todo.id} aria-label={text.deleteTask} className="shrink-0 text-gray-300 transition-colors hover:text-rose-600 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded cursor-pointer"><Trash2 size={16} /></button></article>;
}

function PlannerLoading() {
  return <><div className="h-16 animate-pulse rounded-xl bg-gray-100" /><div className="h-16 animate-pulse rounded-xl bg-gray-100" /></>;
}

function LiveClock({ time, locale, compact = false }: { time: Date; locale: LightModeDropdownLocale; compact?: boolean }) {
  const formattedTime = time.toLocaleTimeString(localeCode[locale], {
    hour: "2-digit",
    minute: "2-digit",
    second: compact ? undefined : "2-digit",
  });

  return (
    <span aria-live="polite" className={`inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white py-1.5 font-bold text-primary-700 shadow-sm ${compact ? "pe-2 ps-1 text-xs" : "pe-3 ps-1.5 text-sm"}`}>
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm ${compact ? "h-6 w-6" : "h-7 w-7"}`}>
        <Clock3 size={compact ? 13 : 15} strokeWidth={2.5} />
      </span>
      {formattedTime}
    </span>
  );
}

function EmptyTasks({ text }: { text: LocalizedText }) {
  return <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center"><CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" /><p className="mt-2 text-sm font-bold text-gray-800">0 {text.pending}</p><p className="mt-1 text-xs text-gray-500">{text.todoTitle}</p></div>;
}

function compareTodos(firstTodo: LightModeDropdownTodo, secondTodo: LightModeDropdownTodo) {
  if (firstTodo.completed !== secondTodo.completed) return firstTodo.completed ? 1 : -1;
  return priorityValue(secondTodo.priority) - priorityValue(firstTodo.priority);
}

function priorityValue(priority: TodoPriority | undefined) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function mapTodo(todo: DashboardTodo, locale: LightModeDropdownLocale): LightModeDropdownTodo {
  return {
    id: todo.todoId,
    title: todo.title,
    description: todo.notes ?? "",
    time: new Date(todo.createdAt).toLocaleTimeString(localeCode[locale], { hour: "2-digit", minute: "2-digit" }),
    completed: todo.status === "completed",
    priority: todo.priority === "normal" ? "medium" : todo.priority,
  };
}

function updatePlannerTodo(planner: LightModeDropdownPlannerData, todoId: string, updates: Partial<LightModeDropdownTodo>) {
  return { ...planner, todos: planner.todos.map((todo) => todo.id === todoId ? { ...todo, ...updates } : todo) };
}

export const defaultWeatherData: LightModeDropdownData = {
  planner: emptyPlanner(),
};
