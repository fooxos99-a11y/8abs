"use client";

import { useState } from "react";

export default function StatisticsPage() {
  const [dateFilter, setDateFilter] = useState("today");

  return (
    <div className="p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">الإحصائيات</h1>
      
      <div className="mb-6 flex gap-2">
        <select 
          className="border border-gray-300 rounded-md p-2"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="today">اليوم</option>
          <option value="week">الأسبوع الحالي</option>
          <option value="month">الشهر الحالي</option>
          <option value="custom">مخصص</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
          <p className="text-sm text-gray-500">مجموع الحلقات</p>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
          <p className="text-sm text-gray-500">عدد الطلاب</p>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
          <p className="text-sm text-gray-500">مجموع صفحات الحفظ</p>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
          <p className="text-sm text-gray-500">مجموع صفحات المراجعة</p>
          <p className="text-2xl font-bold">--</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-bold mb-4">الطلاب الأعلى حفظاً</h2>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>جاري الاستعلام...</li>
          </ul>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-bold mb-4">الطلاب الأعلى مراجعة</h2>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>جاري الاستعلام...</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
        <h2 className="text-lg font-bold mb-4">الحلق الأعلى إنجازاً</h2>
        <div className="text-sm text-gray-500 text-center py-8">
          سيتم عرض الأشرطة البيانية هنا المعتمدة على الحضور والحفظ والمراجعة والربط
        </div>
      </div>
    </div>
  );
}
