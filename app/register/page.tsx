'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterTutor() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [price, setPrice] = useState('')
  const [bio, setBio] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSuspended, setIsSuspended] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const ADMIN_EMAIL = 'system_admin@platform.com'

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

    // ดึงชื่อจาก User Metadata ก่อน (กรณีสมัครด้วย Email/Password หรือ Social Login)
    const userMetaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
    setName(userMetaName)

    const { data: tutor } = await supabase
      .from('tutors')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle()

    if (tutor) {
      // หากในฐานข้อมูลมีชื่ออยู่แล้ว ให้ใช้ชื่อจากตาราง tutors
      setName(tutor.name || userMetaName || userEmail.split('@')[0])
      setSubject(tutor.subject || '')
      setPrice(tutor.price ? String(tutor.price) : '')
      setBio(tutor.bio || '')
      setIsActive(tutor.is_active !== false)
      setIsSuspended(tutor.is_suspended === true)
    }
    
    // ดึงข้อมูลกรณีผู้ใช้สร้างโปรไฟล์ไว้ในตาราง profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('email', userEmail)
      .maybeSingle()

    if (profile && profile.name) {
      setName(profile.name)
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSuspended) {
      alert('บัญชีของคุณถูกระงับการใช้งาน ไม่สามารถบันทึกข้อมูลได้ กรุณาติดต่อแอดมิน')
      return
    }

    setSubmitting(true)

    try {
      // ป้องกันกรณี name ยังคงเป็นค่าว่าง ให้ใช้อีเมลส่วนหน้าแทน
      const finalName = name.trim() || email.split('@')[0] || 'Tutor'

      const tutorData = {
        email,
        name: finalName, // 🟢 แนบค่า name เพื่อแก้ปัญหา null value violation
        subject,
        price: Number(price),
        bio,
        is_active: isActive
      }

      const { error } = await supabase
        .from('tutors')
        .upsert(tutorData, { onConflict: 'email' })

      if (error) {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message)
      } else {
        alert('อัปเดตข้อมูลประกาศการสอนเรียบร้อยแล้ว!')
        router.push('/')
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (status: boolean) => {
    if (isSuspended) {
      alert('บัญชีของคุณถูกแอดมินระงับการใช้งาน กรุณาติดต่อแอดมินผ่านช่องทางแชท')
      return
    }

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
        กำลังโหลดข้อมูลประกาศ...
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

          <Link
            href="/profile"
            className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl border border-indigo-100 transition flex items-center gap-1"
          >
            ⚙️ ตั้งค่าส่วนตัว
          </Link>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-slate-800">
            📝 จัดการประกาศการสอน
          </h1>
          <p className="text-xs text-slate-400 font-medium truncate">
            กำหนดรายละเอียดวิชา ค่าสอน และคำแนะนำตัวที่จะแสดงบนหน้าหลัก ({email})
          </p>
        </div>

        {/* กรณีถูกแอดมินระงับการใช้งาน */}
        {isSuspended ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-3">
            <span className="text-3xl">🚫</span>
            <div className="space-y-1">
              <h3 className="font-black text-sm text-rose-700">บัญชีของคุณถูกระงับการใช้งาน</h3>
              <p className="text-xs text-rose-600 leading-relaxed">
                เนื่องจากถูกระงับโดยแอดมิน ระบบจึงปิดการแสดงผลประกาศสอน และไม่สามารถแก้ไขข้อมูลได้ หากต้องการปลดล็อคกรุณาติดต่อแอดมิน
              </p>
            </div>
            <Link
              href={`/chat?tutor=${encodeURIComponent(ADMIN_EMAIL)}`}
              className="inline-block bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition"
            >
              💬 ทักแชทติดต่อแอดมิน
            </Link>
          </div>
        ) : (
          /* ปุ่มสลับสถานะเปิด/ปิด รับสอนชั่วคราวด้วยตนเอง */
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

        <form onSubmit={handleSubmit} className={`space-y-4 text-xs ${isSuspended ? 'opacity-40 pointer-events-none' : ''}`}>
          
          {/* Teaching Info */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <h3 className="font-bold text-slate-700 text-xs">📚 รายละเอียดการสอนที่จะแสดงผล</h3>
            
            {/* เพิ่ม Input แสดง/แก้ไขชื่อโปรไฟล์เพื่อให้ผู้ใช้ตรวจสอบก่อนบันทึก */}
            <div>
              <label className="block font-semibold text-slate-600 mb-1">ชื่อ-นามสกุล ที่จะแสดงในประกาศ *</label>
              <input
                type="text"
                required
                disabled={isSuspended}
                placeholder="เช่น สมชาย ใจดี"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">วิชาที่สอน *</label>
                <input
                  type="text"
                  required
                  disabled={isSuspended}
                  placeholder="เช่น คณิตศาสตร์, อังกฤษ"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">ค่าสอน (฿/ชม.) *</label>
                <input
                  type="number"
                  required
                  disabled={isSuspended}
                  placeholder="เช่น 150"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">แนะนำตัว / ประวัติการสอน</label>
              <textarea
                rows={4}
                disabled={isSuspended}
                placeholder="อธิบายสไตล์การสอน ประสบการณ์ หรือสิ่งที่นักเรียนจะได้รับ..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || isSuspended}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition disabled:bg-slate-300"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลประกาศสอน'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            ต้องการเปลี่ยนรูปโปรไฟล์ ชื่อเล่น หรือบัญชีรับเงิน?{' '}
            <Link href="/profile" className="text-indigo-600 font-bold hover:underline">
              ไปที่หน้าตั้งค่าส่วนตัว
            </Link>
          </p>
        </div>

      </div>
    </main>
  )
}