'use client'
import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* 1. Header Navigation */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60 px-3.5 sm:px-6 md:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              T
            </div>
            <div className="min-w-0">
              <span className="font-black text-sm sm:text-base md:text-lg text-slate-900 tracking-tight leading-none block truncate">
                Tutor Marketplace
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold tracking-wide uppercase block truncate">
                Verified Platform
              </span>
            </div>
          </Link>

          {/* Navigation & Auth Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <Link
              href="/login"
              className="px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/signup"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              ลงทะเบียน
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative bg-slate-900 text-white pt-10 pb-16 sm:pt-16 sm:pb-24 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 sm:left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-10 w-60 h-60 sm:w-96 sm:h-96 bg-violet-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-slate-800/90 border border-slate-700/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-indigo-300 max-w-full truncate">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
              <span className="truncate">อันดับ 1 ติวเตอร์ผ่านการยืนยันตัวตน</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
              ยกระดับการเรียนรู้ <br />
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
                กับติวเตอร์คุณภาพ
              </span> <br />
              ที่ใช่สำหรับคุณ
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal px-2 sm:px-0">
              ค้นหาครูและติวเตอร์เฉพาะทาง ติวสอบ กวดวิชา หรือพัฒนาทักษะภาษา เลือกล็อกเวลาเรียน จ่ายตามจริงแบบรายชั่วโมง พร้อมระบบแชทตรงและชำระเงินที่ปลอดภัย 100%
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center lg:justify-start px-4 sm:px-0">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-400/20 transition-all active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <span>🚀</span> เริ่มต้นใช้งานฟรี
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-xs sm:text-sm rounded-2xl backdrop-blur-md transition-all border border-slate-700 text-center flex items-center justify-center gap-2"
              >
                <span>🔍</span> ค้นหาติวเตอร์ในระบบ
              </Link>
            </div>

            {/* Social Proof / Badges */}
            <div className="pt-4 sm:pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 text-slate-400 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> ยืนยันตัวตน 100%
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> ไม่มีผูกมัดรายเดือน
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> แชทตรงก่อนจอง
              </div>
            </div>
          </div>

          {/* Hero Visual Card / Mobile Preview */}
          <div className="lg:col-span-5 flex justify-center pt-2 lg:pt-0">
            <div className="relative w-full max-w-xs sm:max-w-md bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-4 sm:p-5 rounded-3xl border border-slate-700/80 shadow-2xl backdrop-blur-xl">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">live-marketplace.v1</span>
              </div>

              {/* Sample Tutor Card 1 */}
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-md flex-shrink-0">
                      M
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="font-bold text-xs text-white truncate">พี่มาร์ค จุฬาฯ</h4>
                        <span className="text-emerald-400 text-[9px] flex-shrink-0">✔ Verified</span>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">คณิตศาสตร์ PAT1 / A-Level</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-emerald-400">180 ฿</span>
                    <span className="text-[8px] text-slate-400 block">/ชม.</span>
                  </div>
                </div>

                {/* Sample Tutor Card 2 */}
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-xs shadow-md flex-shrink-0">
                      E
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="font-bold text-xs text-white truncate">Teacher Emma</h4>
                        <span className="text-emerald-400 text-[9px] flex-shrink-0">✔ Native</span>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">English Conversation / IELTS</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-amber-300">250 ฿</span>
                    <span className="text-[8px] text-slate-400 block">/ชม.</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-center">
                <p className="text-[10px] sm:text-[11px] font-bold text-indigo-300">
                  ⚡ เลือกติวเตอร์ที่ถูกใจ จองเวลารายชั่วโมงได้ทันที
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. Trust & Stats Bar */}
      <section className="bg-white border-y border-slate-200/80 py-6 sm:py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="p-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 block">100%</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">ยืนยันตัวตนผู้สอน</span>
          </div>
          <div className="p-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 block">50฿+</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">ค่าเรียนเริ่มต้น/ชม.</span>
          </div>
          <div className="p-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 block">0%</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">ไม่มีสัญญาผูกมัด</span>
          </div>
          <div className="p-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 block">24/7</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">จอง&แชทออนไลน์</span>
          </div>
        </div>
      </section>

      {/* 4. Features & Benefits */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 sm:py-20 space-y-8 sm:space-y-12">
        <div className="text-center space-y-2.5 max-w-2xl mx-auto px-2">
          <span className="text-indigo-600 text-[10px] sm:text-xs font-bold tracking-wider uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Why Choose Us
          </span>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900">
            ทำไมผู้เรียนและติวเตอร์ ถึงเลือกเรา?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            แพลตฟอร์มที่ออกแบบมาเพื่อความโปร่งใส ปลอดภัย และยืดหยุ่นในการเรียนรู้อย่างแท้จริง
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black">
              🛡️
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">โปรไฟล์ยืนยันตัวตนแน่ชัด</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ติวเตอร์ทุกคนต้องผ่านกระบวนการตรวจสอบเอกสารสำคัญ เพื่อให้ผู้เรียนและผู้ปกครองมั่นใจในคุณภาพและความปลอดภัย 100%
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black">
              💰
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">ราคายุติธรรม ไม่มีบวกเพิ่ม</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              เลือกราคาค่าเรียนต่อชั่วโมงได้ตรงตามงบประมาณ จ่ายเฉพาะสล็อตเวลาที่ต้องการเรียนจริง ไม่มีการบังคับซื้อคอร์สใหญ่
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black">
              💬
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">แชทตรง & ตารางสอนเรียลไทม์</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              พูดคุยตกลงเป้าหมายการเรียนกับติวเตอร์ได้โดยตรง พร้อมระบบจองเวลาเรียนที่อัปเดตแบบ Real-time จัดตารางได้เอง
            </p>
          </div>

        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="bg-slate-100/70 border-y border-slate-200/60 py-12 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-3xl font-black text-slate-900">เริ่มต้นใช้งานง่ายๆ ใน 3 ขั้นตอน</h2>
            <p className="text-xs sm:text-sm text-slate-500">ไม่ซับซ้อน เริ่มเรียนได้ทันทีภายในไม่กี่นาที</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 text-center space-y-2 sm:space-y-3">
              <span className="w-8 h-8 bg-indigo-600 text-white rounded-full font-black text-xs sm:text-sm flex items-center justify-center mx-auto">1</span>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">ค้นหาติวเตอร์</h4>
              <p className="text-xs text-slate-500">เลือกค้นหาตามวิชา ราคา หรือคะแนนรีวิวจากผู้เรียนจริง</p>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 text-center space-y-2 sm:space-y-3">
              <span className="w-8 h-8 bg-indigo-600 text-white rounded-full font-black text-xs sm:text-sm flex items-center justify-center mx-auto">2</span>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">ทักแชท & เลือกเวลา</h4>
              <p className="text-xs text-slate-500">พูดคุยรายละเอียดและเลือกล็อกวันเวลาเรียนในระบบ</p>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 text-center space-y-2 sm:space-y-3">
              <span className="w-8 h-8 bg-indigo-600 text-white rounded-full font-black text-xs sm:text-sm flex items-center justify-center mx-auto">3</span>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">ชำระเงิน & เริ่มเรียน</h4>
              <p className="text-xs text-slate-500">โอนชำระพร้อมแนบสลิป ปลอดภัย ชัวร์ 100%</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Banner Call to Action */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-10 sm:py-16">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-12 text-white text-center space-y-4 sm:space-y-6 relative overflow-hidden shadow-xl border border-indigo-700/50">
          <div className="relative z-10 space-y-3 sm:space-y-4 max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight">
              พร้อมเริ่มต้นพัฒนาการเรียนรู้แล้วหรือยัง?
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed px-2">
              สมัครสมาชิกวันนี้ ฟรีไม่มีค่าธรรมเนียมแอบแฝง เริ่มต้นค้นหาติวเตอร์ที่ใช่ หรือลงประกาศเปิดสอนได้ทันที
            </p>
            <div className="pt-2 flex justify-center">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 text-center"
              >
                ลงทะเบียนใช้งานเลย
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 space-y-1">
        <p>© 2026 Tutor Marketplace. All rights reserved.</p>
        <p className="text-[10px] text-slate-300">Safe & Reliable Personal Tutor Platform</p>
      </footer>
    </div>
  )
}