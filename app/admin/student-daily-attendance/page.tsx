
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "lucide-react"

function translateLevel(level: string | null | undefined) {
  if (!level) return null;
  switch (level) {
    case "excellent": return "ممتاز";
    case "very_good": return "جيد جدًا";
    case "good": return "جيد";
    case "not_completed": return "لم يكمل";
    default: return null;
  }
}

function LevelBadge({ level }: { level: string | null | undefined }) {
  const label = translateLevel(level);
  if (!label) return <span className="text-gray-300">—</span>;
  const colors: Record<string, string> = {
    "ممتاز": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "جيد جدًا": "bg-blue-50 text-blue-700 border border-blue-200",
    "جيد": "bg-amber-50 text-amber-700 border border-amber-200",
    "لم يكمل": "bg-red-50 text-red-500 border border-red-200",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-sm font-medium transition-all ${colors[label] ?? "text-gray-500"}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "present") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 transition-all">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
      حاضر
    </span>
  );
  if (status === "excused") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200 transition-all">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
      مستأذن
    </span>
  );
  if (status === "absent") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold bg-red-50 text-red-600 border border-red-200 transition-all">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      غائب
    </span>
  );
  return <span className="text-gray-400 text-sm">—</span>;
}

interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  status: string | null
  created_at: string
  notes?: string | null
  hafiz_level?: string | null
  tikrar_level?: string | null
  samaa_level?: string | null
  rabet_level?: string | null
  attendance_date?: string
}

