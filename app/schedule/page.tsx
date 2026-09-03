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
  const [activeTab, setActiveTab] = useState<'booked' | 'manage'>('booked')
  
  const [allBookedSchedules, setAllBookedSchedules] = useState<any[]>([])
  
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

    fetchAllBooked(email)
    fetchSchedules(email, today)
  }

  // ดึงรายการที่ถูกจอง (จัดกลุ่มไม่ให้ซ้ำกัน)
  async function fetchAllBooked(email: string) {
    const { data } = await supabase
      .from('tutor_schedules')
      .select('*')
      .eq('tutor_email', email)
      .eq('is_booked', true)
      .order('available_date', { ascending: true })

    const uniqueBooked = (data || []).filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.available_date === item.available_date && t.time_slot === item.time_slot
      ))
    )

    setAllBookedSchedules(uniqueBooked)
  }

  // ดึงสล็อตทั้งหมดในวันที่เลือก (รวมกลุ่มไม่ให้เวลาแสดงซ้ำใน UI)
  async function fetchSchedules(email: string, date: string) {
    setLoading(true)
    const { data } = await supabase
      .from('tutor_schedules')
      .select('*')
      .eq('tutor_email', email)
      .eq('available_date', date)

    if (!data) {
      setExistingSchedules([])
      setLoading(false)
      return
    }

    // รวมกลุ่มข้อมูลสล็อตเวลาที่ซ้ำกัน ให้แสดงเพียงรายการเดียว
    const map = new Map()
    data.forEach(item => {
      if (!map.has(item.time_slot) || item.is_booked) {
        map.set(item.time_slot, item)
      }
    })

    const uniqueList = Array.from(map.values()).sort((a, b) => a.time_slot.localeCompare(b.time_slot))
    setExistingSchedules(uniqueList)
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

    const { data: existingData } = await supabase
      .from('tutor_schedules')
      .select('available_date, time_slot')
      .eq('tutor_email', userEmail)
      .in('available_date', dateList)

    const insertData: any[] = []

    dateList.forEach((d) => {
      selectedSlots.forEach((slot) => {
        const isAlreadyExist = (existingData || []).some(
          (ex) => ex.available_date === d && ex.time_slot === slot
        )
        if (!isAlreadyExist) {
          insertData.push({
            tutor_email: userEmail,
            available_date: d,
            time_slot: slot,
            is_booked: false
          })
        }
      })
    })

    if (insertData.length === 0) {
      alert('ช่วงเวลาที่เลือกถูกเปิดไว้อยู่แล้วครับ')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('tutor_schedules').insert(insertData)

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      alert(`เปิดเวลาสอนเรียบร้อยแล้ว!`)
      setSelectedSlots([])
      fetchSchedules(userEmail, startDate)
    }
    setLoading(false)
  }

  // ลบทุก Row ของช่วงเวลานั้นในวันที่เลือกเพื่อล้างขยะซ้ำ
  const handleDeleteSlot = async (slotTime: string) => {
    if (!confirm(`ต้องการลบช่วงเวลา ${slotTime} หรือไม่?`)) return
    await supabase
      .from('tutor_schedules')
      .delete()
      .eq('tutor_email', userEmail)
      .eq('available_date', startDate)
      .eq('time_slot', slotTime)

    fetchSchedules(userEmail, startDate)
    fetchAllBooked(userEmail)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center items-start pb-12">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-xl border border-slate-100 space-y-6 mt-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h1 className="font-black text-lg text-slate-800">📅 จัดการตารางสอน</h1>
            <p className="text-xs text-slate-400 font-medium truncate">{userEmail}</p>
          </div>
          <Link href="/" className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl transition">
            ← หน้าหลัก
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('booked')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
              activeTab === 'booked'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🎓</span> ตารางที่นักเรียนจอง ({allBookedSchedules.length})
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
              activeTab === 'manage'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>⚙️</span> เปิด/ปิด สล็อตเวลาว่าง
          </button>
        </div>

        {/* TAB 1: คลาสที่ถูกจองแล้ว */}
        {activeTab === 'booked' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1">
              📌 รายการคลาสที่มีการจองเข้ามาทั้งหมด
            </h2>

            {allBookedSchedules.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100 space-y-1">
                <span className="text-3xl">☕</span>
                <p className="text-xs font-bold text-slate-600">ยังไม่มีนักเรียนจองคลาสเข้ามา</p>
                <p className="text-[11px] text-slate-400">เมื่อมีนักเรียนจองคลาส รายการจะขึ้นแสดงในส่วนนี้ครับ</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {allBookedSchedules.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg">
                          📆 {new Date(item.available_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="font-extrabold text-xs text-slate-800">
                          ⏰ {item.time_slot}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        นักเรียน: <span className="font-bold text-indigo-700">{item.student_email}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Link
                        href={`/chat?tutor=${encodeURIComponent(item.student_email || '')}`}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 shadow-sm"
                      >
                        💬 ทักแชท
                      </Link>
                      <button
                        onClick={() => handleDeleteSlot(item.time_slot)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-xs font-bold px-3 py-2 rounded-xl transition"
                      >
                        ยกเลิกคลาส
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: สล็อตเวลา */}
        {activeTab === 'manage' && (
          <div className="space-y-4 text-xs">
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
              <label className="block font-bold text-slate-700">1. เลือกช่วงวันที่ต้องการเปิดสอน</label>
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
              <label className="block font-bold text-slate-700 mb-2">2. เลือกช่วงเวลาที่เปิดสอน (เลือกได้หลายช่วง)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedSlots.includes(slot)

                  return (
                    <button
                      key={slot}
                      type="button"
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition disabled:bg-slate-300"
              >
                เปิดตารางสอน ({getDatesInRange(startDate, endDate).length} วัน x {selectedSlots.length} ช่วงเวลา)
              </button>
            )}

            {/* รายการสล็อตเวลาในวันที่เลือก */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="font-bold text-slate-700">
                สล็อตเวลาที่เปิดสอนในวันที่ {startDate}:
              </h3>
              {existingSchedules.length === 0 ? (
                <p className="text-slate-400 py-2 text-center bg-slate-50 rounded-xl">ยังไม่มีการเปิดสล็อตเวลาในวันที่เลือก</p>
              ) : (
                <div className="space-y-2">
                  {existingSchedules.map((item) => (
                    <div
                      key={item.time_slot}
                      className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl"
                    >
                      <span className="font-bold text-slate-800">⏰ {item.time_slot}</span>
                      {item.is_booked ? (
                        <span className="text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 text-[11px]">
                          ถูกจองแล้ว ({item.student_email})
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(item.time_slot)}
                          className="text-rose-500 hover:text-rose-700 font-bold px-3 py-1 bg-white border border-rose-100 rounded-lg hover:bg-rose-50 transition"
                        >
                          ลบสล็อต
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}