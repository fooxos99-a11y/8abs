import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getSessionContent, calculateTotalPages, calculateTotalDays } from "@/lib/quran-data"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id")

    if (!studentId) {
      return NextResponse.json({ error: "Missing student_id" }, { status: 400 })
    }

    // 1. Get the current active plan
    const { data: plans } = await supabase
      .from("student_plans")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)

    if (!plans || plans.length === 0 || !plans[0].start_date) {
      return NextResponse.json({ missedDays: [] }) // No active plan
    }

    const plan = plans[0]

    // 2. Get attendance records from start_date to yesterday
    const today = new Date()
    const saDate = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Riyadh" }))
    saDate.setDate(saDate.getDate() - 1) // yesterday
    const yesterdayStr = saDate.toISOString().split("T")[0]

    const startDate = new Date(plan.start_date)

    if (startDate > saDate) {
        return NextResponse.json({ missedDays: [] }) // Plan starts in the future or started today
    }

    const { data: attendanceRecords } = await supabase
      .from("attendance_records")
      .select("id, date, status, evaluations(hafiz_level)")
      .eq("student_id", studentId)
      .gte("date", plan.start_date)
      .lte("date", yesterdayStr)
      .order("date", { ascending: true })

    const POSITIVE_LEVELS = ["excellent", "good", "very_good", "average"]
    
    // Create a Set of completed dates
    const completedDates = new Set()
    
    if (attendanceRecords) {
        for (const r of attendanceRecords) {
            if (r.status === "present") {
                const evals = Array.isArray(r.evaluations) ? r.evaluations : r.evaluations ? [r.evaluations] : []
                if (evals.length > 0) {
                    const ev = evals[evals.length - 1]
                    if (POSITIVE_LEVELS.includes(ev.hafiz_level ?? "")) {
                        completedDates.add(r.date)
                    }
                }
            }
        }
    }

    // Get the total completed days up to TODAY (to calculate what day they are ACTUALLY ON in terms of the plan's session index)
    // Wait, the missed days should show what exact portion of the plan they missed? "حفظ الايام بالترتيب"
    // So if they missed 3 days, it will show plan sessions for those days?
    // Actually, "حفظ الايام" simply means the content of the sessions they missed.
    // If they completed 5 sessions, the 6th session is their next one. If they have 3 missed dates, the sessions to compensate would be session 6, 7, 8!
    // Why? Because the plan is purely a sequence! The missed date is just a date, but the *content* to compensate is the next uncompleted sessions.
    
    // Fetch total lifetime completed days:
    let totalCompleted = 0;
    const { data: allAtt } = await supabase
      .from("attendance_records")
      .select("status, evaluations(hafiz_level)")
      .eq("student_id", studentId)
      .gte("date", plan.start_date)

    if (allAtt) {
        for (const r of allAtt) {
            if (r.status === "present") {
                const evals = Array.isArray(r.evaluations) ? r.evaluations : r.evaluations ? [r.evaluations] : []
                if (evals.length > 0) {
                    const ev = evals[evals.length - 1]
                    if (POSITIVE_LEVELS.includes(ev.hafiz_level ?? "")) {
                        totalCompleted++
                    }
                }
            }
        }
    }

    let missedDaysList = []
    
    // Iterate from start_date to yesterday
    let d = new Date(plan.start_date)
    let sessionCounter = totalCompleted + 1; // start compensating from the current uncompleted sequence!

    while (d <= saDate) {
        const dStr = d.toISOString().split("T")[0]
        const dayOfWeek = d.getDay() // 0: Sunday, 1: Monday, ..., 5: Friday, 6: Saturday
        
        // Skip Friday (5) and Saturday (6)
        if (dayOfWeek !== 5 && dayOfWeek !== 6) {
            if (!completedDates.has(dStr)) {
                // This date is a missed date. What is the content?
                // The content is sessionCounter.
                
                // Generate the content text for sessionCounter:
                const sSurahs = require("@/lib/quran-data").SURAHS;
                const startSurahData = sSurahs.find((s: any) => s.number === Math.min(plan.start_surah_number, plan.end_surah_number))
                const planStartPage = startSurahData?.startPage || 1
                const dir = plan.direction || "asc";
                const dailyStr = String(plan.daily_pages)
                const daily = dailyStr === "0.3333" ? 0.3333 : dailyStr === "0.25" ? 0.25 : plan.daily_pages;

                const sessionContent = getSessionContent(planStartPage, daily, sessionCounter, plan.total_pages, dir)
                
                missedDaysList.push({
                    date: dStr,
                    sessionIndex: sessionCounter,
                    content: sessionContent.text
                })
                
                sessionCounter++;
            }
        }
        d.setDate(d.getDate() + 1)
    }

    return NextResponse.json({ missedDays: missedDaysList })
  } catch (error: any) {
    console.error("[compensation error]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