export default function StudentDailyAttendancePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])

  const getSaudiDate = () => {
    const now = new Date();
    const saDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
    return saDate.toISOString().split("T")[0];
  }

  const [selectedDate, setSelectedDate] = useState(getSaudiDate())
  const router = useRouter()

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")
    if (!loggedIn || userRole !== "admin") {
      router.push("/login")
    } else {
      fetchAttendanceRecords()
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    filterRecords()
  }, [attendanceRecords, selectedDate])

  const fetchAttendanceRecords = async () => {
    try {
      const response = await fetch(`/api/student-attendance/all?date=${selectedDate}`)
      if (!response.ok) throw new Error("فشل في جلب البيانات من السيرفر")
      const data = await response.json()
      setAttendanceRecords(Array.isArray(data.records) ? data.records : [])
    } catch (error) {
      setAttendanceRecords([])
      console.error("[v0] Error fetching attendance:", error)
    }
  }

  const filterRecords = () => {
    setFilteredRecords(
      selectedDate
        ? attendanceRecords.filter((r) => r.attendance_date === selectedDate)
        : attendanceRecords
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f1e8] to-white">
        <div className="text-xl text-[#1a2332] animate-pulse">جاري التحميل...</div>
      </div>
    )
  }

  const isFuture = (() => {
    const getSaudiDateObj = (d: string) => {
      const o = new Date(new Date(d).toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
      o.setHours(0, 0, 0, 0);
      return o;
    };
    return getSaudiDateObj(selectedDate) > getSaudiDateObj(getSaudiDate());
  })();

  const sorted = [...filteredRecords].sort((a, b) => {
    const order: Record<string, number> = { absent: 0, excused: 1, present: 2 };
    return (order[a.status ?? ""] ?? 3) - (order[b.status ?? ""] ?? 3);
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f5f1e8] to-white">
      <Header />

      <main className="flex-1 py-6 md:py-10 px-3 md:px-6">
        <div className="container mx-auto max-w-7xl space-y-6">

          {/* Page Header */}
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            <h1 className="text-3xl md:text-4xl font-bold text-[#1a2332] mb-1">السجل اليومي للطلاب</h1>
            <p className="text-gray-500 text-sm">عرض حضور الطلاب حسب التاريخ</p>
          </div>

          {/* Date Filter */}
          <Card className="border border-[#d8a355]/25 shadow-sm transition-shadow duration-300 hover:shadow-md animate-in fade-in slide-in-from-top-3 duration-500">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3 max-w-xs">
                <Calendar className="w-4 h-4 text-[#d8a355] flex-shrink-0" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-base border-[#d8a355]/40 focus-visible:ring-[#d8a355]/40 transition-all duration-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* Table Card */}
          <Card className="border border-[#d8a355]/25 shadow-sm transition-shadow duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-3 duration-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#1a2332]">سجل الحضور</CardTitle>
                {!isFuture && filteredRecords.length > 0 && (
                  <span className="text-sm text-gray-400">{filteredRecords.length} طالب</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto rounded-lg border border-[#d8a355]/15">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#f5f1e8]/60 border-b border-[#d8a355]/20 hover:bg-[#f5f1e8]/60">
                      <TableHead className="text-right text-[#1a2332] font-bold">اسم الطالب</TableHead>
                      <TableHead className="text-center text-[#1a2332] font-bold">الحفظ</TableHead>
                      <TableHead className="text-center text-[#1a2332] font-bold">التكرار</TableHead>
                      <TableHead className="text-center text-[#1a2332] font-bold">السماع</TableHead>
                      <TableHead className="text-center text-[#1a2332] font-bold">الربط</TableHead>
                      <TableHead className="text-center text-[#1a2332] font-bold">الحالة</TableHead>
                      <TableHead className="text-center text-[#1a2332] font-bold">الملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFuture ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                          لا يمكن عرض بيانات الحضور لتاريخ مستقبلي
                        </TableCell>
                      </TableRow>
                    ) : sorted.length > 0 ? sorted.map((record, i) => (
                      <TableRow
                        key={record.id}
                        className="transition-colors duration-150 hover:bg-[#f5f1e8]/50 border-b border-[#d8a355]/10"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <TableCell className="font-semibold text-[#1a2332]">{record.student_name}</TableCell>
                        <TableCell className="text-center">
                          {(record.status === "absent" || record.status === "excused")
                            ? <span className="text-gray-300">—</span>
                            : <LevelBadge level={record.hafiz_level} />}
                        </TableCell>
                        <TableCell className="text-center">
                          {(record.status === "absent" || record.status === "excused")
                            ? <span className="text-gray-300">—</span>
                            : <LevelBadge level={record.tikrar_level} />}
                        </TableCell>
                        <TableCell className="text-center">
                          {(record.status === "absent" || record.status === "excused")
                            ? <span className="text-gray-300">—</span>
                            : <LevelBadge level={record.samaa_level} />}
                        </TableCell>
                        <TableCell className="text-center">
                          {(record.status === "absent" || record.status === "excused")
                            ? <span className="text-gray-300">—</span>
                            : <LevelBadge level={record.rabet_level} />}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={record.status} />
                        </TableCell>
                        <TableCell className="text-center text-sm max-w-[200px]">
                          {record.notes
                            ? <span className="text-neutral-600">{record.notes}</span>
                            : <span className="text-gray-300">—</span>}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                          لا توجد سجلات للعرض في التاريخ المحدد
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  )
}


// دالة ترجمة التقييمات من إنجليزي إلى عربي (خارج الكمبوننت)
function translateLevel(level: string | null | undefined) {
  if (!level) return "-";
  switch (level) {
    case "excellent":
      return "ممتاز";
    case "very_good":
      return "جيد جدا";
    case "good":
      return "جيد";
    case "not_completed":
      return "لم يكمل";
    default:
      return "-";
  }
}

// دالة لإرجاع كلاس اللون المناسب حسب التقييم
function getLevelClass(level: string | null | undefined) {
  return "text-black text-base";
}

interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  status: string | null
  created_at: string
  notes?: string | null
  hafiz_level?: string | null
  tikrar_level?: string | null
  samaa_level?: string | null
  rabet_level?: string | null
}

export default function StudentDailyAttendancePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  // تاريخ اليوم بتوقيت السعودية
  // دالة ثابتة لإرجاع تاريخ اليوم بتوقيت السعودية (YYYY-MM-DD)
  const getSaudiDate = () => {
    const now = new Date();
    const saDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
    return saDate.toISOString().split("T")[0];
  }
  const [selectedDate, setSelectedDate] = useState(getSaudiDate())
  const router = useRouter()

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")

    if (!loggedIn || userRole !== "admin") {
      router.push("/login")
    } else {
      fetchAttendanceRecords()
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    filterRecords()
  }, [attendanceRecords, selectedDate])

  const fetchAttendanceRecords = async () => {
    try {
      // جلب السجلات مع التقييمات
      const response = await fetch(`/api/student-attendance/all?date=${selectedDate}`)
      if (!response.ok) {
        throw new Error("فشل في جلب البيانات من السيرفر")
      }
      const data = await response.json()
      if (data && Array.isArray(data.records)) {
        // القيم موجودة مباشرة في rec وليس داخل evaluations
        setAttendanceRecords(data.records)
      } else {
        setAttendanceRecords([])
      }
    } catch (error) {
      setAttendanceRecords([])
      console.error("[v0] Error fetching attendance:", error)
    }
  }

  const filterRecords = () => {
    let filtered = attendanceRecords
    // Filter by date only
    if (selectedDate) {
      filtered = filtered.filter((record) => record.attendance_date === selectedDate)
    }
    setFilteredRecords(filtered)
  }

  // دالة لعرض التاريخ بتنسيق عربي وبتوقيت السعودية
  const formatDate = (dateString: string) => {
    try {
      // استخدم Asia/Riyadh عند العرض
      const date = new Date(new Date(dateString).toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
      return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-[#1a2332]">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f5f1e8] to-white">
      <Header />

      <main className="flex-1 py-4 md:py-8 lg:py-12 px-3 md:px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1a2332] mb-2">السجل اليومي للطلاب</h1>
              <p className="text-gray-600">عرض وإدارة حضور الطلاب حسب التاريخ</p>
            </div>

            {/* Filters Card */}
            <Card className="border-2 border-[#d8a355]/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1a2332]">تحديد التاريخ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  {/* Date Filter Only */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#1a2332]">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4" />
                        التاريخ
                      </div>
                    </Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="text-base"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Table */}
            <Card className="border-2 border-[#d8a355]/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1a2332]">سجل الحضور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right text-[#1a2332] font-bold text-lg">اسم الطالب</TableHead>
                        <TableHead className="text-right text-[#1a2332] font-bold text-lg">الحفظ</TableHead>
                        <TableHead className="text-right text-[#1a2332] font-bold text-lg">التكرار</TableHead>
                        <TableHead className="text-right text-[#1a2332] font-bold text-lg">السماع</TableHead>
                        <TableHead className="text-right text-[#1a2332] font-bold text-lg">الربط</TableHead>
                        <TableHead className="text-right text-[#1a2332] font-bold text-lg">الحالة</TableHead>
                        <TableHead className="text-center text-[#1a2332] font-bold text-lg">الملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* تحقق من أن التاريخ ليس مستقبلي (اليوم مسموح) */}
                      {(() => {
                        // مقارنة التاريخين بتوقيت السعودية
                        const getSaudiDateObj = (dateStr: string) => new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
                        const selected = getSaudiDateObj(selectedDate);
                        const today = getSaudiDateObj(getSaudiDate());
                        selected.setHours(0,0,0,0);
                        today.setHours(0,0,0,0);
                        return selected > today;
                      })() ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="text-gray-500">لا يمكن عرض بيانات الحضور لتاريخ مستقبلي</div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecords.length > 0 ? (
                          // ترتيب السجلات حسب الحالة المطلوبة
                          [...filteredRecords]
                            .sort((a, b) => {
                              const statusOrder = {
                                "absent": 0,
                                "excused": 1,
                                "present": 2,
                                null: 3,
                                undefined: 3,
                                "": 3
                              };
                              const aOrder = statusOrder[a.status ?? ""];
                              const bOrder = statusOrder[b.status ?? ""];
                              return aOrder - bOrder;
                            })
                            .map((record) => (
                              <TableRow key={record.id}>
                                <TableCell className="font-semibold text-[#1a2332] text-lg">{record.student_name}</TableCell>
                                <TableCell className={getLevelClass(record.hafiz_level)}>
                                  {(record.status === "absent" || record.status === "excused") ? "—" : translateLevel(record.hafiz_level)}
                                </TableCell>
                                <TableCell className={getLevelClass(record.tikrar_level)}>
                                  {(record.status === "absent" || record.status === "excused") ? "—" : translateLevel(record.tikrar_level)}
                                </TableCell>
                                <TableCell className={getLevelClass(record.samaa_level)}>
                                  {(record.status === "absent" || record.status === "excused") ? "—" : translateLevel(record.samaa_level)}
                                </TableCell>
                                <TableCell className={getLevelClass(record.rabet_level)}>
                                  {(record.status === "absent" || record.status === "excused") ? "—" : translateLevel(record.rabet_level)}
                                </TableCell>

                                <TableCell className="text-[#1a2332] text-lg">
                                  {record.status === "present" ? (
                                    <span className="text-green-600 font-bold">✓ حاضر</span>
                                  ) : record.status === "excused" ? (
                                    <span className="text-yellow-600 font-bold">مستأذن</span>
                                  ) : record.status === "absent" ? (
                                    <span className="text-red-600 font-bold">✗ غائب</span>
                                  ) : (
                                    <span className="text-gray-500 font-bold">لم يتم التسجيل</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-base max-w-[240px]">
                                  {record.notes ? (
                                    <span className="text-neutral-700">{record.notes}</span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <div className="text-gray-500">لا توجد سجلات للعرض في التاريخ المحدد</div>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
