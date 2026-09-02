'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'student' | 'tutor'>('student')
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [subject, setSubject] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกันครับ')
      return
    }

    if (password.length < 6) {
      alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรครับ')
      return
    }

    setLoading(true)

    // 1. สมัครสมาชิกผ่าน Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      alert('การสมัครสมาชิกไม่สำเร็จ: ' + authError.message)
      setLoading(false)
      return
    }

    // 2. บันทึกข้อมูลตั้งต้นลงตารางนักเรียน หรือ ติวเตอร์
    if (role === 'student') {
      const { error: studentError } = await supabase.from('students').insert([
        {
          email,
          name,
          nickname,
          target_subject: subject,
        },
      ])

      if (studentError) console.error('Error creating student profile:', studentError)
    } else {
      const { error: tutorError } = await supabase.from('tutors').insert([
        {
          email,
          name,
          nickname,
          subject,
          price: Number(price) || 0,
          bio: 'สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่การเรียนการสอน',
        },
      ])

      if (tutorError) console.error('Error creating tutor profile:', tutorError)
    }

    alert('สมัครสมาชิกเรียบร้อยแล้ว! กำลังนำคุณไปหน้าเข้าสู่ระบบ...')
    setLoading(false)
    router.push('/login')
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-700 to-violet-800">
      {/* วงกลมกราเดียนต์แสงด้านหลัง */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* ลวดลายไอคอนธีม ติวเตอร์ & นักเรียน */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-20 md:opacity-30 flex flex-wrap justify-around items-center p-8 text-white">
        <div className="text-6xl animate-pulse">🎓</div>
        <div className="text-7xl animate-bounce duration-1000">👨‍🏫</div>
        <div className="text-6xl">📚</div>
        <div className="text-5xl">✍️</div>
        <div className="text-7xl">👩‍🎓</div>
        <div className="text-6xl">💡</div>
      </div>

      {/* กล่องการ์ดสมัครสมาชิก */}
      <div className="relative z-10 bg-white/95 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/20 space-y-5 my-8">
        
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 text-2xl font-black mb-1 shadow-inner">
            ✨
          </div>
          <h1 className="text-2xl font-black text-slate-800">สมัครสมาชิก</h1>
          <p className="text-xs text-slate-500 font-medium">
            เลือกประเภทบัญชีและกรอกข้อมูลเพื่อเริ่มต้นใช้งาน
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-3.5">
          {/* เลือกสถานะผู้ใช้ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ประเภทผู้ใช้งาน
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  role === 'student'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🎓 นักเรียน
              </button>
              <button
                type="button"
                onClick={() => setRole('tutor')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  role === 'tutor'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                👨‍🏫 ติวเตอร์
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              required
              placeholder="กรอกชื่อ-นามสกุล"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อเล่น
            </label>
            <input
              type="text"
              placeholder="กรอกชื่อเล่น"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-400"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {role === 'tutor' ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  วิชาที่สอน
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คณิต, อังกฤษ"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-400"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ค่าสอน (฿/ชม.)
                </label>
                <input
                  type="number"
                  required
                  placeholder="เช่น 150"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-400"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วิชาที่สนใจเรียน
              </label>
              <input
                type="text"
                placeholder="เช่น คณิตศาสตร์, ฟิสิกส์"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-400"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              required
              placeholder="example@email.com"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
            </label>
            <input
              type="password"
              required
              placeholder="ตั้งรหัสผ่าน"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ยืนยันรหัสผ่าน
            </label>
            <input
              type="password"
              required
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:bg-slate-300 mt-2"
          >
            {loading ? 'กำลังลงทะเบียน...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="text-center space-y-2 pt-2 border-t border-slate-100">
          <Link
            href="/login"
            className="block text-xs font-bold text-indigo-600 hover:underline"
          >
            มีบัญชีผู้ใช้แล้ว? เข้าสู่ระบบที่นี่
          </Link>

          <Link
            href="/"
            className="inline-block text-xs font-medium text-slate-400 hover:text-slate-600 transition"
          >
            ← กลับหน้าแรก
          </Link>
        </div>

      </div>
    </main>
  )
}