"use client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import AdminNotificationsClient from "./admin-notifications-client"
import { useAdminAuth } from "@/hooks/use-admin-auth"

export default function AdminNotificationsPage() {
  const { isLoading: authLoading, isVerified: authVerified } = useAdminAuth("?????????");

    if (authLoading || !authVerified) return (<div className="min-h-screen flex items-center justify-center bg-[#fafaf9]"><div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" /></div>);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dir-rtl font-cairo">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <AdminNotificationsClient />
      </main>
      <Footer />
    </div>
  )
}
