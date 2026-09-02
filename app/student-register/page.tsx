'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function StudentRegisterPage() {
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [gradeLevel, setGradeLevel] = useState('มัธยมศึกษาตอนปลาย')
  const [targetSubject, setTargetSubject] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) {
      router.push('/login')
      return
    }
    const email = session.user.email
    setUserEmail(email)

    const { data } = await supabase.from('students').select('*').eq('email', email).maybeSingle()
    if (data) {
      setName(data.name || '')
      setNickname(data.nickname || '')
      setGradeLevel(data.grade_level || 'มัธยมศึกษาตอนปลาย')
      setTargetSubject(data.target_subject || '')
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.from('students').upsert([
      { email: userEmail, name, nickname, grade_level: gradeLevel, target_subject: targetSubject }
    ], { onConflict: 'email' })

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      alert('บันทึกข้อมูลนักเรียนเรียบร้อย!')
      router.push('/')
    }
    setSubmitting(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">กำลังโหลด...</div>

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 max-w-md w-full">
        <div className="text-center mb-8">
          <span className="text-3xl">🎓</span>
          <h1 className="text-2xl font-extrabold text-slate-800 mt-2">โปรไฟล์นักเรียน</h1>
          <p className="text-xs text-slate-400 mt-1">{userEmail}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อ-นามสกุล</label>
            <input 
              type="text" required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="เช่น นายสมชาย ใจดี"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อเล่น (แสดงในห้องแชท)</label>
            <input 
              type="text" required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="เช่น น้องมิน"
              value={nickname} onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ระดับชั้นการศึกษา</label>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}
            >
              <option value="ประถมศึกษา">ประถมศึกษา</option>
              <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น</option>
              <option value="มัธยมศึกษาตอนปลาย">มัธยมศึกษาตอนปลาย</option>
              <option value="มหาวิทยาลัย">มหาวิทยาลัย</option>
              <option value="บุคคลทั่วไป">บุคคลทั่วไป</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">วิชาที่สนใจเรียน</label>
            <input 
              type="text" required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="เช่น คณิตศาสตร์, ภาษาอังกฤษ"
              value={targetSubject} onChange={(e) => setTargetSubject(e.target.value)}
            />
          </div>

          <button 
            type="submit" disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/20 transition mt-2 disabled:bg-slate-300"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลและเข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </main>
  )
}