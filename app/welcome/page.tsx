'use client'
import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 1. Header Navigation */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-4 md:px-8 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-600/20">
              T
            </div>
            <div>
              <span className="font-black text-base md:text-lg text-slate-800 tracking-tight leading-none block">
                Tutor Marketplace
              </span>
              <span className="text-[10px] text-slate-400 font-bold block">แพลตฟอร์มเรียนตัวต่อตัว</span>
            </div>
          </div>

          {/* Navigation & Auth Buttons */}
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs md:text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/login?tab=register"
              className="px-4 py-2 text-xs md:text-sm font-bold bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl shadow-md shadow-amber-400/20 transition"
            >
              ลงทะเบียน
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (แรงบันดาลใจจากตัวอย่าง) */}
      <section className="bg-gradient-to-br from-sky-400 via-indigo-500 to-indigo-700 text-white pt-12 pb-20 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
          
          {/* Hero Content */}
          <div className="space-y-5 text-center md:text-left">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md inline-block">
              🎓 แพลตฟอร์มหาติวเตอร์อันดับ 1
            </span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
              หาติวเตอร์ <br className="hidden md:block" />
              <span className="text-amber-300">เรียนพิเศษ ออนไลน์</span> <br />
              สอนพิเศษ ตัวต่อตัว
            </h1>
            <p className="text-xs md:text-sm text-sky-100 leading-relaxed max-w-lg mx-auto md:mx-0">
              เชื่อมต่อผู้เรียนและติวเตอร์คุณภาพระดับประเทศ เรียนตัวต่อตัว ติวสอบ กวดวิชา หรือเรียนเสริมทักษะ เลือกเวลาเรียนและตกลงค่าเรียนได้ตามความสะดวกของคุณ
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/login?tab=register"
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs md:text-sm rounded-2xl shadow-lg shadow-amber-400/30 transition text-center"
              >
                🚀 เริ่มต้นใช้งานฟรี
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs md:text-sm rounded-2xl backdrop-blur-md transition text-center border border-white/20"
              >
                🔍 ค้นหาติวเตอร์
              </Link>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="flex justify-center items-center">
            <div className="relative w-64 md:w-80 bg-slate-900 p-3 rounded-[40px] shadow-2xl border-4 border-white/20">
              <div className="bg-white rounded-[32px] p-4 text-slate-800 space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">T</div>
                  <div>
                    <h4 className="font-extrabold text-xs">Tutor Marketplace</h4>
                    <p className="text-[9px] text-slate-400">ค้นหาครูที่ใช่ ได้ทันที</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-[11px] font-bold text-indigo-700 flex justify-between">
                    <span>📚 คณิตศาสตร์ M.ปลาย</span>
                    <span>150 ฿/ชม.</span>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-xl text-[11px] font-bold text-amber-700 flex justify-between">
                    <span>🇬🇧 ภาษาอังกฤษ สนทนา</span>
                    <span>200 ฿/ชม.</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-[11px] font-bold text-emerald-700 flex justify-between">
                    <span>🧪 ฟิสิกส์ ติวสอบเข้า</span>
                    <span>180 ฿/ชม.</span>
                  </div>
                </div>

                <div className="pt-1 text-center">
                  <span className="text-[10px] bg-indigo-600 text-white font-bold px-3 py-1 rounded-full inline-block">
                    💬 แชทตรงกับติวเตอร์ได้ทันที
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Why Choose Us (ข้อดีของแพลตฟอร์ม) */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">
            ทำไมต้องเลือกเรียนกับ <span className="text-indigo-600">Tutor Marketplace</span> ?
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            ยกระดับการเรียนรู้อย่างมีประสิทธิภาพ ด้วยระบบการจัดการที่ง่าย ปลอดภัย และยืดหยุ่นที่สุด
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black">
              🎯
            </div>
            <h3 className="font-extrabold text-base text-slate-800">ติวเตอร์ผ่านการยืนยันตัวตน</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ติวเตอร์ทุกคนในระบบได้รับการตรวจสอบเอกสารและยืนยันตัวตน เพื่อความมั่นใจและปลอดภัยสูงสุดของผู้เรียน
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl font-black">
              💵
            </div>
            <h3 className="font-extrabold text-base text-slate-800">ราคายุติธรรม เริ่มต้น 50 บาท/ชม.</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              กำหนดงบประมาณได้เอง จ่ายตามจริงตามสล็อตเวลาที่จอง ไม่ผูกมัดคอร์สระยะยาว ปลอดภัยด้วยระบบสลิปโอนเงิน
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-black">
              📅
            </div>
            <h3 className="font-extrabold text-base text-slate-800">จัดตารางเรียนได้ตามใจ</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              เลือกล็อกวันและเวลาเรียนได้ตามความสะดวก พร้อมระบบแชทพูดคุยตกลงรายละเอียดกับติวเตอร์ได้โดยตรง
            </p>
          </div>

        </div>
      </section>

      {/* 4. Banner Call to Action */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white text-center space-y-5 relative overflow-hidden">
          <div className="relative z-10 space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black">พร้อมเริ่มต้นการเรียนรู้แล้วหรือยัง?</h2>
            <p className="text-xs md:text-sm text-slate-400">
              สมัครสมาชิกวันนี้ ฟรีไม่มีค่าใช้จ่าย เริ่มต้นค้นหาติวเตอร์หรือเปิดรับสอนได้ทันที
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/login?tab=register"
                className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs md:text-sm rounded-xl transition"
              >
                ลงทะเบียนเลย
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© 2026 Tutor Marketplace. All rights reserved.</p>
      </footer>
    </div>
  )
}