'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CheckoutForm() {
  const [tutor, setTutor] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null)
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()
  const tutorEmail = searchParams.get('tutor')

  useEffect(() => {
    fetchCheckoutData()
  }, [tutorEmail])

  async function fetchCheckoutData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) {
        router.push('/login')
        return
      }
      setUserEmail(session.user.email)

      if (tutorEmail) {
        const { data: tData } = await supabase
          .from('tutors')
          .select('*')
          .eq('email', tutorEmail)
          .maybeSingle()
        setTutor(tData)
      }

      const { data: sData } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      setSettings(sData || { promptpay_number: '0649538717', commission_rate: 15 })

      const today = new Date().toISOString().split('T')[0]
      setBookingDate(today)
      if (tutorEmail) fetchSlots(tutorEmail, today)
    } catch (err) {
      console.error('Error fetching checkout data:', err)
    } finally {
      setFetching(false)
    }
  }

  // ดึงสล็อตเวลาว่างจากตารางสอนของติวเตอร์
  async function fetchSlots(tEmail: string, date: string) {
    const { data } = await supabase
      .from('tutor_schedules')
      .select('*')
      .eq('tutor_email', tEmail)
      .eq('available_date', date)
      .eq('is_booked', false)

    setAvailableSlots(data || [])
    setSelectedSlot(null)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setBookingDate(newDate)
    if (tutor?.email) {
      fetchSlots(tutor.email, newDate)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSlipFile(file)
      setSlipPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) {
      alert('กรุณาเลือกรอบเวลาเรียนจากตารางสอนก่อนครับ')
      return
    }
    if (!slipFile || !tutor) {
      alert('กรุณาแนบสลิปการโอนเงินก่อนยืนยันการจอง')
      return
    }

    setLoading(true)

    try {
      const fileExt = slipFile.name.split('.').pop()
      const fileName = `slip_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('slips').upload(fileName, slipFile)

      let slipUrl = ''
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('slips').getPublicUrl(fileName)
        slipUrl = publicUrlData.publicUrl
      } else {
        slipUrl = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(slipFile)
        })
      }

      const totalAmount = Number(tutor.price) < 50 ? 50 : Number(tutor.price)
      const commissionRate = Number(settings?.commission_rate || 15)
      const commissionAmount = (totalAmount * commissionRate) / 100
      const tutorAmount = totalAmount - commissionAmount

      const { error: payError } = await supabase.from('payments').insert([
        {
          student_email: userEmail,
          tutor_email: tutor.email,
          amount: totalAmount,
          commission_amount: commissionAmount,
          tutor_amount: tutorAmount,
          slip_url: slipUrl,
          booking_date: bookingDate,
          booking_time: selectedSlot.time_slot,
          course_status: 'pending_confirm'
        }
      ])

      if (payError) {
        alert('เกิดข้อผิดพลาดในการบันทึกการชำระเงิน: ' + payError.message)
        setLoading(false)
        return
      }

      // ล็อกสล็อตตารางสอนของติวเตอร์ เปลี่ยนสถานะเป็นถูกจองแล้ว
      await supabase
        .from('tutor_schedules')
        .update({ is_booked: true, student_email: userEmail })
        .eq('id', selectedSlot.id)

      await supabase.from('messages').insert([
        {
          sender: userEmail,
          receiver: tutor.email,
          content: `📅 [แจ้งจองคอร์สเรียน] นักเรียนได้จองตารางสอนวันที่ ${bookingDate} รอบเวลา ${selectedSlot.time_slot} เรียบร้อยแล้วครับ`
        }
      ])

      alert('จองตารางสอนและแนบสลิปสำเร็จ!')
      router.push('/chat')
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">
        กำลังโหลดข้อมูลตารางสอน...
      </div>
    )
  }

  if (!tutor) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center text-center space-y-3">
        <p className="text-xs text-slate-500 font-bold">ไม่พบข้อมูลติวเตอร์ หรือลิงก์ไม่ถูกต้อง</p>
        <Link href="/" className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
          กลับหน้าแรก
        </Link>
      </main>
    )
  }

  const unitPrice = Number(tutor.price) < 50 ? 50 : Number(tutor.price)
  const promptpayNumber = settings?.promptpay_number || '0649538717'
  const qrCodeUrl = `https://promptpay.io/${promptpayNumber}/${unitPrice}.png`

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center items-center">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-center border-b pb-3">
          <h1 className="font-black text-base md:text-lg text-slate-800">📅 จองตารางสอน & ชำระเงิน</h1>
          <Link href="/" className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">← กลับ</Link>
        </div>

        <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-xs space-y-1.5">
          <div className="flex justify-between"><span className="text-slate-500">ติวเตอร์:</span><strong className="text-slate-800">{tutor.name}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">วิชาสอน:</span><strong className="text-indigo-600">{tutor.subject}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">ค่าเรียน:</span><strong className="text-slate-800">{unitPrice} บาท/ชั่วโมง</strong></div>
        </div>

        <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">1. เลือกวันที่ต้องการเรียน</label>
            <input
              type="date" required
              className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-slate-800"
              value={bookingDate} onChange={handleDateChange}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">2. เลือกรอบเวลาว่างของติวเตอร์</label>
            {availableSlots.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-center font-medium">
                ⚠️ ติวเตอร์ยังไม่ได้เปิดตารางสอนในวันที่เลือก กรุณาเปลี่ยนไปเลือกวันอื่นครับ
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-xl font-bold border transition text-center ${
                      selectedSlot?.id === slot.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    ⏰ {slot.time_slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedSlot && (
            <>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-3">
                <h3 className="font-extrabold text-xs text-slate-700">📱 สแกน QR Code เพื่อชำระเงิน</h3>
                <div className="bg-white p-3 inline-block rounded-2xl shadow-sm border border-slate-100">
                  <img src={qrCodeUrl} alt="PromptPay QR Code" className="w-44 h-44 object-contain mx-auto" />
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="text-slate-500">พร้อมเพย์: <strong className="text-slate-800">{promptpayNumber}</strong></p>
                  <p className="text-slate-500">ยอดชำระสุทธิ: <strong className="text-emerald-600 text-base font-black">{unitPrice.toLocaleString()} บาท</strong></p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">แนบสลิปการโอนเงิน</label>
                <input type="file" accept="image/*" required onChange={handleFileChange} className="w-full text-xs p-2 border rounded-xl" />
                {slipPreview && <img src={slipPreview} alt="Preview" className="max-h-32 mx-auto rounded-lg mt-2 shadow-sm" />}
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-md transition disabled:bg-slate-300"
              >
                {loading ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการจองตารางสอน & ส่งสลิป'}
              </button>
            </>
          )}
        </form>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">กำลังโหลดหน้าชำระเงิน...</div>}>
      <CheckoutForm />
    </Suspense>
  )
}