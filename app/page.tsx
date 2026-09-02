'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Tutor {
  id: string
  name: string
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
  const router = useRouter()

  useEffect(() => {
    checkUserAndFetchTutors()
  }, [])

  async function checkUserAndFetchTutors() {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const email = session.user.email || ''
    setUserEmail(email)

    const { data, error } = await supabase.from('tutors').select('*')
    if (error) console.error('Error fetching:', error)
    else {
      setTutors(data || [])
      const hasTutorProfile = (data || []).some((t) => t.email === email)
      setIsTutor(hasTutorProfile)
    }
    
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        กำลังตรวจสอบสิทธิ์การใช้งาน...
      </div>
    )
  }

  const filteredTutors = tutors.filter((t) =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* แถบเมนูด้านบน */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">แพลตฟอร์ม-นายหน้าติวเตอร์</h1>
            <p className="text-xs text-gray-400 mt-0.5">ยินดีต้อนรับ: {userEmail}</p>
          </div>
          <div className="flex gap-2">
            {isTutor ? (
              <Link href="/register" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                จัดการโปรไฟล์ติวเตอร์
              </Link>
            ) : (
              <Link href="/register" className="px-4 py-2 text-sm border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition">
                สมัครเป็นติวเตอร์
              </Link>
            )}

            <Link href="/chat" className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              ห้องแชท
            </Link>
            <button 
              onClick={handleLogout} 
              className="px-4 py-2 text-sm border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 mb-8">ค้นหาติวเตอร์คุณภาพสำหรับคุณ</p>

        {/* แถบค้นหา */}
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="ค้นตามวิชา หรือ ชื่อติวเตอร์..."
            className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* การ์ดติวเตอร์ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTutors.map((tutor) => (
            <div key={tutor.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{tutor.name}</h2>
                <span className="inline-block bg-indigo-50 text-indigo-600 text-xs px-2.5 py-1 rounded-full font-medium mt-1 mb-3">
                  วิชา: {tutor.subject}
                </span>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{tutor.bio}</p>
              </div>
              <div className="flex justify-between items-center border-t pt-4 mt-2">
                <span className="text-lg font-bold text-green-600">{tutor.price} บาท/ชม.</span>
                <Link 
                  href={tutor.email ? `/chat?tutor=${encodeURIComponent(tutor.email)}` : '/chat'} 
                  className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                >
                  จองเรียน / แชท
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}