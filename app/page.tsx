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
  const [hasUnread, setHasUnread] = useState(false) // สถานะแจ้งเตือนแชทใหม่
  const router = useRouter()

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

    // 3. เช็กข้อความที่ส่งมาหาเราเพื่อเปิดจุดแจ้งเตือน
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
    <main className="min-h-screen bg-slate-50/80 text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/30">
              T
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-800 leading-tight">Tutor Marketplace</h1>
              <p className="text-[11px] text-slate-400 font-medium">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ซ่อนปุ่มสมัครติวเตอร์ถ้านักเรียนล็อกอินอยู่ */}
            {isTutor ? (
              <Link href="/register" className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition">
                จัดการโปรไฟล์ติวเตอร์
              </Link>
            ) : !isStudent ? (
              <Link href="/register" className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition">
                สมัครเป็นติวเตอร์
              </Link>
            ) : null}

            {/* ปุ่มห้องแชท พร้อมจุดแจ้งเตือนแชทใหม่สีแดงกระพริบ */}
            <Link 
              href="/chat" 
              onClick={() => setHasUnread(false)}
              className="relative px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
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
              className="px-3.5 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-xl transition"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
          ค้นหาติวเตอร์ส่วนตัวที่เหมาะกับคุณ
        </h2>
        <p className="text-xs text-slate-400 mb-8 max-w-md mx-auto">
          เชื่อมต่อผู้เรียนและติวเตอร์คุณภาพ พร้อมระบบพูดคุยและนัดหมายในที่เดียว
        </p>

        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            placeholder="ค้นหาตามวิชา, ชื่อติวเตอร์ หรือชื่อเล่น..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200/80 rounded-2xl shadow-lg shadow-slate-200/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
        </div>
      </section>

      {/* Tutor Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor) => (
            <div key={tutor.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{tutor.name}</h3>
                    {tutor.nickname && (
                      <span className="text-xs font-medium text-slate-400">({tutor.nickname})</span>
                    )}
                  </div>
                  <span className="bg-indigo-50 text-indigo-600 text-[11px] font-bold px-3 py-1 rounded-full">
                    {tutor.subject}
                  </span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed mb-6 line-clamp-3">{tutor.bio}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">ค่าสอน</span>
                  <span className="text-base font-black text-emerald-600">{tutor.price} <span className="text-xs font-normal text-slate-400">บาท/ชม.</span></span>
                </div>
                <Link 
                  href={tutor.email ? `/chat?tutor=${encodeURIComponent(tutor.email)}` : '/chat'} 
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-md shadow-slate-900/10"
                >
                  จองเรียน / แชท
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}