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
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
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
    setStartDate(today)
    setEndDate(today)
    fetchSchedules(email, today)
  }

  async function fetchSchedules(email: string, date: string) {
    setLoading(true)
    const { data } = await supabase
      .from('tutor_schedules')
      .select('*')
      .eq('tutor_email', email)
      .eq('available_date', date)

    const sorted = (data || []).sort((a, b) => a.time_slot.localeCompare(b.time_slot))
    setExistingSchedules(sorted)
    setLoading(false)
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setStartDate(newDate)
    if (!endDate || newDate > endDate) setEndDate(newDate)
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

  // สร้างอาร์เรย์รายการวันที่ตั้งแต่วันเริ่มต้นถึงวันสิ้นสุด
  const getDatesInRange = (startStr: string, endStr: string) => {
    const dates = []
    let curr = new Date(startStr)
    const end = new Date(endStr)

    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0])
      curr.setDate(curr.getDate() + 1)
    }
    return dates
  }

  const handleSaveSchedules = async () => {
    if (!startDate || !endDate || selectedSlots.length === 0) {
      alert('กรุณาเลือกช่วงวันที่และเวลาที่ต้องการเปิดรับสอน')
      return
    }

    setLoading(true)
    const dateList = getDatesInRange(startDate, endDate)
    const insertData: any[] = []

    dateList.forEach((d) => {
      selectedSlots.forEach((slot) => {
        insertData.push({
          tutor_email: userEmail,
          available_date: d,
          time_slot: slot,
          is_booked: false
        })
      })
    })

    const { error } = await supabase.from('tutor_schedules').insert(insertData)

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      alert(`บันทึกเวลาเปิดสอนล่วงหน้าเรียบร้อยแล้ว (${dateList.length} วัน)!`)
      setSelectedSlots([])
      fetchSchedules(userEmail, startDate)
    }
    setLoading(false)
  }

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('ต้องการลบช่วงเวลานี้หรือไม่?')) return
    await supabase.from('tutor_schedules').delete().eq('id', id)
    fetchSchedules(userEmail, startDate)
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
          <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
            <label className="block font-bold text-slate-700">เลือกช่วงวันที่เปิดสอน (ตั้งค่าทีเดียวหลายวันได้)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-medium">ตั้งแต่วันที่:</span>
                <input
                  type="date"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  value={startDate}
                  onChange={handleStartDateChange}
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium">ถึงวันที่:</span>
                <input
                  type="date"
                  min={startDate}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-2">เลือกช่วงเวลาที่เปิดสอน (คลิกเลือกได้หลายช่วง)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedSlots.includes(slot)

                return (
                  <button
                    key={slot}
                    onClick={() => toggleSlotSelect(slot)}
                    className={`py-2.5 px-2 rounded-xl text-[11px] font-bold border transition ${
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
          </div>

          {selectedSlots.length > 0 && (
            <button
              onClick={handleSaveSchedules}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-md transition disabled:bg-slate-300"
            >
              เปิดตารางสอน ({getDatesInRange(startDate, endDate).length} วัน x {selectedSlots.length} ช่วงเวลา)
            </button>
          )}

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-700">ช่วงเวลาที่เปิดสอนในวันที่ {startDate}:</h3>
            {existingSchedules.length === 0 ? (
              <p className="text-slate-400 py-2 text-center">ยังไม่มีตารางสอนในวันนี้</p>
            ) : (
              <div className="space-y-2">
                {existingSchedules.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl"
                  >
                    <span className="font-bold text-slate-800">⏰ {item.time_slot}</span>
                    {item.is_booked ? (
                      <span className="text-rose-500 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                        ถูกจองแล้ว ({item.student_email})
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteSlot(item.id)}
                        className="text-rose-500 hover:text-rose-700 font-bold px-2.5 py-1 bg-white border border-rose-100 rounded-lg hover:bg-rose-50 transition"
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