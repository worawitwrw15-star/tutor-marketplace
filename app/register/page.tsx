'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterTutor() {
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

    setLoading(false)
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      alert('ลงทะเบียนสำเร็จ!')
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">ลงทะเบียนโปรไฟล์ติวเตอร์</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล / นามแฝง</label>
            <input type="text" required className="w-full p-3 border rounded-lg text-gray-800" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วิชาที่สอน</label>
            <input type="text" required className="w-full p-3 border rounded-lg text-gray-800" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เรตราคา (บาท/ชั่วโมง)</label>
            <input type="number" required className="w-full p-3 border rounded-lg text-gray-800" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประวัติย่อ / สไตล์การสอน</label>
            <textarea required className="w-full p-3 border rounded-lg text-gray-800" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition">
            {loading ? 'กำลังบันทึก...' : 'ยืนยันการสมัคร'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">← กลับหน้าแรก</Link>
        </div>
      </div>
    </main>
  )
}