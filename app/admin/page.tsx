'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [payments, setPayments] = useState<any[]>([])
  const [tutors, setTutors] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({ promptpay_number: '', commission_rate: 15 })
  const [activeTab, setActiveTab] = useState<'payments' | 'messages' | 'tutors' | 'students' | 'settings'>('payments')
  const [loading, setLoading] = useState(true)
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null)
  const [chatUser, setChatUser] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const router = useRouter()
  const ADMIN_EMAIL = 'system_admin@platform.com'

  useEffect(() => {
    fetchAdminData()
  }, [])

  async function fetchAdminData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.email !== ADMIN_EMAIL) {
      router.push('/')
      return
    }

    const { data: payData } = await supabase.from('payments').select('*').order('created_at', { ascending: false })
    const { data: tutData } = await supabase.from('tutors').select('*')
    const { data: stuData } = await supabase.from('students').select('*')
    const { data: msgData } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
    const { data: setDa } = await supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle()

    setPayments(payData || [])
    setTutors(tutData || [])
    setStudents(stuData || [])
    setMessages(msgData || [])
    if (setDa) setSettings(setDa)
    setLoading(false)
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from('payments').update({ course_status: status }).eq('id', id)
    fetchAdminData()
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('platform_settings').upsert({
      id: 1,
      promptpay_number: settings.promptpay_number,
      commission_rate: Number(settings.commission_rate)
    })

    if (error) alert('เกิดข้อผิดพลาด: ' + error.message)
    else alert('บันทึกการตั้งค่าสำเร็จ!')
  }

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatUser || !replyText.trim()) return

    await supabase.from('messages').insert([
      {
        sender: ADMIN_EMAIL,
        receiver: chatUser,
        content: replyText.trim()
      }
    ])

    setReplyText('')
    const { data: msgData } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
    setMessages(msgData || [])
  }

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
    csvContent += 'Date,Student,Tutor,Amount,Commission_Rate,Commission_Amount,Tutor_Amount,Status\n'

    payments.forEach((p) => {
      const commAmount = p.commission_amount ?? (p.amount - (p.tutor_amount ?? p.amount))
      const commRate = p.amount > 0 ? ((commAmount / p.amount) * 100).toFixed(0) : 0
      csvContent += `${new Date(p.created_at).toLocaleDateString('th-TH')},${p.student_email},${p.tutor_email},${p.amount},${commRate}%,${commAmount},${p.tutor_amount},${p.course_status}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `financial_report_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">กำลังโหลดข้อมูลแอดมิน...</div>
  }

  const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
  const totalCommission = payments.reduce((acc, p) => {
    const comm = p.commission_amount ?? (p.amount - (p.tutor_amount ?? p.amount))
    return acc + Number(comm || 0)
  }, 0)
  const pendingPayouts = payments.filter((p) => p.course_status === 'pending_confirm').length

  const userChatList = Array.from(
    new Set(messages.map((m) => (m.sender === ADMIN_EMAIL ? m.receiver : m.sender)))
  ).filter(Boolean)

  const activeChatMessages = messages.filter(
    (m) => (m.sender === chatUser && m.receiver === ADMIN_EMAIL) || (m.sender === ADMIN_EMAIL && m.receiver === chatUser)
  )

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              👑 แผงควบคุมแอดมิน
            </h1>
            <p className="text-xs text-slate-400">ระบบจัดการธุรกรรมและผู้ใช้</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
              📊 สรุป CSV
            </button>
            <Link href="/" className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
              ออก
            </Link>
          </div>
        </header>

        {/* การ์ดสรุปสถิติ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-lg">
            <span className="text-xs text-slate-400 font-medium block mb-1">💰 เงินหมุนเวียนทั้งหมด</span>
            <span className="text-2xl font-black text-white">{totalRevenue.toLocaleString()} <span className="text-xs text-slate-400">บาท</span></span>
          </div>
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-lg">
            <span className="text-xs text-slate-400 font-medium block mb-1">✨ ค่าคอมมิชชันรวม</span>
            <span className="text-2xl font-black text-emerald-400">{totalCommission.toLocaleString()} <span className="text-xs text-slate-400">บาท</span></span>
          </div>
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-lg">
            <span className="text-xs text-slate-400 font-medium block mb-1">🔔 รอโอนต่อติวเตอร์</span>
            <span className="text-2xl font-black text-amber-400">{pendingPayouts} <span className="text-xs text-slate-400">รายการ</span></span>
          </div>
        </div>

        {/* แถบเมนูเปลี่ยนแท็บ */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${activeTab === 'payments' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            💳 รายการโอน ({payments.length})
          </button>
          <button onClick={() => setActiveTab('messages')} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${activeTab === 'messages' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            💬 แชทช่วยเหลือ ({userChatList.length})
          </button>
          <button onClick={() => setActiveTab('tutors')} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${activeTab === 'tutors' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            🧑‍🏫 ติวเตอร์ ({tutors.length})
          </button>
          <button onClick={() => setActiveTab('students')} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${activeTab === 'students' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            🎓 นักเรียน ({students.length})
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            ⚙️ ตั้งค่า
          </button>
        </div>

        {/* ตารางแสดงรายการโอนเงิน */}
        {activeTab === 'payments' && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-4">วันที่</th>
                    <th className="p-4">นักเรียน</th>
                    <th className="p-4">สลิป</th>
                    <th className="p-4">ติวเตอร์</th>
                    <th className="p-4">ยอดรวม</th>
                    <th className="p-4">ติวเตอร์ได้รับ</th>
                    <th className="p-4 text-emerald-400">คอมมิชชัน (%)</th>
                    <th className="p-4">บัญชี</th>
                    <th className="p-4">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {payments.map((p) => {
                    const tutorInfo = tutors.find((t) => t.email === p.tutor_email)
                    const commAmount = p.commission_amount ?? (p.amount - (p.tutor_amount ?? p.amount))
                    // คำนวณเปอร์เซ็นต์คอมมิชชัน ณ วันที่จ่าย
                    const commPercent = p.amount > 0 ? ((commAmount / p.amount) * 100).toFixed(0) : 0

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-4 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('th-TH')}</td>
                        <td className="p-4 font-bold text-white">{p.student_email}</td>
                        <td className="p-4">
                          {p.slip_url ? (
                            <button onClick={() => setSelectedSlip(p.slip_url)} className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold transition">
                              สลิป
                            </button>
                          ) : (
                            <span className="text-slate-500">ไม่มี</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-200">{p.tutor_email}</td>
                        <td className="p-4 font-extrabold text-white">{p.amount}฿</td>
                        <td className="p-4 font-extrabold text-indigo-400">{p.tutor_amount ?? (p.amount - commAmount)}฿</td>
                        <td className="p-4 font-black text-emerald-400 bg-emerald-500/5 rounded-lg">{commPercent}% ({commAmount}฿)</td>
                        <td className="p-4 text-[11px] text-slate-400">{tutorInfo?.bank_account || 'กรุงไทย 9847557586'}</td>
                        <td className="p-4 whitespace-nowrap">
                          {p.course_status === 'completed' ? (
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">✓ โอนแล้ว</span>
                          ) : (
                            <button onClick={() => handleUpdateStatus(p.id, 'completed')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-md">
                              ยืนยันการโอน
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* แท็บแชทช่วยเหลือ */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/60 p-3 overflow-y-auto space-y-2">
              <h3 className="font-bold text-xs text-slate-400 px-2 pb-2 border-b border-slate-700">รายชื่อผู้ติดต่อ</h3>
              {userChatList.map((u) => (
                <button key={u} onClick={() => setChatUser(u)} className={`w-full text-left p-3 rounded-xl text-xs font-bold transition truncate block ${chatUser === u ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                  👤 {u}
                </button>
              ))}
            </div>
            <div className="md:col-span-2 bg-slate-800/50 rounded-2xl border border-slate-700/60 p-4 flex flex-col justify-between">
              {chatUser ? (
                <>
                  <div className="border-b border-slate-700 pb-2 mb-3">
                    <h3 className="font-bold text-sm text-white">แชทกับ: {chatUser}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-3">
                    {activeChatMessages.map((m) => (
                      <div key={m.id} className={`p-3 rounded-2xl text-xs max-w-md ${m.sender === ADMIN_EMAIL ? 'bg-indigo-600 text-white ml-auto' : 'bg-slate-700 text-slate-100'}`}>
                        <p>{m.content}</p>
                        <span className="text-[9px] opacity-60 block mt-1">{new Date(m.created_at).toLocaleTimeString('th-TH')}</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendAdminReply} className="flex gap-2">
                    <input type="text" placeholder="พิมพ์ข้อความตอบกลับ..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition">ส่ง</button>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">เลือกผู้ใช้งานจากด้านซ้ายเพื่อเริ่มสนทนา</div>
              )}
            </div>
          </div>
        )}

        {/* แท็บติวเตอร์ */}
        {activeTab === 'tutors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tutors.map((t) => (
              <div key={t.id} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-sm">{t.name} ({t.nickname || 'ไม่มีชื่อเล่น'})</h4>
                  <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold">{t.subject}</span>
                </div>
                <p className="text-slate-400">อีเมล: {t.email}</p>
                <p className="text-slate-400">ค่าเรียน: {t.price} บาท/ชม.</p>
                <p className="text-slate-400">บัญชีธนาคาร: {t.bank_account || 'ไม่ได้ระบุ'}</p>
              </div>
            ))}
          </div>
        )}

        {/* แท็บน้องเรียน */}
        {activeTab === 'students' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((s) => (
              <div key={s.id} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-1 text-xs">
                <h4 className="font-bold text-white text-sm">{s.name || s.email}</h4>
                <p className="text-slate-400">อีเมล: {s.email}</p>
                <p className="text-slate-400">เบอร์โทรศัพท์: {s.phone || 'ไม่ได้ระบุ'}</p>
              </div>
            ))}
          </div>
        )}

        {/* แท็บตั้งค่า */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/60 max-w-md space-y-4 text-xs">
            <h3 className="font-bold text-sm text-white border-b border-slate-700 pb-2">⚙️ ตั้งค่าระบบแพลตฟอร์ม</h3>
            <div>
              <label className="block text-slate-400 mb-1">เบอร์ PromptPay แพลตฟอร์ม</label>
              <input type="text" value={settings.promptpay_number} onChange={(e) => setSettings({ ...settings, promptpay_number: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">หักค่าคอมมิชชัน (%)</label>
              <input type="number" min="0" max="100" value={settings.commission_rate} onChange={(e) => setSettings({ ...settings, commission_rate: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg">บันทึกการเปลี่ยนแปลง</button>
          </form>
        )}
      </div>

      {/* ป๊อบอัพดูสลิปโอนเงิน */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-4 max-w-sm w-full space-y-3 border border-slate-700">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h3 className="font-bold text-xs text-white">🧾 หลักฐานการโอนเงิน</h3>
              <button onClick={() => setSelectedSlip(null)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
            </div>
            <img src={selectedSlip} alt="Slip" className="w-full rounded-2xl object-contain max-h-[70vh]" />
          </div>
        </div>
      )}
    </main>
  )
}