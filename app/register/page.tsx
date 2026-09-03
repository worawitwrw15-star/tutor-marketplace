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
  const [isActive, setIsActive] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

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
      setIsActive(tutor.is_active !== false)
      setAvatarUrl(tutor.avatar_url || '')
      setBankName(tutor.bank_name || 'พร้อมเพย์')
      setBankAccountNo(tutor.bank_account_no || '')
      setBankAccountName(tutor.bank_account_name || '')
    }

    setLoading(false)
  }

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
        is_active: isActive,
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

  const handleToggleStatus = async (status: boolean) => {
    setIsActive(status)
    setSubmitting(true)

    const { error } = await supabase
      .from('tutors')
      .update({ is_active: status })
      .eq('email', email)

    if (error) {
      alert('เปลี่ยนสถานะไม่สำเร็จ: ' + error.message)
    } else {
      alert(status ? 'เปิดการรับสอนแล้ว! ประกาศของคุณจะแสดงบนหน้าหลัก' : 'ซ่อนประกาศสอนเรียบร้อยแล้ว!')
      router.push('/')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-medium">
        กำลังโหลดข้อมูล...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50/80 p-4 md:p-8 flex justify-center items-center pb-12">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl max-w-md w-full space-y-6 border border-slate-200/80 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <Link
            href="/"
            className="text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition flex items-center gap-1"
          >
            ← หน้าหลัก
          </Link>
          <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            👨‍🏫 บัญชีติวเตอร์
          </span>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-slate-800">
            {isEditMode ? 'แก้ไขโปรไฟล์ติวเตอร์' : 'ลงทะเบียนติวเตอร์'}
          </h1>
          <p className="text-xs text-slate-400 font-medium truncate">{email}</p>
        </div>

        {/* ปุ่มสลับสถานะเปิด/ปิด รับสอน */}
        {isEditMode && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <label className="block text-xs font-bold text-slate-700">📌 สถานะการแสดงประกาศสอน</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleStatus(true)}
                disabled={submitting}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition border flex items-center justify-center gap-1 ${
                  isActive 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🟢</span> เปิดรับสอน
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(false)}
                disabled={submitting}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition border flex items-center justify-center gap-1 ${
                  !isActive 
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🔴</span> พักการรับสอน
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-1">
              {isActive ? 'ประกาศของคุณกำลังแสดงอยู่ในหน้าหลัก' : 'ประกาศสอนถูกซ่อนอยู่ นักเรียนจะไม่เห็นโปรไฟล์ของคุณบนหน้าหลัก'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center space-y-2 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-indigo-200 flex items-center justify-center shadow-sm relative">
              {avatarPreview || avatarUrl ? (
                <img src={avatarPreview || avatarUrl} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">👨‍🏫</span>
              )}
            </div>
            <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold px-3.5 py-1.5 rounded-xl transition">
              📷 เลือกรูปโปรไฟล์
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          {/* Section 1: General Info */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <h3 className="font-bold text-slate-700 text-xs">👤 ข้อมูลทั่วไป</h3>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text"
                required
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">ชื่อเล่น (แสดงในระบบแชท)</label>
              <input
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Teaching Info */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <h3 className="font-bold text-slate-700 text-xs">📚 รายละเอียดการสอน</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">วิชาที่สอน</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">ค่าสอน (฿/ชม.)</label>
                <input
                  type="number"
                  required
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">แนะนำตัว / ประวัติการสอน</label>
              <textarea
                rows={3}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>

          {/* Section 3: Bank Details */}
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
            <h3 className="font-extrabold text-indigo-900 text-xs">
              💳 ข้อมูลบัญชีรับเงิน (สำหรับรับค่าสอนจากระบบ)
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ธนาคาร / ช่องทางรับเงิน</label>
              <input
                type="text"
                placeholder="เช่น กสิกรไทย, พร้อมเพย์"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">เลขบัญชี / เบอร์พร้อมเพย์</label>
              <input
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อบัญชี</label>
              <input
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition disabled:bg-slate-300"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลโปรไฟล์'}
          </button>
        </form>
      </div>
    </main>
  )
}