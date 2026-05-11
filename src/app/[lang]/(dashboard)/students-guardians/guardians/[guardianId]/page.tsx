"use client";

import { useEffect, useState, use } from "react";
import OverviewTab from "@/features/students-guardians/guardians/components/tabs/OverviewTab";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { notFound } from "next/navigation";
import type { StudentGuardian } from "@/features/students-guardians/students/types";

interface GuardianProfilePageProps {
  params: Promise<{
    guardianId: string;
    lang: string;
  }>;
}

export default function GuardianProfile({
  params,
}: GuardianProfilePageProps) {
  const { guardianId } = use(params);
  const [guardian, setGuardian] = useState<StudentGuardian | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadGuardian = async () => {
      try {
        const data = await studentsService.fetchGuardianById(guardianId);
        if (mounted) {
          if (!data) {
            setIsNotFound(true);
          } else {
            setGuardian(data);
          }
        }
      } catch {
        if (mounted) {
          setIsNotFound(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadGuardian();

    return () => {
      mounted = false;
    };
  }, [guardianId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#036b80]"></div>
      </div>
    );
  }

  if (isNotFound) {
    notFound();
  }

  if (!guardian) {
    return null;
  }

  return <OverviewTab guardian={guardian} />;
}
