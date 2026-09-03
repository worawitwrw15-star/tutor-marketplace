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
  
  // ข้อมูลเฉพาะของนักเรียน
  const [gradeLevel, setGradeLevel] = useState('')
  
  const [subject, setSubject] = useState('')
  const [price, setPrice] = useState(0)
  const [bio, setBio] = useState('')
  const [bankName, setBankName] = useState('พร้อมเพย์')
  const [bankAccountNo, setBankAccountNo] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      setAvatarUrl(tutor.avatar_url || '')
    } else {
      const { data: student } = await supabase.from('students').select('*').eq('email', email).maybeSingle()
      if (student) {
        setRole('student')
        setName(student.name || '')
        setNickname(student.nickname || '')
        setPhone(student.phone || '')
        setGradeLevel(student.grade_level || '')
        setSubject(student.target_subject || '')
        setAvatarUrl(student.avatar_url || '')
      }
    }
    setLoading(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setUploadingAvatar(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('slips').upload(fileName, file)

      if (uploadError) {
        alert('อัปโหลดรูปภาพไม่สำเร็จ: ' + uploadError.message)
      } else {
        const { data: publicUrlData } = supabase.storage.from('slips').getPublicUrl(fileName)
        setAvatarUrl(publicUrlData.publicUrl)
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

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
          bank_account_name: bankAccountName,
          avatar_url: avatarUrl
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
          grade_level: gradeLevel,
          target_subject: subject,
          avatar_url: avatarUrl
        })
        .eq('email', userEmail)

      if (error) alert('อัปเดตไม่สำเร็จ: ' + error.message)
      else alert('อัปเดตโปรไฟล์นักเรียนเรียบร้อยแล้ว!')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-medium">
        กำลังโหลดข้อมูลโปรไฟล์...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50/80 p-4 md:p-8 flex justify-center items-center pb-12">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-xl border border-slate-200/80 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h1 className="font-extrabold text-base md:text-lg text-slate-800">⚙️ แก้ไขข้อมูลส่วนตัว</h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {userEmail} ({role === 'tutor' ? '👨‍🏫 ติวเตอร์' : '🎓 นักเรียน'})
            </p>
          </div>
          <Link href="/" className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl transition">
            ← หน้าหลัก
          </Link>
        </div>

        {/* Profile Avatar Upload */}
        <div className="flex flex-col items-center justify-center space-y-2 pb-2">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              name.charAt(0) || '👤'
            )}
          </div>
          <label className="cursor-pointer text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition">
            {uploadingAvatar ? 'กำลังอัปโหลด...' : '📷 เปลี่ยนรูปโปรไฟล์'}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
          </label>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          {/* Section 1: Basic Info */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <h3 className="font-bold text-slate-700 text-xs">👤 ข้อมูลส่วนตัว</h3>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text" required
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">ชื่อเล่น</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={nickname} onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tutor / Student Specific Info */}
          {role === 'tutor' ? (
            <>
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h3 className="font-bold text-slate-700 text-xs">📚 รายละเอียดการสอน</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">วิชาที่สอน</label>
                    <input
                      type="text" required
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={subject} onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">ค่าสอน (฿/ชม.)</label>
                    <input
                      type="number" required
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={price} onChange={(e) => setPrice(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">แนะนำตัว / ประวัติการสอน</label>
                  <textarea
                    rows={3}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={bio} onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>

              {/* Section 3: Bank Details */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
                <h3 className="font-extrabold text-indigo-900 text-xs">🏦 บัญชีรับเงินค่าสอนจากแพลตฟอร์ม</h3>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ธนาคาร / พร้อมเพย์</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={bankName} onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลขบัญชี / เบอร์พร้อมเพย์</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อบัญชี</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <h3 className="font-bold text-slate-700 text-xs">🎓 รายละเอียดการเรียน</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">ระดับชั้น</label>
                  <select
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                  >
                    <option value="">-- เลือกระดับชั้น --</option>
                    <option value="ประถมศึกษา">ประถมศึกษา</option>
                    <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น</option>
                    <option value="มัธยมศึกษาตอนปลาย">มัธยมศึกษาตอนปลาย</option>
                    <option value="อุดมศึกษา / มหาวิทยาลัย">อุดมศึกษา / มหาวิทยาลัย</option>
                    <option value="บุคคลทั่วไป">บุคคลทั่วไป</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">วิชาที่สนใจเรียน</label>
                  <input
                    type="text"
                    placeholder="เช่น วิทยาศาสตร์, อังกฤษ"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={subject} onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition disabled:bg-slate-300"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </form>
      </div>
    </main>
  )
}