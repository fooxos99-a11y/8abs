"use client"
import React, { Suspense } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import { GlobalBulkAddStudentDialog } from "./admin-modals/global-bulk-add-student-dialog"
import { GlobalStudentRecordsDialog } from "./admin-modals/global-student-records-dialog"

function AdminModalsContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const action = searchParams?.get("action")

  

  return (
    <>
      {action === 'student-records' && <GlobalStudentRecordsDialog />}
      {action === 'bulk-add' && <GlobalBulkAddStudentDialog />}

      
      
      
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
