"use client"

import StudentsAchievementsAdmin from "../students-achievements.tsx";
import { useAdminAuth } from "@/hooks/use-admin-auth"

export default function StudentsAchievementsAdminPage() {
  const { isLoading, isVerified } = useAdminAuth("إدارة الطلاب");

  if (isLoading || !isVerified) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
    </div>
  );

  return <StudentsAchievementsAdmin />;
}
