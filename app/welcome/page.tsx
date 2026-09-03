'use client'
import { useState } from 'react'
import Link from 'next/link'

// --- Mock Data ---
const FEATURED_TUTORS = [
  { id: 1, name: 'พี่มาร์ค จุฬาฯ', subject: 'คณิตศาสตร์ A-Level', exp: 'ประสบการณ์ 5 ปี', rating: 4.9, students: 1200, price: 200, badge: 'Top Tutor', image: '👨‍🏫' },
  { id: 2, name: 'Teacher Emma', subject: 'IELTS / สนทนา', exp: 'Native Speaker', rating: 5.0, students: 850, price: 350, badge: 'ยอดนิยม', image: '👩‍🏫' },
  { id: 3, name: 'พี่หมอเจมส์', subject: 'ชีววิทยา สอวน.', exp: 'นศพ. ศิริราช', rating: 4.8, students: 540, price: 250, badge: 'ติวเตอร์แนะนำ', image: '👨‍⚕️' },
  { id: 4, name: 'พี่ฟ้าใส', subject: 'TGAT / ภาษาไทย', exp: 'อักษรศาสตร์', rating: 4.9, students: 2100, price: 150, badge: 'Top Tutor', image: '👩‍🎓' },
]

const POPULAR_COURSES = [
  { id: 1, title: 'ตะลุยโจทย์คณิต A-Level', level: 'ม.ปลาย', lessons: 24, students: '5k+', rating: 4.9, price: 1290, color: 'from-blue-500 to-indigo-500' },
  { id: 2, title: 'สรุปฟิสิกส์ ม.4-6 (เตรียมสอบ)', level: 'ม.ปลาย', lessons: 30, students: '3.2k+', rating: 4.8, price: 1590, color: 'from-violet-500 to-purple-500' },
  { id: 3, title: 'English for TGAT', level: 'เตรียมสอบ', lessons: 15, students: '8k+', rating: 5.0, price: 990, color: 'from-emerald-400 to-teal-500' },
]

const REVIEWS = [
  { id: 1, name: 'น้องนัท', grade: 'ม.6 เตรียมสอบ', text: 'เมื่อก่อนเกลียดเลขมาก แต่พอได้เรียนกับพี่มาร์ค เข้าใจทริคเยอะมาก ทำโจทย์เองได้จริง สอบติดแล้วครับ!', avatar: '👦' },
  { id: 2, name: 'น้องแพร', grade: 'ม.4', text: 'ระบบหาติวเตอร์ง่ายมาก ได้ติวเตอร์สอนดี ตรงเวลา เรียนออนไลน์ผ่านเว็บลื่นไหลสุดๆ แนะนำเลยค่ะ', avatar: '👧' },
  { id: 3, name: 'คุณแม่น้องวิน', grade: 'ผู้ปกครอง', text: 'ตอนแรกกังวลเรื่องเรียนออนไลน์ แต่เว็บนี้ติวเตอร์ยืนยันตัวตนหมด มีประวัติชัดเจน ไว้ใจได้ 100% ค่ะ', avatar: '👩' },
]

const FAQS = [
  { q: 'เลือกติวเตอร์อย่างไรให้ตรงใจ?', a: 'สามารถใช้ตัวกรอง (Filter) ค้นหาจากวิชา ระดับชั้น ช่วงราคา และอ่านรีวิวจากนักเรียนคนอื่นๆ เพื่อประกอบการตัดสินใจได้เลยครับ' },
  { q: 'สามารถทดลองเรียนก่อนได้ไหม?', a: 'ติวเตอร์หลายท่านมีคอร์สทดลองเรียน 30-60 นาทีในราคาพิเศษ เพื่อให้นักเรียนทดสอบสไตล์การสอนก่อนตัดสินใจลงเรียนจริง' },
  { q: 'เรียนออนไลน์ผ่านแพลตฟอร์มไหน?', a: 'สามารถตกลงกับติวเตอร์ได้โดยตรง ส่วนใหญ่ใช้ Zoom, Google Meet หรือ Microsoft Teams' },
  { q: 'ถ้าไม่ถูกใจสามารถเปลี่ยนติวเตอร์ได้ไหม?', a: 'สามารถเปลี่ยนได้ทันทีครับ เนื่องจากระบบเราจ่ายค่าเรียนเป็นรายชั่วโมง ไม่มีการผูกมัดสัญญาใดๆ' },
]

