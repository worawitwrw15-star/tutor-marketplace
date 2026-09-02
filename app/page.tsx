'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Tutor {
  id: string
  name: string
  nickname?: string
  subject: string
  price: number
  bio: string
  email?: string
}

export default function Home() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [isTutor, setIsTutor] = useState(false)
  const [isStudent, setIsStudent] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const router = useRouter()

  const ADMIN_EMAIL = 'system_admin@platform.com'

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  // ดักฟัง Realtime เมื่อมีข้อความใหม่ส่งมาหาเรา
  useEffect(() => {
    if (!userEmail) return

    const channel = supabase
      .channel('unread_messages_home')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new
        if (newMsg.receiver === userEmail) {
          setHasUnread(true)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userEmail])

  async function checkUserAndFetchData() {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const email = session.user.email || ''
    setUserEmail(email)

    // 1. ดึงข้อมูลติวเตอร์ทั้งหมด
    const { data: tutorData, error } = await supabase.from('tutors').select('*')
    if (error) console.error('Error fetching tutors:', error)
    else {
      setTutors(tutorData || [])
      setIsTutor((tutorData || []).some((t) => t.email === email))
    }

    // 2. เช็กสิทธิ์ตารางนักเรียน
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    setIsStudent(!!studentData)

    // 3. เช็กข้อความที่มีเข้ามาเพื่อเปิดจุดแจ้งเตือน
    const { data: recentMsg } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver', email)
      .limit(1)

    if (recentMsg && recentMsg.length > 0) {
      setHasUnread(true)
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
        กำลังตรวจสอบสิทธิ์การใช้งาน...
      </div>
    )
  }

  const filteredTutors = tutors.filter((t) =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.nickname && t.nickname.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <main className="min-h-screen bg-slate-50/60 text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/20">
              T
            </div>
            <div>
              <h1 className="font-extrabold text-slate-800 leading-tight">Tutor Marketplace</h1>
              {/* แสดงสถานะบทบาทในระบบต่อจากอีเมล */}
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span>{userEmail}</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                {isTutor ? (
                  <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/60">
                    👨‍🏫 ติวเตอร์
                  </span>
                ) : isStudent ? (
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/60">
                    🎓 นักเรียน
                  </span>
                ) : (
                  <span className="text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                    👤 ผู้ใช้ทั่วไป
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* แสดงปุ่มตามสิทธิ์ผู้ใช้ */}
            {isStudent ? (
              <Link 
                href={`/chat?tutor=${encodeURIComponent(ADMIN_EMAIL)}`}
                className="px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
              >
                <span>🎧</span> ติดต่อแอดมิน
              </Link>
            ) : isTutor ? (
              <Link href="/register" className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition">
                จัดการโปรไฟล์ติวเตอร์
              </Link>
            ) : (
              <Link href="/admin" className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition flex items-center gap-1">
                <span>👑</span> แอดมิน
              </Link>
            )}

            {/* ปุ่มห้องแชท พร้อมจุดแจ้งเตือนสีแดง */}
            <Link 
              href="/chat" 
              onClick={() => setHasUnread(false)}
              className="relative px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <span>💬</span> ห้องแชท
              {hasUnread && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-white"></span>
                </span>
              )}
            </Link>

            <button 
              onClick={handleLogout} 
              className="px-3.5 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-xl transition"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header Banner */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-indigo-600/10 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md inline-block mb-3">
              ✨ แพลตฟอร์มค้นหาติวเตอร์ส่วนตัว
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              ค้นหาติวเตอร์ส่วนตัวที่เหมาะกับคุณ
            </h2>
            <p className="text-xs md:text-sm text-indigo-100 mb-8 max-w-md mx-auto leading-relaxed">
              เชื่อมต่อติวเตอร์คุณภาพ พร้อมระบบชำระเงินความปลอดภัยสูงผ่าน PromptPay
            </p>

            {/* ช่องค้นหา */}
            <div className="relative max-w-lg mx-auto">
              <input
                type="text"
                placeholder="ค้นหาตามวิชา, ชื่อติวเตอร์ หรือชื่อเล่น..."
                className="w-full pl-12 pr-4 py-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-white/30 transition placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tutor Grid Section */}
      <section className="max-w-6xl mx-auto px-6 pb-20 pt-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-lg text-slate-800">
            ติวเตอร์พร้อมสอน ({filteredTutors.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor) => (
            <div key={tutor.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-extrabold text-lg shadow-sm">
                      {tutor.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-800 leading-tight">{tutor.name}</h4>
                      {tutor.nickname && (
                        <span className="text-xs font-medium text-slate-400 block mt-0.5">({tutor.nickname})</span>
                      )}
                    </div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-600 text-[11px] font-extrabold px-3 py-1 rounded-full border border-indigo-100/50">
                    {tutor.subject}
                  </span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed mb-6 line-clamp-3 bg-slate-50 p-3 rounded-2xl border border-slate-100/80">
                  {tutor.bio}
                </p>
              </div>

              {/* ปุ่มแชท และ ปุ่มจองเรียน/สแกนจ่าย */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">ค่าเรียน</span>
                  <span className="text-lg font-black text-emerald-600">{tutor.price} <span className="text-xs font-medium text-slate-400">บาท/ชม.</span></span>
                </div>
                <div className="flex gap-1.5">
                  <Link 
                    href={tutor.email ? `/chat?tutor=${encodeURIComponent(tutor.email)}` : '/chat'} 
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl transition"
                  >
                    แชท
                  </Link>
                  <Link 
                    href={tutor.email ? `/checkout?tutor=${encodeURIComponent(tutor.email)}` : '/checkout'} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20"
                  >
                    จองเรียน / สแกนจ่าย
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}