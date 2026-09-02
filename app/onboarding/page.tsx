'use client'
import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">ยินดีต้อนรับเข้าสู่ระบบ!</h1>
        <p className="text-gray-500 mb-8 text-sm">กรุณาเลือกลงทะเบียนตามบทบาทที่คุณต้องการ</p>

        <div className="space-y-4">
          <Link 
            href="/register" 
            className="block w-full p-5 border-2 border-indigo-600 rounded-xl hover:bg-indigo-50 transition text-left group"
          >
            <div className="font-bold text-indigo-600 text-lg group-hover:translate-x-1 transition-transform">
              👨‍🏫 สมัครเป็นติวเตอร์ →
            </div>
            <div className="text-xs text-gray-500 mt-1">
              สร้างโปรไฟล์ สอนหนังสือ และรับงานสอนพิเศษ
            </div>
          </Link>

          <Link 
            href="/" 
            className="block w-full p-5 border-2 border-emerald-500 rounded-xl hover:bg-emerald-50 transition text-left group"
          >
            <div className="font-bold text-emerald-600 text-lg group-hover:translate-x-1 transition-transform">
              🎓 ลงทะเบียนเป็นนักเรียน →
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ค้นหาติวเตอร์ จองเวลาเรียน และเริ่มพูดคุยแชท
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}