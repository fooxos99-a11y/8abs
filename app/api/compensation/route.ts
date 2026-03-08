import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST /api/compensation
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { student_id, teacher_id, halaqah, date } = await request.json()

    if (!student_id || !teacher_id || !halaqah || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. تحقق إذا كان يوجد سجل غياب أو مستأذن لهذا اليوم
    const { data: existingRecord } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("student_id", student_id)
      .eq("date", date)
      .maybeSingle()

    let recordId;
    if (existingRecord) {
      // تحديث إلى حاضر
      await supabase
        .from("attendance_records")
        .update({ status: "present", is_compensation: true })
        .eq("id", existingRecord.id)
      recordId = existingRecord.id
    } else {
      // إدخال جديد
      const { data: newRecord, error: insertError } = await supabase
        .from("attendance_records")
        .insert({
          student_id,
          teacher_id,
          halaqah,
          date,
          status: "present",
          is_compensation: true
        })
        .select("id")
        .single()
      
      if (insertError) throw insertError
      recordId = newRecord.id
    }

    // 2. إعطاء تقييم جيد للحفظ
    await supabase.from("evaluations").upsert({
      attendance_record_id: recordId,
      hafiz_level: "good",
      notes: "تم تعويض الحفظ"
    }, { onConflict: "attendance_record_id" })

    // 3. إضافة 10 نقاط للطالب
    const { data: studentData } = await supabase
      .from("students")
      .select("points")
      .eq("id", student_id)
      .single()

    const newPoints = (studentData?.points || 0) + 10
    await supabase
      .from("students")
      .update({ points: newPoints })
      .eq("id", student_id)

    return NextResponse.json({ success: true, pointsAdded: 10, newPoints })
  } catch (error: any) {
    console.error("[compensation error]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