// --- Components ---
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white transition-all hover:border-indigo-200 shadow-sm">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left px-6 py-4 font-bold text-slate-800 flex justify-between items-center focus:outline-none">
        <span className="text-sm md:text-base">{question}</span>
        <span className={`text-indigo-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm text-slate-500 leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

export default function WelcomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* 1. Header Navigation */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                T
              </div>
              <div>
                <span className="font-black text-lg sm:text-xl text-slate-900 tracking-tight block leading-none">Tutor Marketplace</span>
                <span className="text-[10px] font-bold text-indigo-500 tracking-wider uppercase block mt-0.5">Verified Platform</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition">ค้นหาติวเตอร์</Link>
              <Link href="#" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition">คอร์ส</Link>
              <Link href="#" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition">วิชา</Link>
              <Link href="#" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition">รีวิว</Link>
              <div className="w-px h-5 bg-slate-200"></div>
              <Link href="/register" className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition">สำหรับติวเตอร์</Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition">
                เข้าสู่ระบบ
              </Link>
              <Link href="/signup" className="px-5 py-2.5 text-sm font-bold bg-slate-900 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-indigo-500/30 transition-all active:scale-95">
                สมัครสมาชิก
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl py-4 px-4 flex flex-col gap-4">
            <Link href="#" className="text-sm font-bold text-slate-700 p-2 bg-slate-50 rounded-lg">🔍 ค้นหาติวเตอร์</Link>
            <Link href="#" className="text-sm font-bold text-slate-700 p-2 bg-slate-50 rounded-lg">📚 คอร์สเรียน</Link>
            <Link href="/login" className="text-sm font-bold text-center text-slate-700 p-3 border border-slate-200 rounded-xl mt-2">เข้าสู่ระบบ</Link>
            <Link href="/signup" className="text-sm font-bold text-center bg-indigo-600 text-white p-3 rounded-xl shadow-md">สมัครสมาชิกฟรี</Link>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-sky-200/40 rounded-full blur-[80px] pointer-events-none z-0"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[100px] pointer-events-none z-0"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Hero Content */}
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200/80 shadow-sm px-4 py-2 rounded-full text-xs font-bold text-indigo-600">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
              อันดับ 1 ติวเตอร์ผ่านการยืนยันตัวตน
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl/tight font-black text-slate-900 tracking-tight">
              เรียนให้เข้าใจ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">ไม่ต้องนั่งจำทั้งคืน</span>
            </h1>

            <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
              ติวให้ตรงจุด เข้าใจง่าย พร้อมสอบจริง ค้นหาติวเตอร์เฉพาะทาง เลือกล็อกเวลาเรียน จ่ายตามจริงแบบรายชั่วโมง ปลอดภัย 100%
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
              <Link href="/signup" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm md:text-base rounded-2xl shadow-xl shadow-indigo-500/30 transition-all hover:-translate-y-1 text-center">
                ค้นหาติวเตอร์เลย 🔍
              </Link>
              <Link href="#courses" className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm md:text-base rounded-2xl shadow-sm border border-slate-200 transition-all text-center">
                ดูคอร์สทั้งหมด 📚
              </Link>
            </div>
          </div>

          {/* Hero Visuals / Floating Cards */}
          <div className="relative h-[400px] md:h-[500px] flex items-center justify-center">
            {/* Center Main Element */}
            <div className="relative z-10 bg-white p-6 rounded-[32px] shadow-2xl border border-slate-100 max-w-xs w-full animate-[float_6s_ease-in-out_infinite]">
              <div className="w-20 h-20 bg-indigo-100 text-4xl rounded-2xl flex items-center justify-center mb-4 shadow-inner">👨‍🏫</div>
              <h3 className="font-black text-lg text-slate-800">พี่ติวเตอร์คุณภาพ</h3>
              <p className="text-xs font-semibold text-emerald-500 mb-3">✔ ยืนยันตัวตนแล้ว</p>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                ⭐⭐⭐⭐⭐ 4.9/5
              </div>
            </div>

            {/* Floating Card 1 */}
            <div className="absolute top-10 right-4 md:right-10 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 animate-[float_5s_ease-in-out_infinite_reverse]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">🎯</div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Goal Reached</p>
                  <p className="font-black text-sm text-slate-800">สอบติด 100%</p>
                </div>
              </div>
            </div>

            {/* Floating Card 2 */}
            <div className="absolute bottom-10 left-4 md:left-10 z-20 bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-700 animate-[float_7s_ease-in-out_infinite]">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-slate-900 flex items-center justify-center text-xs text-white">👦</div>
                  <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-slate-900 flex items-center justify-center text-xs text-white">👧</div>
                  <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">+50k</div>
                </div>
                <div>
                  <p className="font-bold text-xs text-white">นักเรียนไว้วางใจ</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Advanced Search Bar */}
        <div className="max-w-5xl mx-auto mt-12 relative z-20 px-4">
          <div className="bg-white p-4 md:p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center gap-3">
            <div className="w-full md:flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">อยากเรียนวิชาอะไร?</label>
                <input type="text" placeholder="เช่น คณิตศาสตร์, TGAT" className="w-full bg-transparent text-sm font-semibold outline-none text-slate-800 placeholder:text-slate-300" />
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ระดับชั้น</label>
                <select className="w-full bg-transparent text-sm font-semibold outline-none text-slate-800 cursor-pointer">
                  <option>ม.ปลาย</option>
                  <option>ม.ต้น</option>
                  <option>เตรียมสอบมหาวิทยาลัย</option>
                </select>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">งบประมาณ (บาท/ชม.)</label>
                <select className="w-full bg-transparent text-sm font-semibold outline-none text-slate-800 cursor-pointer">
                  <option>ไม่จำกัด</option>
                  <option>100 - 300</option>
                  <option>300 - 500</option>
                </select>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">รูปแบบ</label>
                <select className="w-full bg-transparent text-sm font-semibold outline-none text-slate-800 cursor-pointer">
                  <option>ออนไลน์</option>
                  <option>เจอตัว</option>
                </select>
              </div>
            </div>
            <button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 md:px-8 rounded-2xl shadow-md transition-all active:scale-95 h-full">
              ค้นหา
            </button>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="bg-white border-y border-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-slate-100">
          <div>
            <span className="text-2xl md:text-4xl font-black text-slate-800 block">50K+</span>
            <span className="text-xs text-slate-500 font-semibold mt-1 block">นักเรียนในระบบ</span>
          </div>
          <div>
            <span className="text-2xl md:text-4xl font-black text-slate-800 block">1,000+</span>
            <span className="text-xs text-slate-500 font-semibold mt-1 block">ติวเตอร์คุณภาพ</span>
          </div>
          <div>
            <span className="text-2xl md:text-4xl font-black text-amber-500 block">4.9/5</span>
            <span className="text-xs text-slate-500 font-semibold mt-1 block">คะแนนรีวิวเฉลี่ย</span>
          </div>
          <div>
            <span className="text-2xl md:text-4xl font-black text-emerald-500 block">95%</span>
            <span className="text-xs text-slate-500 font-semibold mt-1 block">ผู้เรียนแนะนำต่อ</span>
          </div>
        </div>
      </section>

      {/* 4. Featured Tutors */}
      <section className="max-w-7xl mx-auto px-4 py-20 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <span className="text-indigo-600 text-xs font-black tracking-widest uppercase mb-2 block">Featured</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">ติวเตอร์แนะนำ 👨‍🏫</h2>
          </div>
          <Link href="/tutors" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition">ดูติวเตอร์ทั้งหมด →</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_TUTORS.map(tutor => (
            <div key={tutor.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="relative mb-4">
                <div className="w-full h-40 bg-slate-50 rounded-2xl flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300">
                  {tutor.image}
                </div>
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm">
                  {tutor.badge}
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900">{tutor.name}</h3>
              <p className="text-indigo-600 text-xs font-bold mb-3">{tutor.subject}</p>
              
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>💼 {tutor.exp}</span>
                  <span className="text-amber-500 font-bold">⭐ {tutor.rating}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>🎓 {tutor.students} คน</span>
                  <span className="text-slate-800 font-black">{tutor.price} ฿/ชม.</span>
                </div>
              </div>

              <button className="w-full py-3 bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-colors">
                ดูโปรไฟล์
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Popular Courses */}
      <section id="courses" className="bg-slate-900 py-20 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
              <span className="text-indigo-400 text-xs font-black tracking-widest uppercase mb-2 block">Top Courses</span>
              <h2 className="text-3xl md:text-4xl font-black text-white">คอร์สยอดนิยม 📚</h2>
            </div>
            <Link href="/courses" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition">ดูคอร์สทั้งหมด →</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {POPULAR_COURSES.map(course => (
              <div key={course.id} className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 hover:border-indigo-500 transition-colors group">
                <div className={`h-32 bg-gradient-to-r ${course.color} p-6 flex items-end justify-between`}>
                  <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full">{course.level}</span>
                  <span className="text-white font-bold text-sm">⭐ {course.rating}</span>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{course.title}</h3>
                  <div className="flex gap-4 text-xs text-slate-400 font-medium">
                    <span>📖 {course.lessons} บทเรียน</span>
                    <span>🧑‍🎓 {course.students} ผู้เรียน</span>
                  </div>
                  <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-xl font-black text-white">{course.price.toLocaleString()} ฿</span>
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                      ดูรายละเอียด
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Learning Journey */}
      <section className="py-20 px-4 max-w-7xl mx-auto text-center space-y-12">
        <div>
          <span className="text-indigo-600 text-xs font-black tracking-widest uppercase mb-2 block">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900">เริ่มต้นง่ายๆ ใน 5 ขั้นตอน 🚀</h2>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-2">
          {['เลือกวิชา', 'เลือกติวเตอร์', 'จองเวลาเรียน', 'เริ่มเรียน', 'ติดตามผล'].map((step, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-center gap-4 md:gap-2 w-full md:w-auto">
              <div className="bg-white border border-slate-200 shadow-sm w-32 h-32 rounded-3xl flex flex-col items-center justify-center gap-2 z-10 relative">
                <span className="text-2xl font-black text-slate-200 absolute top-2 left-3">0{idx + 1}</span>
                <span className="text-3xl z-10 mt-2">{['🎯','👨‍🏫','📅','💻','📈'][idx]}</span>
                <span className="font-bold text-xs text-slate-700 z-10">{step}</span>
              </div>
              {idx < 4 && <div className="h-8 w-px md:w-8 md:h-px bg-slate-300"></div>}
            </div>
          ))}
        </div>
      </section>

      {/* 7. Why Choose Us */}
      <section className="bg-indigo-50/50 py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">ทำไมต้องเรียนกับเรา? 🛡️</h2>
            <p className="text-slate-500 font-medium">แพลตฟอร์มที่ออกแบบมาเพื่อความโปร่งใส ปลอดภัย และยืดหยุ่น</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '✅', title: 'ติวเตอร์ผ่านการคัดเลือก', desc: 'ตรวจประวัติและเอกสารยืนยันตัวตน 100%' },
              { icon: '🎯', title: 'เลือกเรียนตามเป้าหมาย', desc: 'ปรับพื้นฐาน หรือ ติวเข้มสอบเข้า ทำได้หมด' },
              { icon: '📱', title: 'เรียนได้ทุกที่ทุกเวลา', desc: 'จัดตารางเรียนเองได้ ตามความสะดวก' },
              { icon: '📈', title: 'มีระบบติดตามผล', desc: 'ผู้ปกครองสามารถดูพัฒนาการได้ตลอด' },
              { icon: '🆓', title: 'ทดลองเรียนก่อนตัดสินใจ', desc: 'มั่นใจก่อนจ่ายจริง ด้วยคอร์สทดลอง' },
              { icon: '🔒', title: 'ระบบชำระเงินปลอดภัย', desc: 'การันตีคืนเงินหากติวเตอร์ไม่เข้าสอน' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-4 hover:-translate-y-1 transition-transform">
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{feature.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Student Reviews */}
      <section className="py-20 px-4 max-w-7xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">เสียงจากผู้เรียนจริง 💬</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map(review => (
            <div key={review.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative pt-10">
              <div className="absolute -top-6 left-6 text-5xl text-indigo-100">"</div>
              <p className="text-sm text-slate-600 leading-relaxed relative z-10 mb-6 italic">
                {review.text}
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">{review.avatar}</div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">{review.name}</h4>
                  <p className="text-[10px] font-semibold text-slate-400">{review.grade}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FAQ Section */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-2">คำถามที่พบบ่อย ❓</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <FAQItem key={idx} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* 10. Final CTA */}
      <section className="px-4 pb-20 max-w-6xl mx-auto">
        <div className="bg-slate-900 rounded-[40px] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-white">พร้อมอัปสกิลตัวเองแล้วหรือยัง?</h2>
            <p className="text-slate-300 font-medium md:text-lg">เลือกติวเตอร์ที่ใช่ แล้วเริ่มเรียนวันนี้ สมัครฟรีไม่มีค่าใช้จ่ายแอบแฝง</p>
            <div className="pt-4">
              <Link href="/signup" className="inline-block px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105 active:scale-95">
                ค้นหาติวเตอร์เลย →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">T</div>
              <span className="font-black text-slate-900">Tutor Marketplace</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">แพลตฟอร์มค้นหาติวเตอร์คุณภาพ ยืนยันตัวตน 100% ปลอดภัย มั่นใจได้</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-4 text-sm">ค้นหา</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link href="#" className="hover:text-indigo-600">ติวเตอร์ทั้งหมด</Link></li>
              <li><Link href="#" className="hover:text-indigo-600">คอร์สเรียน</Link></li>
              <li><Link href="#" className="hover:text-indigo-600">รีวิวจากนักเรียน</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-4 text-sm">สำหรับติวเตอร์</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link href="/register" className="hover:text-indigo-600">สมัครเป็นผู้สอน</Link></li>
              <li><Link href="#" className="hover:text-indigo-600">ข้อตกลงและเงื่อนไข</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-4 text-sm">ติดต่อเรา</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>support@tutormarketplace.com</li>
              <li>Line: @tutormarketplace</li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
          © 2026 Tutor Marketplace. All rights reserved.
        </div>
      </footer>

    </div>
  )
}