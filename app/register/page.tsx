'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function RegisterTutorPage() {
  const [name, setName] = useState('')
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

    const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Error fetching profile:', error)
    } else if (data) {
      setName(data.name || '')
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

    if (isEditMode) {
      const { error } = await supabase
        .from('tutors')
        .update({
          name,
          subject,
          price: Number(price),
          bio
        })
        .eq('email', userEmail)

      if (error) {
        alert('เกิดข้อผิดพลาดในการแก้ไข: ' + error.message)
      } else {
        alert('อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว!')
        router.push('/')
      }
    } else {
      const { error } = await supabase
        .from('tutors')
        .insert([
          { name, subject, price: Number(price), bio, email: userEmail }
        ])

      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message)
      } else {
        alert('ลงทะเบียนเป็นติวเตอร์เรียบร้อยแล้ว!')
        router.push('/')
      }
    }

    setSubmitting(false)
  }

  // ฟังก์ชันสำหรับลบประกาศ/โปรไฟล์ติวเตอร์
  const handleDelete = async () => {
    const confirmDelete = confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประกาศติวเตอร์นี้? ข้อมูลจะไม่สามารถกู้คืนได้')
    if (!confirmDelete) return

    setDeleting(true)
    const { error } = await supabase
      .from('tutors')
      .delete()
      .eq('email', userEmail)

    if (error) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message)
    } else {
      alert('ลบประกาศติวเตอร์เรียบร้อยแล้ว!')
      router.push('/')
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        กำลังโหลดข้อมูล...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          {isEditMode ? 'แก้ไขข้อมูลติวเตอร์' : 'ลงทะเบียนเป็นติวเตอร์'}
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          บัญชี: {userEmail}
        </p>

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
            disabled={submitting || deleting}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-400"
          >
            {submitting ? 'กำลังบันทึก...' : isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลติวเตอร์'}
          </button>
        </form>

        {/* ปุ่มลบประกาศ จะแสดงเฉพาะติวเตอร์ที่มีโปรไฟล์แล้วเท่านั้น */}
        {isEditMode && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleDelete}
              disabled={submitting || deleting}
              className="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition disabled:opacity-50"
            >
              {deleting ? 'กำลังลบประกาศ...' : 'ลบประกาศติวเตอร์นี้'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}