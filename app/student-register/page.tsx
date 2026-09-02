'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function StudentRegisterPage() {
  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('มัธยมศึกษาตอนปลาย')
  const [targetSubject, setTargetSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('students').insert([
      { name, grade_level: gradeLevel, target_subject: targetSubject }
    ])

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      alert('ลงทะเบียนข้อมูลนักเรียนเรียบร้อย!')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">ลงทะเบียนข้อมูลนักเรียน</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">กรอกข้อมูลเพื่อเริ่มต้นค้นหาติวเตอร์ที่เหมาะกับคุณ</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล / ชื่อเล่น</label>
            <input 
              type="text" 
              required 
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="เช่น น้องมิน หรือ สมชาย ใจดี"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ระดับชั้นการศึกษา</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
            >
              <option value="ประถมศึกษา">ประถมศึกษา</option>
              <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น</option>
              <option value="มัธยมศึกษาตอนปลาย">มัธยมศึกษาตอนปลาย</option>
              <option value="มหาวิทยาลัย">มหาวิทยาลัย</option>
              <option value="บุคคลทั่วไป">บุคคลทั่วไป</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วิชาที่ต้องการหาติวเตอร์</label>
            <input 
              type="text" 
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="เช่น คณิตศาสตร์, ภาษาอังกฤษ, เคมี"
              value={targetSubject}
              onChange={(e) => setTargetSubject(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition mt-2"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลและไปเลือกติวเตอร์'}
          </button>
        </form>
      </div>
    </main>
  )
}