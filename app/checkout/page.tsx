'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CheckoutForm() {
  const [tutor, setTutor] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  const [hours, setHours] = useState(1)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('09:00 - 11:00')
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
        const { data: tData, error: tError } = await supabase
          .from('tutors')
          .select('*')
          .eq('email', tutorEmail)
          .maybeSingle()

        if (tError) console.error('Error fetching tutor:', tError)
        setTutor(tData)
      }

      const { data: sData } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      setSettings(sData || { promptpay_number: '0812345678', commission_rate: 15 })
    } catch (err) {
      console.error('Error in fetchCheckoutData:', err)
    } finally {
      setFetching(false)
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
    if (!slipFile || !tutor) {
      alert('กรุณาแนบสลิปการโอนเงินก่อนยืนยันการจอง')
      return
    }
    if (!bookingDate) {
      alert('กรุณาเลือกวันที่ต้องการเรียน')
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

      const totalAmount = Number(tutor.price) * Number(hours)
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
          booking_time: bookingTime,
          course_status: 'pending_confirm'
        }
      ])

      if (payError) {
        alert('เกิดข้อผิดพลาดในการบันทึกการชำระเงิน: ' + payError.message)
        setLoading(false)
        return
      }

      await supabase.from('messages').insert([
        {
          sender: userEmail,
          receiver: tutor.email,
          content: `📅 [แจ้งจองคอร์สเรียน] นักเรียนได้จองเวลาเรียนวันที่ ${bookingDate} (${bookingTime}) จำนวน ${hours} ชั่วโมง เรียบร้อยแล้วครับ`
        }
      ])

      alert('จองคอร์สเรียนและส่งสลิปสำเร็จ!')
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
        กำลังโหลดข้อมูลการจอง...
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

  const totalPrice = Number(tutor.price) * Number(hours)

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center items-center">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-center border-b pb-3">
          <h1 className="font-black text-base md:text-lg text-slate-800">💳 จองคอร์สเรียน & ชำระเงิน</h1>
          <Link href="/" className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">← กลับ</Link>
        </div>

        <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-xs space-y-1.5">
          <div className="flex justify-between"><span className="text-slate-500">ติวเตอร์:</span><strong className="text-slate-800">{tutor.name}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">วิชาสอน:</span><strong className="text-indigo-600">{tutor.subject}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">ค่าเรียน:</span><strong className="text-slate-800">{tutor.price} บาท/ชั่วโมง</strong></div>
        </div>

        <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">จำนวนชั่วโมง</label>
              <input
                type="number" min="1" max="20" required
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-slate-800"
                value={hours} onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">รอบเวลาเรียน</label>
              <select
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-slate-800"
                value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}
              >
                <option value="09:00 - 11:00">09:00 - 11:00 น.</option>
                <option value="13:00 - 15:00">13:00 - 15:00 น.</option>
                <option value="16:00 - 18:00">16:00 - 18:00 น.</option>
                <option value="19:00 - 21:00">19:00 - 21:00 น.</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">วันที่ต้องการเรียน</label>
            <input
              type="date" required
              className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-slate-800"
              value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
            />
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-1">
            <span className="text-slate-500 block">ยอดโอนชำระผ่าน PromptPay เบอร์: <strong>{settings?.promptpay_number || '0812345678'}</strong></span>
            <span className="text-2xl font-black text-emerald-600">{totalPrice.toLocaleString()} บาท</span>
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
            {loading ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการจอง & ส่งสลิป'}
          </button>
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