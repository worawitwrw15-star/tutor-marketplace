'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const TIME_SLOTS = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
  '20:00 - 21:00'
]

function CheckoutContent() {
  const searchParams = useSearchParams()
  const tutorParam = searchParams.get('tutor') || ''

  const [tutor, setTutor] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [studentEmail, setStudentEmail] = useState('')
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()

  useEffect(() => {
    initCheckout()
  }, [tutorParam])

  async function initCheckout() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) {
      router.push('/login')
      return
    }
    setStudentEmail(session.user.email)

    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)

    if (tutorParam) {
      const { data } = await supabase
        .from('tutors')
        .select('*')
        .eq('email', tutorParam)
        .single()

      if (data) setTutor(data)
      fetchAvailableSlots(tutorParam, today)
    } else {
      setLoading(false)
    }
  }

  // ดึงสล็อตว่าง โดยเช็คว่าสล็อตไหนโดนจองไปแล้ว ให้ตัดออกจากตัวเลือกทันที
  async function fetchAvailableSlots(tutorEmail: string, date: string) {
    setLoading(true)
    const { data } = await supabase
      .from('tutor_schedules')
      .select('*')
      .eq('tutor_email', tutorEmail)
      .eq('available_date', date)

    if (!data) {
      setAvailableTimeSlots([])
      setLoading(false)
      return
    }

    // หาสล็อตเวลาที่ถูกจองไปแล้ว
    const bookedSlots = new Set(data.filter(s => s.is_booked).map(s => s.time_slot))

    // หาสล็อตเวลาที่มีการเปิดสอนและยังไม่ถูกจอง
    const freeSlots = Array.from(new Set(
      data
        .filter(s => !s.is_booked && !bookedSlots.has(s.time_slot))
        .map(s => s.time_slot)
    )).sort()

    setAvailableTimeSlots(freeSlots)
    setSelectedSlots([])
    setLoading(false)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    setSelectedDate(date)
    if (tutorParam) fetchAvailableSlots(tutorParam, date)
  }

  const toggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot))
    } else {
      setSelectedSlots([...selectedSlots, slot])
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSlots.length === 0) {
      alert('กรุณาเลือกอย่างน้อย 1 ช่วงเวลา')
      return
    }
    if (!paymentSlip) {
      alert('กรุณาอัปโหลดสลิปการโอนเงินก่อนยืนยันการจอง')
      return
    }

    setSubmitting(true)

    try {
      // 1. อัปโหลดสลิป
      const fileExt = paymentSlip.name.split('.').pop()
      const fileName = `slip_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('slips')
        .upload(fileName, paymentSlip)

      let slipUrl = ''
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('slips').getPublicUrl(fileName)
        slipUrl = urlData.publicUrl
      }

      // 2. บังคับอัปเดตทุก Row ของช่วงเวลาที่เลือกให้เป็น is_booked = true
      const { error: updateError } = await supabase
        .from('tutor_schedules')
        .update({
          is_booked: true,
          student_email: studentEmail
        })
        .eq('tutor_email', tutorParam)
        .eq('available_date', selectedDate)
        .in('time_slot', selectedSlots)

      if (updateError) throw updateError

      alert('ชำระเงินและจองคลาสเรียนสำเร็จแล้ว!')
      router.push('/chat')
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการจอง: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const unitPrice = tutor?.price < 50 ? 50 : tutor?.price || 50
  const totalPrice = unitPrice * selectedSlots.length

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center items-center pb-12">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-xl border border-slate-100 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h1 className="font-black text-base md:text-lg text-slate-800">📅 จองตารางสอน & ชำระเงิน</h1>
            <p className="text-xs text-slate-400">เลือกเวลาและสแกนชำระเงินผ่าน PromptPay</p>
          </div>
          <Link href="/" className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl hover:bg-slate-200 transition">
            ← กลับ
          </Link>
        </div>

        {tutor && (
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">ติวเตอร์:</span>
              <span className="font-extrabold text-slate-800">{tutor.name} ({tutor.email})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">วิชาสอน:</span>
              <span className="font-bold text-indigo-600">{tutor.subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">อัตราค่าเรียน:</span>
              <span className="font-extrabold text-emerald-600">{unitPrice} บาท/ชั่วโมง</span>
            </div>
          </div>
        )}

        <form onSubmit={handleBooking} className="space-y-5 text-xs">
          {/* เลือกวันที่ */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">1. เลือกวันที่ต้องการเรียน</label>
            <input
              type="date"
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>

          {/* เลือกสล็อตเวลา */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block font-bold text-slate-700">2. เลือกรอบเวลาว่าง (เลือกได้หลายรอบ)</label>
              {selectedSlots.length > 0 && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full">
                  เลือกแล้ว {selectedSlots.length} ชม.
                </span>
              )}
            </div>

            {loading ? (
              <p className="text-slate-400 py-4 text-center">กำลังโหลดรอบเวลา...</p>
            ) : availableTimeSlots.length === 0 ? (
              <p className="text-slate-400 py-4 text-center bg-slate-50 rounded-xl">
                ไม่มีรอบเวลาว่างในวันที่เลือก (ถูกจองหมดแล้ว)
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {availableTimeSlots.map((slot) => {
                  const isSelected = selectedSlots.includes(slot)
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      ⏰ {slot} {isSelected && '✓'}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* สแกน PromptPay และแนบสลิป */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-center">
            <h3 className="font-bold text-slate-800">3. สแกน QR Code ชำระเงิน</h3>
            <div className="flex justify-center">
              <img
                src={`https://promptpay.io/0812345678/${totalPrice}.png`}
                alt="PromptPay QR Code"
                className="w-40 h-40 border rounded-2xl p-2 bg-white shadow-sm"
              />
            </div>
            <p className="text-sm font-black text-emerald-600">ยอดชำระทั้งสิ้น: {totalPrice} บาท</p>

            <div className="text-left space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">แนบสลิปการโอนเงิน (Image):</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setPaymentSlip(e.target.files?.[0] || null)}
                className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || selectedSlots.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition disabled:bg-slate-300"
          >
            {submitting ? 'กำลังยืนยันการชำระเงิน...' : `ยืนยันการจอง (${totalPrice} บาท)`}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">กำลังโหลด...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}