"use client"
import React, { Suspense } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import { GlobalBulkAddStudentDialog } from "./admin-modals/global-bulk-add-student-dialog"
import { GlobalRemoveStudentDialog } from "./admin-modals/global-remove-student-dialog"
import { GlobalMoveStudentDialog } from "./admin-modals/global-move-student-dialog"
import { GlobalEditStudentDialog } from "./admin-modals/global-edit-student-dialog"
import { GlobalEditPointsDialog } from "./admin-modals/global-edit-points-dialog"
import { GlobalStudentRecordsDialog } from "./admin-modals/global-student-records-dialog"

function AdminModalsContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const action = searchParams?.get("action")

  if (pathname === "/admin/dashboard") return null;

  return (
    <>
      {action === "bulk-add" && <GlobalBulkAddStudentDialog />}
      {action === "remove-student" && <GlobalRemoveStudentDialog />}
      {action === "transfer-student" && <GlobalMoveStudentDialog />}
      {action === "edit-student" && <GlobalEditStudentDialog />}
      {action === "edit-points" && <GlobalEditPointsDialog />}
      {action === "student-records" && <GlobalStudentRecordsDialog />}
    </>
  )
}

export function GlobalAdminModals() {
  return (
    <Suspense fallback={null}>
      <AdminModalsContent />
    </Suspense>
  )
}
