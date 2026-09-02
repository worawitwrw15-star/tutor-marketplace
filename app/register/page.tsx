'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function RegisterTutorPage() {
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [subject, setSubject] = useState('')
  const [price, setPrice] = useState('')
  const [bio, setBio] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAndFetchProfile()
  }, [])

  async function checkAndFetchProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) {
      router.push('/login')
      return
    }

    const email = session.user.email
    setUserEmail(email)

    const { data } = await supabase.from('tutors').select('*').eq('email', email).maybeSingle()
    if (data) {
      setName(data.name || '')
      setNickname(data.nickname || '')
      setSubject(data.subject || '')
      setPrice(data.price ? String(data.price) : '')
      setBio(data.bio || '')
      setIsEditMode(true)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = { name, nickname, subject, price: Number(price), bio, email: userEmail }

    const { error } = isEditMode
      ? await supabase.from('tutors').update(payload).eq('email', userEmail)
      : await supabase.from('tutors').insert([payload])

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      alert('บันทึกข้อมูลติวเตอร์เรียบร้อยแล้ว!')
      router.push('/')
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!confirm('ยืนยันลบประกาศติวเตอร์?')) return
    setDeleting(true)
    const { error } = await supabase.from('tutors').delete().eq('email', userEmail)
    if (error) alert('ลบไม่สำเร็จ: ' + error.message)
    else {
      alert('ลบประกาศติวเตอร์เรียบร้อยแล้ว!')
      router.push('/')
    }
    setDeleting(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">กำลังโหลด...</div>

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 max-w-md w-full">
        <div className="text-center mb-8">
          <span className="text-3xl">👨‍🏫</span>
          <h1 className="text-2xl font-extrabold text-slate-800 mt-2">
            {isEditMode ? 'แก้ไขโปรไฟล์ติวเตอร์' : 'ลงทะเบียนเป็นติวเตอร์'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">{userEmail}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อ-นามสกุล</label>
            <input 
              type="text" required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อเล่น (แสดงในแชทและโปรไฟล์)</label>
            <input 
              type="text" required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="เช่น ติวเตอร์ท็อป"
              value={nickname} onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">วิชาที่สอน</label>
            <input 
              type="text" required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={subject} onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ค่าสอน (บาท/ชั่วโมง)</label>
            <input 
              type="number" required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={price} onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">แนะนำตัวเอง / ประวัติการสอน</label>
            <textarea 
              required rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={bio} onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button 
            type="submit" disabled={submitting || deleting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/20 transition disabled:bg-slate-300"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลโปรไฟล์'}
          </button>
        </form>

        {isEditMode && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={handleDelete} disabled={submitting || deleting}
              className="w-full bg-rose-50 text-rose-600 border border-rose-200 py-3 rounded-xl text-xs font-semibold hover:bg-rose-100 transition"
            >
              {deleting ? 'กำลังลบประกาศ...' : 'ลบประกาศติวเตอร์นี้'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}