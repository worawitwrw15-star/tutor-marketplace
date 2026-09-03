'use client'
import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Background Decorative Blur */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative z-10 bg-white p-6 md:p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-3xl mb-1 shadow-sm">
            ✨
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800">
            ยินดีต้อนรับเข้าสู่ระบบ!
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            เลือกบทบาทเพื่อเริ่มใช้งานแพลตฟอร์มตามที่คุณต้องการ
          </p>
        </div>

        <div className="space-y-3">
          {/* Tutor Choice */}
          <Link 
            href="/register" 
            className="block w-full p-4 border-2 border-indigo-100 hover:border-indigo-600 rounded-2xl bg-indigo-50/40 hover:bg-indigo-50 transition-all duration-200 text-left group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-indigo-600 text-base flex items-center gap-2">
                <span>👨‍🏫</span>
                <span>สมัครเป็นติวเตอร์</span>
              </div>
              <span className="text-indigo-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              สร้างโปรไฟล์ กำหนดราคาค่าสอน และรับงานสอนพิเศษ
            </p>
          </Link>

          {/* Student Choice */}
          <Link 
            href="/student-register" 
            className="block w-full p-4 border-2 border-emerald-100 hover:border-emerald-500 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50 transition-all duration-200 text-left group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-emerald-600 text-base flex items-center gap-2">
                <span>🎓</span>
                <span>ลงทะเบียนเป็นนักเรียน</span>
              </div>
              <span className="text-emerald-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              สร้างโปรไฟล์นักเรียน ค้นหาติวเตอร์ และจองตารางเรียน
            </p>
          </Link>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 text-center flex items-center justify-between text-xs">
          <Link 
            href="/login" 
            className="text-slate-400 hover:text-slate-600 font-medium transition"
          >
            ← กลับหน้าล็อกอิน
          </Link>
          <Link 
            href="/" 
            className="text-indigo-600 hover:underline font-bold"
          >
            ข้ามไปหน้าแรก →
          </Link>
        </div>

      </div>
    </main>
  )
}