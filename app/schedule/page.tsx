'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
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

export default function TutorSchedulePage() {
  const [userEmail, setUserEmail] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [existingSchedules, setExistingSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    initTutorSchedule()
  }, [])

  async function initTutorSchedule() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) {
      router.push('/login')
      return
    }
    const email = session.user.email
    setUserEmail(email)

    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
    fetchSchedules(email, today)
  }

  async function fetchSchedules(email: string, date: string) {
    setLoading(true)
    const { data } = await supabase
      .from('tutor_schedules')
      .select('*')
      .eq('tutor_email', email)
      .eq('available_date', date)

    setExistingSchedules(data || [])
    setLoading(false)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    setSelectedSlots([])
    fetchSchedules(userEmail, newDate)
  }

  const toggleSlotSelect = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot))
    } else {
      setSelectedSlots([...selectedSlots, slot])
    }
  }

  const handleSaveSchedules = async () => {
    if (!selectedDate || selectedSlots.length === 0) {
      alert('กรุณาเลือกช่วงเวลาที่ต้องการเปิดรับสอน')
      return
    }

    setLoading(true)
    const insertData = selectedSlots.map((slot) => ({
      tutor_email: userEmail,
      available_date: selectedDate,
      time_slot: slot,
      is_booked: false
    }))

    const { error } = await supabase.from('tutor_schedules').insert(insertData)

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      alert('บันทึกเวลาเปิดสอนเรียบร้อยแล้ว!')
      setSelectedSlots([])
      fetchSchedules(userEmail, selectedDate)
    }
    setLoading(false)
  }

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('ต้องการลบช่วงเวลานี้หรือไม่?')) return
    await supabase.from('tutor_schedules').delete().eq('id', id)
    fetchSchedules(userEmail, selectedDate)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center items-center">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h1 className="font-black text-base md:text-lg text-slate-800">📅 จัดการตารางสอน & เปิดวันว่าง</h1>
            <p className="text-xs text-slate-400">{userEmail}</p>
          </div>
          <Link href="/" className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
            ← หน้าหลัก
          </Link>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">เลือกวันที่ต้องการเปิดสอน</label>
            <input
              type="date"
              className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-slate-800"
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-2">เลือกช่วงเวลาที่เปิดสอน (คลิกเลือกได้หลายช่อง)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isAlreadyAdded = existingSchedules.some((item) => item.time_slot === slot)
                const isSelected = selectedSlots.includes(slot)

                return (
                  <button
                    key={slot}
                    disabled={isAlreadyAdded}
                    onClick={() => toggleSlotSelect(slot)}
                    className={`py-2.5 px-2 rounded-xl text-[11px] font-bold border transition ${
                      isAlreadyAdded
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    {slot} {isAlreadyAdded ? '(เปิดแล้ว)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedSlots.length > 0 && (
            <button
              onClick={handleSaveSchedules}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-md transition"
            >
              บันทึกการเปิดสอน ({selectedSlots.length} ช่วงเวลา)
            </button>
          )}

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-700">ช่วงเวลาที่เปิดรับสอนในวันที่ {selectedDate}:</h3>
            {existingSchedules.length === 0 ? (
              <p className="text-slate-400 py-2 text-center">ยังไม่มีตารางสอนในวันนี้</p>
            ) : (
              <div className="space-y-2">
                {existingSchedules.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl"
                  >
                    <span className="font-bold text-slate-800">⏰ {item.time_slot}</span>
                    {item.is_booked ? (
                      <span className="text-rose-500 font-bold bg-rose-50 px-2.5 py-1 rounded-lg">
                        ถูกจองแล้ว ({item.student_email})
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteSlot(item.id)}
                        className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 bg-white border border-rose-100 rounded-lg"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}