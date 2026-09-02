'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function CheckoutContent() {
  const [tutor, setTutor] = useState<{ name: string; nickname?: string; price: number; email: string; subject?: string } | null>(null)
  const [hours, setHours] = useState(1)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // State สำหรับแนบสลิป
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)

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

  // ฟังก์ชันเลือกรูปสลิป
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSlipFile(file)
      setSlipPreview(URL.createObjectURL(file))
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">กำลังโหลด...</div>
  if (!tutor) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">ไม่พบข้อมูลติวเตอร์ <Link href="/" className="text-indigo-600 underline ml-2">กลับหน้าหลัก</Link></div>

  const totalPrice = tutor.price * hours
  const commissionAmount = totalPrice * commissionRate
  const tutorNetAmount = totalPrice - commissionAmount

  const qrCodeUrl = `https://promptpay.io/${promptPayNumber}/${totalPrice}.png`

  const handleConfirmPayment = async () => {
    if (!slipFile) {
      alert('กรุณาแนบไฟล์สลิปการโอนเงินก่อนกดบันทึกครับ!')
      return
    }

    setSubmitting(true)

    try {
      // 1. อัปโหลดสลิปไปที่ Supabase Storage (Bucket: slips)
      const fileExt = slipFile.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('slips')
        .upload(filePath, slipFile)

      let slipUrl = ''
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('slips').getPublicUrl(filePath)
        slipUrl = publicUrlData.publicUrl
      } else {
        // Fallback เป็น Base64 หากยังไม่ได้สร้าง Storage Bucket
        slipUrl = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(slipFile)
        })
      }

      // 2. บันทึกข้อมูลลงตาราง payments
      const { error: insertError } = await supabase.from('payments').insert([
        {
          student_email: userEmail,
          tutor_email: tutor.email,
          amount: totalPrice,
          commission_amount: commissionAmount,
          tutor_amount: tutorNetAmount,
          status: 'pending',
          paid_to_tutor: false,
          slip_url: slipUrl
        }
      ])

      if (insertError) {
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + insertError.message)
        setSubmitting(false)
        return
      }

      // 3. ส่งแชทแจ้งเตือนติวเตอร์อัตโนมัติ
      const paymentMsg = `💳 [แจ้งชำระเงิน] นัดเรียน ${hours} ชั่วโมง รวมเป็นเงิน ${totalPrice.toLocaleString()} บาท (แนบหลักฐานสลิปการโอนเรียบร้อยแล้ว)`
      await supabase.from('messages').insert([
        { sender: userEmail, receiver: tutor.email, content: paymentMsg }
      ])

      alert('สแกนจ่ายเงินและส่งสลิปเรียบร้อยแล้ว!')
      router.push(`/chat?tutor=${encodeURIComponent(tutor.email)}`)
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full space-y-6">
        <div className="text-center">
          <span className="text-3xl">📱</span>
          <h1 className="text-2xl font-black text-slate-800 mt-2">สแกนชำระเงินค่าเรียน</h1>
          <p className="text-xs text-slate-400 mt-1">ชำระผ่าน PromptPay QR Code</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
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
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border-2 border-dashed border-indigo-200">
          <img src={qrCodeUrl} alt="PromptPay QR Code" className="w-48 h-48 rounded-xl shadow-sm" />
          <p className="text-[11px] text-slate-400 mt-3 font-medium">สแกนด้วยแอปธนาคารใดก็ได้</p>
        </div>

        {/* ช่องอัปโหลดและพรีวิวสลิป */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            📸 แนบหลักฐานการโอนเงิน (สลิป): <span className="text-rose-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl p-1.5"
          />

          {slipPreview && (
            <div className="mt-3 text-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 mb-2 font-medium">ตัวอย่างสลิปที่เลือก:</p>
              <img src={slipPreview} alt="Slip preview" className="max-h-44 mx-auto rounded-xl shadow-sm border border-slate-200" />
            </div>
          )}
        </div>

        <button
          onClick={handleConfirmPayment}
          disabled={submitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:bg-slate-300"
        >
          {submitting ? 'กำลังบันทึกข้อมูล...' : 'ฉันสแกนจ่ายเงินและแนบสลิปเรียบร้อยแล้ว'}
        </button>

        <div className="text-center">
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