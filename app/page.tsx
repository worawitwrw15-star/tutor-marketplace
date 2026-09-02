'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Tutor {
  id: string
  name: string
  subject: string
  price: number
  bio: string
}

export default function Home() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTutors()
  }, [])

  async function fetchTutors() {
    const { data, error } = await supabase.from('tutors').select('*')
    if (error) console.error('Error fetching:', error)
    else setTutors(data || [])
  }

  const filteredTutors = tutors.filter((t) =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-2">แพลตฟอร์ม-นายหน้าติวเตอร์</h1>
        <p className="text-center text-gray-500 mb-8">ค้นหาติวเตอร์คุณภาพสำหรับคุณ</p>

        {/* แถบค้นหา */}
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="ค้นหาตามวิชา หรือ ชื่อติวเตอร์..."
            className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link href="/register" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center">
            สมัครเป็นติวเตอร์
          </Link>
        </div>

        {/* รายชื่อติวเตอร์ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTutors.map((tutor) => (
            <div key={tutor.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{tutor.name}</h3>
                <span className="inline-block bg-indigo-50 text-indigo-600 text-xs px-2.5 py-1 rounded-full font-medium mt-1">
                  วิชา: {tutor.subject}
                </span>
                <p className="text-gray-600 mt-3 text-sm">{tutor.bio}</p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <span className="text-lg font-bold text-green-600">{tutor.price} บาท/ชม.</span>
                <button 
                  onClick={() => alert(`จองติวเตอร์ ${tutor.name} เรียบร้อย`)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition"
                >
                  จองเรียนทันที
                </button>
              </div>
            </div>
          ))}
          {filteredTutors.length === 0 && (
            <p className="text-center text-gray-400 col-span-2 py-8">ยังไม่มีข้อมูลติวเตอร์ในระบบ</p>
          )}
        </div>
      </div>
    </main>
  )
}