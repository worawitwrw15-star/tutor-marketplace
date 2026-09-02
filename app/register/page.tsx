'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function RegisterTutorPage() {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [price, setPrice] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('tutors').insert([
      { name, subject, price: Number(price), bio }
    ])

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      alert('ลงทะเบียนเป็นติวเตอร์เรียบร้อยแล้ว!')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">ลงทะเบียนเป็นติวเตอร์</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">กรอกข้อมูลโปรไฟล์สอนของคุณเพื่อเริ่มรับงาน</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล / ชื่อเรียก</label>
            <input 
              type="text" 
              required 
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วิชาที่สอน</label>
            <input 
              type="text" 
              required 
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ค่าสอน (บาท/ชั่วโมง)</label>
            <input 
              type="number" 
              required 
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">แนะนำตัวเอง / ประวัติการสอน</label>
            <textarea 
              required 
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลติวเตอร์'}
          </button>
        </form>
      </div>
    </main>
  )
}