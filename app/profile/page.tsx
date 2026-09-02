'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState('')
  const [role, setRole] = useState<'tutor' | 'student' | 'guest'>('guest')
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [price, setPrice] = useState(0)
  const [bio, setBio] = useState('')
  const [bankName, setBankName] = useState('พร้อมเพย์')
  const [bankAccountNo, setBankAccountNo] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    fetchUserData()
  }, [])

  async function fetchUserData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) {
      router.push('/login')
      return
    }
    const email = session.user.email
    setUserEmail(email)

    // ตรวจสอบว่าเป็นติวเตอร์หรือนักเรียน
    const { data: tutor } = await supabase.from('tutors').select('*').eq('email', email).maybeSingle()
    if (tutor) {
      setRole('tutor')
      setName(tutor.name || '')
      setNickname(tutor.nickname || '')
      setPhone(tutor.phone || '')
      setSubject(tutor.subject || '')
      setPrice(tutor.price || 0)
      setBio(tutor.bio || '')
      setBankName(tutor.bank_name || 'พร้อมเพย์')
      setBankAccountNo(tutor.bank_account_no || '')
      setBankAccountName(tutor.bank_account_name || '')
    } else {
      const { data: student } = await supabase.from('students').select('*').eq('email', email).maybeSingle()
      if (student) {
        setRole('student')
        setName(student.name || '')
        setNickname(student.nickname || '')
        setPhone(student.phone || '')
        setSubject(student.target_subject || '')
      }
    }
    setLoading(false)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (role === 'tutor') {
      const { error } = await supabase
        .from('tutors')
        .update({
          name,
          nickname,
          phone,
          subject,
          price: Number(price),
          bio,
          bank_name: bankName,
          bank_account_no: bankAccountNo,
          bank_account_name: bankAccountName
        })
        .eq('email', userEmail)

      if (error) alert('อัปเดตไม่สำเร็จ: ' + error.message)
      else alert('อัปเดตโปรไฟล์ติวเตอร์เรียบร้อยแล้ว!')
    } else if (role === 'student') {
      const { error } = await supabase
        .from('students')
        .update({
          name,
          nickname,
          phone,
          target_subject: subject
        })
        .eq('email', userEmail)

      if (error) alert('อัปเดตไม่สำเร็จ: ' + error.message)
      else alert('อัปเดตโปรไฟล์นักเรียนเรียบร้อยแล้ว!')
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">กำลังโหลดข้อมูลโปรไฟล์...</div>
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center items-center">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h1 className="font-black text-base md:text-lg text-slate-800">⚙️ แก้ไขข้อมูลส่วนตัว</h1>
            <p className="text-xs text-slate-400">{userEmail} ({role === 'tutor' ? '👨‍🏫 ติวเตอร์' : '🎓 นักเรียน'})</p>
          </div>
          <Link href="/" className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
            ← หน้าหลัก
          </Link>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
            <input
              type="text" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อเล่น</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                value={nickname} onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                value={phone} onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {role === 'tutor' ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">วิชาที่สอน</label>
                  <input
                    type="text" required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                    value={subject} onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ค่าสอน (฿/ชม.)</label>
                  <input
                    type="number" required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                    value={price} onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">แนะนำตัว / ประวัติการสอน</label>
                <textarea
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  value={bio} onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <h3 className="font-extrabold text-indigo-900">🏦 ข้อมูลบัญชีรับเงินค่าสอนจากแอดมิน</h3>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ธนาคาร / พร้อมเพย์</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
                    value={bankName} onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เลขบัญชี / เบอร์พร้อมเพย์</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
                    value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ชื่อบัญชี</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
                    value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block font-bold text-slate-700 mb-1">วิชาที่สนใจเรียน</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                value={subject} onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-md transition"
          >
            บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </div>
    </main>
  )
}