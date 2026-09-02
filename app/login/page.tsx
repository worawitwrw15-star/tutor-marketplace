'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert('เกิดข้อผิดพลาด: ' + error.message)
      else alert('สมัครสมาชิกสำเร็จ! โปรดตรวจสอบอีเมลเพื่อยืนยัน')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert('เข้าสู่ระบบไม่สำเร็จ: ' + error.message)
      else {
        alert('เข้าสู่ระบบสำเร็จ!')
        router.push('/')
      }
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input type="email" required className="w-full p-3 border rounded-lg text-gray-800" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input type="password" required className="w-full p-3 border rounded-lg text-gray-800" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition">
            {loading ? 'กำลังดำเนินการ...' : isSignUp ? 'ยืนยันการสมัคร' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <button 
          onClick={() => setIsSignUp(!isSignUp)} 
          className="w-full text-center text-sm text-indigo-600 mt-4 hover:underline"
        >
          {isSignUp ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิกที่นี่'}
        </button>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:underline">← กลับหน้าแรก</Link>
        </div>
      </div>
    </main>
  )
}