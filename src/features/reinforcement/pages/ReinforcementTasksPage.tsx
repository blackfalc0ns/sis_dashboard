"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementTasksFilters from "../components/filters/ReinforcementTasksFilters";
import ReinforcementTasksTable from "../components/tables/ReinforcementTasksTable";
import type { ReinforcementTask, ReinforcementTaskFilters } from "../types/reinforcement";
import {
  archiveTask,
  duplicateTask,
  getReinforcementFilterOptions,
  getReinforcementTasks,
} from "../services/reinforcementService";
import { downloadCsv } from "../libs/reinforcementCsv";

export default function ReinforcementTasksPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("reinforcement");
  const [tasks, setTasks] = useState<ReinforcementTask[]>([]);
  const [filters, setFilters] = useState<ReinforcementTaskFilters>({
    source: "all",
    status: "all",
    rewardType: "all",
  });
  const [students, setStudents] = useState<Array<{ studentId: string; studentName: string }>>([]);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    getReinforcementFilterOptions().then((options) => {
      setStudents(options.students);
      setClasses(options.classes);
    });
  }, []);

  useEffect(() => {
    getReinforcementTasks(filters).then(setTasks);
  }, [filters]);

  const exportRows = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id,
        task: locale === "ar" ? task.titleAr : task.titleEn,
        student: task.studentName,
        class: task.className || "",
        source: task.source,
        status: task.status,
        rewardType: task.rewardType,
        dueDate: task.dueDate || "",
      })),
    [locale, tasks],
  );

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <ReinforcementPageHeader
        title={t("tasks")}
        description={t("tasksDescription")}
        actions={
          <Button
            variant="secondary"
            onClick={() => downloadCsv("reinforcement-tasks.csv", exportRows)}
          >
            {t("actions.exportCsv")}
          </Button>
        }
      />

      <ReinforcementTasksFilters
        filters={filters}
        onChange={setFilters}
        studentOptions={students.map((student) => ({
          value: student.studentId,
          label: student.studentName,
        }))}
        classOptions={classes.map((className) => ({ value: className, label: className }))}
      />

      <ReinforcementTasksTable
        tasks={tasks}
        onRowClick={(task) => router.push(`/${locale}/reinforcement/tasks/${task.id}`)}
        onReview={(task) => router.push(`/${locale}/reinforcement/tasks/${task.id}`)}
        onDuplicate={async (task) => {
          await duplicateTask(task.id);
          getReinforcementTasks(filters).then(setTasks);
        }}
        onArchive={async (task) => {
          await archiveTask(task.id);
          getReinforcementTasks(filters).then(setTasks);
        }}
      />
    </div>
  );
}
