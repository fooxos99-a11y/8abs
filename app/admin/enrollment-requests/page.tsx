"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SiteLoader } from "@/components/ui/site-loader"
import { Copy, Check, ExternalLink, Lock, Unlock, Trash2, UserPlus, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { toast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { JUZ_START_PAGES, getAyahByPageFloat, getInclusiveEndAyah } from "@/lib/quran-data";

function formatMemorizedAmount(amount?: string) {
  if (!amount) return "-";
  if (amount.includes("-")) {
    const [from, to] = amount.split("-");
    if (from === to) return `الجزء ${from}`;
    return `من الجزء ${from} إلى الجزء ${to}`;
  }
  return amount; // fallback
}

interface EnrollmentRequest {
  id: string;
  full_name: string;
  guardian_phone: string;
  id_number: string;
  educational_stage: string;
  memorized_amount?: string;
  created_at: string;
}

export default function EnrollmentRequestsPage() {
  const { isLoading: authLoading, isVerified: authVerified } = useAdminAuth("طلبات التسجيل");

  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(true);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [circles, setCircles] = useState<any[]>([]);
  const [acceptRequest, setAcceptRequest] = useState<EnrollmentRequest | null>(null);
  const [acceptForm, setAcceptForm] = useState({
    name: "",
    phone: "",
    id_number: "",
    account_number: "",
    educational_stage: "",
    memorized_amount: "",
    circle_id: "",
  });

  useEffect(() => {
    const fetchCircles = async () => {
      const { data, error } = await supabase.from("circles").select("id, name");
      if (!error && data) setCircles(data);
    };
    fetchCircles();
  }, []);

  const handleOpenAccept = (req: EnrollmentRequest) => {
    setAcceptRequest(req);
    setAcceptForm({
      name: req.full_name,
      phone: req.guardian_phone,
      id_number: req.id_number,
      account_number: req.id_number,
      educational_stage: req.educational_stage,
      memorized_amount: req.memorized_amount || "",
      circle_id: "",
    });
  };

  const handleConfirmAccept = async () => {
    if (!acceptRequest) return;
    if (!acceptForm.circle_id) {
      toast({ title: "خطأ", description: "الرجاء اختيار الحلقة", variant: "destructive" });
      return;
    }
    
    let memorizedStartSurah = null;
    let memorizedStartVerse = null;
    let memorizedEndSurah = null;
    let memorizedEndVerse = null;

    if (acceptForm.memorized_amount && acceptForm.memorized_amount.includes("-")) {
      const [fromJuzStr, toJuzStr] = acceptForm.memorized_amount.split("-");
      const fromJuz = parseInt(fromJuzStr, 10);
      const toJuz = parseInt(toJuzStr, 10);

      if (!isNaN(fromJuz) && !isNaN(toJuz) && fromJuz >= 1 && toJuz <= 30) {
        // Find correct start and end positions accurately using page boundaries
        const startPage = JUZ_START_PAGES[fromJuz - 1] || 1;
        const endPage = JUZ_START_PAGES[toJuz] ? JUZ_START_PAGES[toJuz] - 1 : 604;

        const startRef = getAyahByPageFloat(startPage);
        const endRef = getInclusiveEndAyah(endPage + 1);

        memorizedStartSurah = startRef.surah;
        memorizedStartVerse = startRef.ayah;
        memorizedEndSurah = endRef.surah;
        memorizedEndVerse = endRef.ayah;
      }
    }

    // insert into students
    const { error: insertError } = await supabase.from("students").insert({
      name: acceptForm.name,
      phone: acceptForm.phone,
      id_number: acceptForm.id_number,
      account_number: acceptForm.account_number,
      educational_stage: acceptForm.educational_stage,
      circle_id: acceptForm.circle_id,
      is_archived: false,
      memorized_start_surah: memorizedStartSurah,
      memorized_start_verse: memorizedStartVerse,
      memorized_end_surah: memorizedEndSurah,
      memorized_end_verse: memorizedEndVerse,
    // delete request
    await supabase.from("enrollment_requests").delete().eq("id", acceptRequest.id);
    setRequests(requests.filter(r => r.id !== acceptRequest.id));
    setAcceptRequest(null);
    toast({ title: "نجاح", description: "تم قبول الطالب بنجاح" });
  };

  useEffect(() => {
    fetchRequests();
    fetchEnrollmentStatus();
  }, []);

  const fetchEnrollmentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('is_active')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .maybeSingle();
      
      if (!error && data) {
        setIsEnrollmentOpen(data.is_active);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleEnrollmentStatus = async () => {
    setIsStatusLoading(true);
    const newStatus = !isEnrollmentOpen;
    try {
      const { error } = await supabase
        .from('programs')
        .upsert({
          id: '00000000-0000-0000-0000-000000000000',
          name: 'ENROLLMENT_STATUS',
          is_active: newStatus,
          date: 'status',
          duration: 'status',
          points: 0,
          description: 'ENROLLMENT_STATUS'
        });
        
      if (!error) {
        setIsEnrollmentOpen(newStatus);
        toast({ title: newStatus ? "تم فتح استقبال طلبات التسجيل" : "تم إغلاق طلبات التسجيل" });
      } else {
        toast({ title: "حدث خطأ أثناء تغيير الحالة", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsStatusLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("enrollment_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      toast({ title: "حدث خطأ أثناء جلب طلبات التسجيل", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from("enrollment_requests")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      setRequests(requests.filter(req => req.id !== id));
      toast({ title: "تم حذف الطلب بنجاح" });
    } catch (error: any) {
      console.error("Error deleting request:", error);
      toast({ title: "حدث خطأ أثناء حذف الطلب", variant: "destructive" });
    }
  };

  const copyEnrollmentLink = () => {
    const link = `${window.location.origin}/enroll`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast({ title: "تم نسخ الرابط بنجاح" });
    setTimeout(() => setCopiedLink(false), 3000);
  };

    if (authLoading || !authVerified) return <SiteLoader fullScreen />;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] dir-rtl font-cairo">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[#1a2332]">طلبات التسجيل</h1>
            </div>
            <p className="text-neutral-500">
              قائمة بالطلاب الذين قاموا بطلب التسجيل عبر الرابط
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={toggleEnrollmentStatus}
              disabled={isStatusLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm ${
                isEnrollmentOpen 
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" 
                  : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
              }`}
              title={isEnrollmentOpen ? "إيقاف استقبال طلبات التسجيل" : "تفعيل استقبال طلبات التسجيل"}
            >
              {isStatusLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isEnrollmentOpen ? (
                <Lock className="w-5 h-5" />
              ) : (
                <Unlock className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">
                {isEnrollmentOpen ? "إقفال التسجيل" : "فتح التسجيل"}
              </span>
            </button>
            <button
              onClick={copyEnrollmentLink}
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C9A961] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm"
            >
              {copiedLink ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span className="hidden sm:inline">نسخ الرابط</span>
            </button>
            <Link
              href="/enroll"
              target="_blank"
              className="flex items-center gap-2 bg-white border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5 px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm"
              title="معاينة نموذج التسجيل"
            >
              <ExternalLink className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#D4AF37]/20 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <SiteLoader />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-xl text-neutral-400">لا توجد طلبات تسجيل حتى الآن</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-[#f5f1e8] text-[#023232]">
                  <tr>
                    <th className="px-6 py-4 font-semibold first:rounded-tr-2xl">الاسم الثلاثي</th>
                    <th className="px-6 py-4 font-semibold">رقم ولي الأمر</th>
                    <th className="px-6 py-4 font-semibold">رقم الهوية</th>
                    <th className="px-6 py-4 font-semibold">المرحلة الدراسية</th>
                    <th className="px-6 py-4 font-semibold">المحفوظ</th>
                    <th className="px-6 py-4 font-semibold">تاريخ الطلب</th>
                    <th className="px-6 py-4 font-semibold last:rounded-tl-2xl">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/10">
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-[#D4AF37]/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {request.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dir-ltr text-right">
                        {request.guardian_phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dir-ltr text-right">
                        {request.id_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {request.educational_stage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {formatMemorizedAmount(request.memorized_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                        {new Date(request.created_at).toLocaleString("ar-SA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenAccept(request)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="قبول"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteRequest(request.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="رفض"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!acceptRequest} onOpenChange={(open) => !open && setAcceptRequest(null)}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle>قبول الطالب</DialogTitle>
            <DialogDescription>
              الرجاء مراجعة البيانات واختيار حلقة للطالب قبل القبول.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid gap-2">
              <Label>الاسم</Label>
              <Input value={acceptForm.name} onChange={(e) => setAcceptForm({ ...acceptForm, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>رقم الجوال</Label>
              <Input value={acceptForm.phone} onChange={(e) => setAcceptForm({ ...acceptForm, phone: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>رقم الهوية</Label>
              <Input value={acceptForm.id_number} onChange={(e) => setAcceptForm({ ...acceptForm, id_number: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>رقم الحساب</Label>
              <Input value={acceptForm.account_number} onChange={(e) => setAcceptForm({ ...acceptForm, account_number: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>المرحلة الدراسية</Label>
              <Input value={acceptForm.educational_stage} onChange={(e) => setAcceptForm({ ...acceptForm, educational_stage: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>المحفوظ</Label>
              <Input value={formatMemorizedAmount(acceptForm.memorized_amount) || "غير محدد"} readOnly className="bg-gray-50 bg-opacity-50 text-gray-500 cursor-default" />
            </div>
            <div className="grid gap-2">
              <Label>تحديد الحلقة</Label>
              <Select value={acceptForm.circle_id} onValueChange={(val) => setAcceptForm({ ...acceptForm, circle_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحلقة" />
                </SelectTrigger>
                <SelectContent>
                  {circles.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:space-x-0 mt-2">
            <Button variant="outline" onClick={() => setAcceptRequest(null)}>إلغاء</Button>
            <Button onClick={handleConfirmAccept} className="bg-emerald-600 hover:bg-emerald-700 text-white">تأكيد القبول</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
