'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function CheckoutContent() {
  const [tutor, setTutor] = useState<{ name: string; nickname?: string; price: number; email: string } | null>(null)
  const [hours, setHours] = useState(1)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [paid, setPaid] = useState(false)
  
  // Settings From Admin
  const [promptPayNumber, setPromptPayNumber] = useState('0812345678')
  const [commissionRate, setCommissionRate] = useState(0.15)

  const searchParams = useSearchParams()
  const tutorEmailParam = searchParams.get('tutor')
  const router = useRouter()

  useEffect(() => {
    initCheckout()
  }, [])

  async function initCheckout() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUserEmail(session.user.email || '')

    // ดึงตั้งค่าพร้อมเพย์และคอมมิชชันจากแอดมิน
    const { data: settings } = await supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle()
    if (settings) {
      if (settings.promptpay_number) setPromptPayNumber(settings.promptpay_number)
      if (settings.commission_rate) setCommissionRate(Number(settings.commission_rate) / 100)
    }

    if (tutorEmailParam) {
      const { data } = await supabase.from('tutors').select('*').eq('email', tutorEmailParam).maybeSingle()
      if (data) setTutor(data)
    }
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">กำลังโหลด...</div>
  if (!tutor) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">ไม่พบข้อมูลติวเตอร์ <Link href="/" className="text-indigo-600 underline ml-2">กลับหน้าหลัก</Link></div>

  const totalPrice = tutor.price * hours
  const commissionAmount = totalPrice * commissionRate
  const tutorNetAmount = totalPrice - commissionAmount

  const qrCodeUrl = `https://promptpay.io/${promptPayNumber}/${totalPrice}.png`

  const handleConfirmPayment = async () => {
    setPaid(true)

    await supabase.from('payments').insert([
      {
        student_email: userEmail,
        tutor_email: tutor.email,
        amount: totalPrice,
        commission_amount: commissionAmount,
        tutor_amount: tutorNetAmount,
        status: 'completed'
      }
    ])

    const paymentMsg = `💳 [ชำระเงินสำเร็จ] นัดเรียน ${hours} ชั่วโมง รวมเป็นเงิน ${totalPrice.toLocaleString()} บาท (ผ่านระบบเรียบร้อยแล้ว)`
    await supabase.from('messages').insert([
      { sender: userEmail, receiver: tutor.email, content: paymentMsg }
    ])

    setTimeout(() => {
      alert('ชำระเงินสำเร็จแล้ว!')
      router.push(`/chat?tutor=${encodeURIComponent(tutor.email)}`)
    }, 1500)
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full">
        <div className="text-center mb-6">
          <span className="text-3xl">📱</span>
          <h1 className="text-2xl font-black text-slate-800 mt-2">สแกนชำระเงินค่าเรียน</h1>
          <p className="text-xs text-slate-400 mt-1">ชำระผ่าน PromptPay QR Code</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>ติวเตอร์:</span>
            <span className="font-bold text-slate-800">{tutor.name} {tutor.nickname ? `(${tutor.nickname})` : ''}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>ราคาต่อชั่วโมง:</span>
            <span className="font-bold text-slate-800">{tutor.price} บาท</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-200/60">
            <span>จำนวนชั่วโมง:</span>
            <select 
              value={hours} 
              onChange={(e) => setHours(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800"
            >
              {[1, 2, 3, 4, 5, 10].map((h) => (
                <option key={h} value={h}>{h} ชั่วโมง</option>
              ))}
            </select>
          </div>
          <div className="flex justify-between text-slate-800 font-extrabold text-sm pt-2 border-t border-slate-200">
            <span>ยอดชำระสุทธิ:</span>
            <span className="text-emerald-600 text-base">{totalPrice.toLocaleString()} บาท</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border-2 border-dashed border-indigo-200 mb-6">
          <img src={qrCodeUrl} alt="PromptPay QR Code" className="w-48 h-48 rounded-xl shadow-sm" />
          <p className="text-[11px] text-slate-400 mt-3 font-medium">สแกนด้วยแอปธนาคารใดก็ได้</p>
        </div>

        <button
          onClick={handleConfirmPayment}
          disabled={paid}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:bg-slate-300"
        >
          {paid ? 'กำลังยืนยันการชำระเงิน...' : 'ฉันสแกนจ่ายเงินเรียบร้อยแล้ว'}
        </button>

        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-slate-400 hover:underline">← ยกเลิกและกลับหน้าแรก</Link>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">กำลังโหลด...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}