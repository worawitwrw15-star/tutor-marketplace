'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterTutor() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [subject, setSubject] = useState('')
  const [price, setPrice] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // ข้อมูลบัญชีธนาคารรับเงิน
  const [bankName, setBankName] = useState('พร้อมเพย์')
  const [bankAccountNo, setBankAccountNo] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')

  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()

  useEffect(() => {
    checkUserAndFetchTutor()
  }, [])

  async function checkUserAndFetchTutor() {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const userEmail = session.user.email || ''
    setEmail(userEmail)

    const { data: tutor } = await supabase
      .from('tutors')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle()

    if (tutor) {
      setIsEditMode(true)
      setName(tutor.name || '')
      setNickname(tutor.nickname || '')
      setSubject(tutor.subject || '')
      setPrice(tutor.price ? String(tutor.price) : '')
      setBio(tutor.bio || '')
      setAvatarUrl(tutor.avatar_url || '')
      setBankName(tutor.bank_name || 'พร้อมเพย์')
      setBankAccountNo(tutor.bank_account_no || '')
      setBankAccountName(tutor.bank_account_name || '')
    }

    setLoading(false)
  }

  // จัดการการเลือกไฟล์รูปโปรไฟล์
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let finalAvatarUrl = avatarUrl

      // อัปโหลดรูปโปรไฟล์ถ้ามีการเลือกรูปใหม่
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('slips')
          .upload(`avatars/${fileName}`, avatarFile)

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('slips')
            .getPublicUrl(`avatars/${fileName}`)
          finalAvatarUrl = publicUrlData.publicUrl
        }
      }

      const tutorData = {
        email,
        name,
        nickname,
        subject,
        price: Number(price),
        bio,
        avatar_url: finalAvatarUrl,
        bank_name: bankName,
        bank_account_no: bankAccountNo,
        bank_account_name: bankAccountName
      }

      const { error } = await supabase.from('tutors').upsert(tutorData, { onConflict: 'email' })

      if (error) {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message)
      } else {
        alert(isEditMode ? 'อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว!' : 'ลงทะเบียนติวเตอร์เรียบร้อยแล้ว!')
        router.push('/')
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTutor = async () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประกาศติวเตอร์นี้?')) {
      setSubmitting(true)
      const { error } = await supabase.from('tutors').delete().eq('email', email)
      if (error) {
        alert('ลบข้อมูลไม่สำเร็จ: ' + error.message)
        setSubmitting(false)
      } else {
        alert('ลบประกาศติวเตอร์เรียบร้อยแล้ว')
        router.push('/')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">
        กำลังโหลดข้อมูล...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 flex justify-center items-center">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl max-w-md w-full space-y-5 border border-slate-100 relative">
        
        {/* ปุ่มกดย้อนกลับหน้าหลัก */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <Link
            href="/"
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1 border border-slate-200/60"
          >
            ← กลับหน้าหลัก
          </Link>
          <span className="text-[11px] font-bold text-slate-400">👨‍🏫 บัญชีติวเตอร์</span>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-extrabold text-slate-800">
            {isEditMode ? 'แก้ไขโปรไฟล์ติวเตอร์' : 'ลงทะเบียนติวเตอร์'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* อัปโหลดรูปโปรไฟล์ */}
          <div className="flex flex-col items-center justify-center space-y-2 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-2 border-indigo-500 flex items-center justify-center shadow-md relative">
              {avatarPreview || avatarUrl ? (
                <img src={avatarPreview || avatarUrl} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">👨‍🏫</span>
              )}
            </div>
            <label className="cursor-pointer bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm">
              📷 เลือกรูปโปรไฟล์
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">ชื่อ-นามสกุล</label>
            <input
              type="text"
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">ชื่อเล่น (แสดงในแชทและโปรไฟล์)</label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">วิชาที่สอน</label>
            <input
              type="text"
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">ค่าสอน (บาท/ชั่วโมง)</label>
            <input
              type="number"
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">แนะนำตัวเอง / ประวัติการสอน</label>
            <textarea
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
              💳 ข้อมูลบัญชีรับเงิน (สำหรับรับค่าสอนจากแพลตฟอร์ม)
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ธนาคาร / ช่องทางรับเงิน</label>
              <input
                type="text"
                placeholder="เช่น กสิกรไทย, พร้อมเพย์"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">เลขบัญชี / เบอร์พร้อมเพย์</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ชื่อบัญชี</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:bg-slate-300 mt-2"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลโปรไฟล์'}
          </button>
        </form>

        {isEditMode && (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleDeleteTutor}
              disabled={submitting}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 py-3 rounded-xl font-bold text-xs transition"
            >
              ลบประกาศติวเตอร์นี้
            </button>
          </div>
        )}
      </div>
    </main>
  )
}