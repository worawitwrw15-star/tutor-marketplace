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
  const [selectedSlots, setSelectedSlots] = useState<any[]>([])
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

  async function fetchSlots(tEmail: string, date: string) {
    const { data } = await supabase
      .from('tutor_schedules')
      .select('*')
      .eq('tutor_email', tEmail)
      .eq('available_date', date)
      .eq('is_booked', false)

    const sorted = (data || []).sort((a, b) => a.time_slot.localeCompare(b.time_slot))
    setAvailableSlots(sorted)
    setSelectedSlots([])
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setBookingDate(newDate)
    if (tutor?.email) {
      fetchSlots(tutor.email, newDate)
    }
  }

  const toggleSelectSlot = (slot: any) => {
    if (selectedSlots.some((s) => s.id === slot.id)) {
      setSelectedSlots(selectedSlots.filter((s) => s.id !== slot.id))
    } else {
      setSelectedSlots([...selectedSlots, slot])
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
    if (selectedSlots.length === 0) {
      alert('กรุณาเลือกอย่างน้อย 1 ช่วงเวลาเรียนครับ')
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

      const unitPrice = Number(tutor.price) < 50 ? 50 : Number(tutor.price)
      const totalAmount = unitPrice * selectedSlots.length
      const commissionRate = Number(settings?.commission_rate || 15)
      const commissionAmount = (totalAmount * commissionRate) / 100
      const tutorAmount = totalAmount - commissionAmount

      const timeSlotText = selectedSlots.map((s) => s.time_slot).join(', ')

      const { error: payError } = await supabase.from('payments').insert([
        {
          student_email: userEmail,
          tutor_email: tutor.email,
          amount: totalAmount,
          commission_amount: commissionAmount,
          tutor_amount: tutorAmount,
          slip_url: slipUrl,
          booking_date: bookingDate,
          booking_time: timeSlotText,
          course_status: 'pending_confirm'
        }
      ])

      if (payError) {
        alert('เกิดข้อผิดพลาดในการบันทึกการชำระเงิน: ' + payError.message)
        setLoading(false)
        return
      }

      const slotIds = selectedSlots.map((s) => s.id)
      await supabase
        .from('tutor_schedules')
        .update({ is_booked: true, student_email: userEmail })
        .in('id', slotIds)

      await supabase.from('messages').insert([
        {
          sender: userEmail,
          receiver: tutor.email,
          content: `📅 [แจ้งจองคอร์สเรียน] จองวันที่ ${bookingDate} จำนวน ${selectedSlots.length} ชั่วโมง (${timeSlotText}) เรียบร้อยแล้วครับ`
        }
      ])

      alert('จองตารางสอนสำเร็จ!')
      router.push('/chat')
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-medium">กำลังโหลดข้อมูล...</div>
  }

  if (!tutor) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center text-center space-y-3">
        <p className="text-xs text-slate-500 font-bold">ไม่พบข้อมูลติวเตอร์</p>
        <Link href="/" className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl">กลับหน้าแรก</Link>
      </main>
    )
  }

  const unitPrice = Number(tutor.price) < 50 ? 50 : Number(tutor.price)
  const totalAmount = unitPrice * (selectedSlots.length || 1)
  const promptpayNumber = settings?.promptpay_number || '0649538717'
  const qrCodeUrl = `https://promptpay.io/${promptpayNumber}/${totalAmount}.png`

  return (
    <main className="min-h-screen bg-slate-50/80 p-4 md:p-8 flex justify-center items-center pb-12">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-xl border border-slate-200/80 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h1 className="font-extrabold text-base md:text-lg text-slate-800">📅 จองตารางสอน & ชำระเงิน</h1>
            <p className="text-[11px] text-slate-400">เลือกเวลาและสแกนชำระเงินผ่าน PromptPay</p>
          </div>
          <Link href="/" className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl transition">
            ← กลับ
          </Link>
        </div>

        {/* Tutor Summary Card */}
        <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 text-xs space-y-2">
          <div className="flex justify-between items-center"><span className="text-slate-500">ติวเตอร์:</span><strong className="text-slate-800 text-sm font-black">{tutor.name}</strong></div>
          <div className="flex justify-between items-center"><span className="text-slate-500">วิชาสอน:</span><strong className="text-indigo-600 font-extrabold bg-indigo-100/60 px-2 py-0.5 rounded-lg">{tutor.subject}</strong></div>
          <div className="flex justify-between items-center"><span className="text-slate-500">อัตราค่าเรียน:</span><strong className="text-emerald-600 font-extrabold">{unitPrice} บาท/ชั่วโมง</strong></div>
        </div>

        <form onSubmit={handleSubmitPayment} className="space-y-5 text-xs">
          
          {/* Step 1: Select Date */}
          <div className="space-y-1.5">
            <label className="block font-extrabold text-slate-800 text-xs">1. เลือกวันที่ต้องการเรียน</label>
            <input
              type="date" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={bookingDate} onChange={handleDateChange}
            />
          </div>

          {/* Step 2: Select Time Slots */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block font-extrabold text-slate-800 text-xs">2. เลือกรอบเวลา (เลือกได้หลายรอบ)</label>
              <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                เลือกแล้ว {selectedSlots.length} ชม.
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/60 text-amber-800 text-center space-y-1">
                <span className="text-lg">⚠️</span>
                <p className="font-bold">ติวเตอร์ยังไม่ได้เปิดรับสอนในวันที่เลือก</p>
                <p className="text-[11px] text-amber-600">กรุณาเปลี่ยนไปเลือกวันอื่น หรือทักแชทสอบถามติวเตอร์ได้ครับ</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlots.some((s) => s.id === slot.id)
                  return (
                    <button
                      type="button"
                      key={slot.id}
                      onClick={() => toggleSelectSlot(slot)}
                      className={`p-3 rounded-2xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-[1.02]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>⏰ {slot.time_slot}</span>
                      {isSelected && <span className="text-emerald-300 font-black">✓</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Step 3: Payment Details & Slip */}
          {selectedSlots.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-inner">
                <h3 className="font-extrabold text-xs text-slate-800">3. สแกน QR Code ชำระเงิน</h3>
                <div className="bg-white p-3 inline-block rounded-2xl shadow-md border border-slate-100">
                  <img src={qrCodeUrl} alt="PromptPay QR Code" className="w-44 h-44 object-contain mx-auto" />
                </div>
                <div className="text-xs space-y-1 bg-white p-3 rounded-2xl border border-slate-100">
                  <p className="text-slate-500">จำนวน: <strong className="text-slate-800">{selectedSlots.length} ชั่วโมง</strong></p>
                  <p className="text-slate-500">ยอดชำระสุทธิ: <strong className="text-emerald-600 text-base font-black">{totalAmount.toLocaleString()} บาท</strong></p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-extrabold text-slate-800 text-xs">แนบสลิปการโอนเงิน</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  required 
                  onChange={handleFileChange} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-2xl bg-slate-50 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition" 
                />
                {slipPreview && (
                  <div className="pt-2 text-center">
                    <img src={slipPreview} alt="Preview" className="max-h-36 mx-auto rounded-2xl shadow-md border border-slate-200" />
                  </div>
                )}
              </div>

              <button
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-indigo-600/20 transition disabled:bg-slate-300"
              >
                {loading ? 'กำลังบันทึกข้อมูล...' : `ยืนยันการจอง ${selectedSlots.length} ชม. (${totalAmount.toLocaleString()} บาท)`}
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-medium">กำลังโหลด...</div>}>
      <CheckoutForm />
    </Suspense>
  )
}