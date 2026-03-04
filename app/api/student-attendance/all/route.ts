import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()

  // جلب جميع الطلاب
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, name, account_number, halaqah")
    .order("account_number", { ascending: true })

  if (studentsError) {
    return NextResponse.json({ error: "فشل في جلب الطلاب" }, { status: 500 })
  }

  // جلب جميع سجلات الحضور
  const { data: attendance, error: attendanceError } = await supabase
    .from("attendance_records")
    .select("id, student_id, date, status, created_at, notes")

  if (attendanceError) {
    return NextResponse.json({ error: "فشل في جلب سجلات الحضور" }, { status: 500 })
  }

  // دعم فلترة حسب تاريخ محدد (يأتي من الكويري باراميتر)
  // إذا لم يوجد باراميتر، استخدم تاريخ اليوم بتوقيت السعودية
  const url = new URL(request.url)
  let selectedDate = url.searchParams.get("date")
  if (!selectedDate) {
    const now = new Date()
    const saDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Riyadh" }))
    selectedDate = saDate.toISOString().split("T")[0]
  }


  // جلب جميع التقييمات لهذا اليوم
  const { data: evaluations, error: evalError } = await supabase
    .from("evaluations")
    .select("attendance_record_id, hafiz_level, tikrar_level, samaa_level, rabet_level")

  if (evalError) {
    console.error("Supabase evaluations error:", evalError)
    return NextResponse.json({ error: "فشل في جلب التقييمات: " + evalError.message }, { status: 500 })
  }

  // لكل الطلاب، ابحث عن سجل حضور في التاريخ المطلوب، وأضف التقييمات إن وجدت
  const records = students.map((student) => {
    const rec = (attendance || []).find((r) => r.student_id === student.id && r.date === selectedDate)
    let evalRec = null;
    if (rec) {
      evalRec = (evaluations || []).find((e) => e.attendance_record_id === rec.id)
    }
    if (rec) {
      return {
        id: rec.id,
        student_id: student.id,
        student_name: student.name,
        account_number: student.account_number,
        halaqah: student.halaqah,
        attendance_date: rec.date,
        status: rec.status,
        created_at: rec.created_at,
        notes: rec.notes ?? null,
        hafiz_level: evalRec?.hafiz_level ?? null,
        tikrar_level: evalRec?.tikrar_level ?? null,
        samaa_level: evalRec?.samaa_level ?? null,
        rabet_level: evalRec?.rabet_level ?? null,
      }
    } else {
      return {
        id: `no-record-${student.id}-${selectedDate}`,
        student_id: student.id,
        student_name: student.name,
        account_number: student.account_number,
        halaqah: student.halaqah,
        attendance_date: selectedDate,
        status: null,
        created_at: null,
        notes: null,
        hafiz_level: null,
        tikrar_level: null,
        samaa_level: null,
        rabet_level: null,
      }
    }
  })

  return NextResponse.json({ records })
}
