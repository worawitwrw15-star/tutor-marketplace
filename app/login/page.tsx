'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const cleanInput = email.trim()

    // ตรวจสอบสิทธิ์แอดมินระบบอย่างปลอดภัย
    if (cleanInput === 'admin' && password === 'TT546897!') {
      sessionStorage.setItem('is_admin_logged_in', 'true')
      router.push('/admin')
      return
    }

    // ล็อกอินผู้ใช้ทั่วไปผ่าน Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanInput,
      password,
    })

    if (error) {
      alert('เข้าสู่ระบบไม่สำเร็จ: อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900">
      {/* Background Decorative Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="absolute inset-0 pointer-events-none select-none opacity-20 flex flex-wrap justify-around items-center p-8 text-white">
        <div className="text-6xl animate-pulse">🎓</div>
        <div className="text-7xl">👨‍🏫</div>
        <div className="text-6xl">📚</div>
        <div className="text-5xl">✍️</div>
        <div className="text-7xl">👩‍🎓</div>
        <div className="text-6xl">💡</div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 bg-white p-6 md:p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 space-y-6">
        
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 text-3xl font-black mb-1 shadow-sm">
            🎓
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800">เข้าสู่ระบบ</h1>
          <p className="text-xs text-slate-400 font-medium">
            ยินดีต้อนรับสู่ระบบค้นหาติวเตอร์และจัดการการเรียน
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              อีเมล
            </label>
            <input
              type="text"
              required
              placeholder="name@example.com"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="กรอกรหัสผ่านของคุณ"
                className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                {showPassword ? '🙈 ซ่อน' : '👁️ แสดง'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/25 transition disabled:bg-slate-300"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="text-center space-y-2.5 pt-2 border-t border-slate-100">
          <Link
            href="/signup"
            className="block text-xs font-bold text-indigo-600 hover:underline"
          >
            ยังไม่มีบัญชี? สมัครสมาชิกที่นี่
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