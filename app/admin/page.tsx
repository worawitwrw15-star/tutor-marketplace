'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Tutor {
  id: string
  name: string
  nickname?: string
  subject: string
  price: number
  email: string
  bank_name?: string
  bank_account_no?: string
  bank_account_name?: string
}

interface Student {
  id: string
  name: string
  nickname?: string
  email: string
  grade_level?: string
  target_subject?: string
}

interface Payment {
  id: string
  student_email: string
  tutor_email: string
  amount: number
  commission_amount: number
  tutor_amount: number
  status: string
  paid_to_tutor: boolean
  slip_url?: string
  tutor_payout_slip_url?: string
  created_at: string
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  const [tutors, setTutors] = useState<Tutor[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [activeTab, setActiveTab] = useState<'payments' | 'tutors' | 'students' | 'settings'>('payments')
  const [loading, setLoading] = useState(false)

  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null)

  const [transferModalPayment, setTransferModalPayment] = useState<Payment | null>(null)
  const [payoutSlipFile, setPayoutSlipFile] = useState<File | null>(null)
  const [payoutSlipPreview, setPayoutSlipPreview] = useState<string | null>(null)
  const [submittingPayout, setSubmittingPayout] = useState(false)

  const [promptPayNumber, setPromptPayNumber] = useState('0812345678')
  const [commissionRate, setCommissionRate] = useState(15)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    const sessionAdmin = sessionStorage.getItem('is_admin_logged_in')
    if (sessionAdmin === 'true') {
      setIsAuthenticated(true)
      fetchAdminData()
    }
  }, [])

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameInput === 'admin' && passwordInput === 'TT546897!') {
      setIsAuthenticated(true)
      sessionStorage.setItem('is_admin_logged_in', 'true')
      fetchAdminData()
    } else {
      alert('รหัสผ่าน หรือ Username แอดมินไม่ถูกต้อง!')
    }
  }

  const handleAdminLogout = () => {
    sessionStorage.removeItem('is_admin_logged_in')
    setIsAuthenticated(false)
  }

  async function fetchAdminData() {
    setLoading(true)
    const { data: payData } = await supabase.from('payments').select('*').order('created_at', { ascending: false })
    const { data: tutorData } = await supabase.from('tutors').select('*')
    const { data: studentData } = await supabase.from('students').select('*')
    const { data: settingsData } = await supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle()

    setPayments(payData || [])
    setTutors(tutorData || [])
    setStudents(studentData || [])
    if (settingsData) {
      setPromptPayNumber(settingsData.promptpay_number || '0812345678')
      setCommissionRate(settingsData.commission_rate || 15)
    }
    setLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert(`คัดลอกเลขบัญชี (${text}) เรียบร้อยแล้ว!`)
  }

  const handlePayoutFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPayoutSlipFile(file)
      setPayoutSlipPreview(URL.createObjectURL(file))
    }
  }

  const handleConfirmPayoutToTutor = async () => {
    if (!transferModalPayment) return
    if (!payoutSlipFile) {
      alert('กรุณาแนบหลักฐานสลิปการโอนเงินให้ติวเตอร์ก่อนครับ')
      return
    }

    setSubmittingPayout(true)

    try {
      const fileExt = payoutSlipFile.name.split('.').pop()
      const fileName = `payout_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('slips')
        .upload(filePath, payoutSlipFile)

      let payoutSlipUrl = ''
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('slips').getPublicUrl(filePath)
        payoutSlipUrl = publicUrlData.publicUrl
      } else {
        payoutSlipUrl = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(payoutSlipFile)
        })
      }

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          paid_to_tutor: true,
          paid_at: new Date().toISOString(),
          tutor_payout_slip_url: payoutSlipUrl
        })
        .eq('id', transferModalPayment.id)

      if (updateError) {
        alert('เกิดข้อผิดพลาดในการอัปเดต: ' + updateError.message)
        setSubmittingPayout(false)
        return
      }

      const notifyMsg = `💸 [แจ้งโอนเงินค่าสอน] ทางแพลตฟอร์มได้โอนเงินยอดสุทธิ ${Number(transferModalPayment.tutor_amount).toLocaleString()} บาท สำหรับรายการสอนของนักเรียน (${transferModalPayment.student_email}) เข้าบัญชีธนาคารของคุณเรียบร้อยแล้วครับ\n\nเปิดลิงก์ดูหลักฐาน: ${payoutSlipUrl}`

      await supabase.from('messages').insert([
        {
          sender: 'system_admin@platform.com',
          receiver: transferModalPayment.tutor_email,
          content: notifyMsg
        }
      ])

      alert('โอนเงินต่อให้ติวเตอร์เรียบร้อยแล้ว!')
      setTransferModalPayment(null)
      setPayoutSlipFile(null)
      setPayoutSlipPreview(null)
      fetchAdminData()
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setSubmittingPayout(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)

    const { error } = await supabase
      .from('platform_settings')
      .upsert({ id: 1, promptpay_number: promptPayNumber, commission_rate: Number(commissionRate) })

    if (error) {
      alert('บันทึกไม่สำเร็จ: ' + error.message)
    } else {
      alert('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!')
    }
    setSavingSettings(false)
  }

  const exportMonthlyCSV = () => {
    if (payments.length === 0) return alert('ไม่มีข้อมูลรายการโอนเงิน')

    let csvContent = "\uFEFFวันที่/เวลา,นักเรียน,ติวเตอร์,ยอดรวม (บาท),ค่าคอมมิชชัน (บาท),ยอดติวเตอร์ได้รับ (บาท),สถานะโอนให้ติวเตอร์,สลิปนักเรียน,สลิปโอนต่อติวเตอร์\n"
    payments.forEach((p) => {
      const date = new Date(p.created_at).toLocaleString('th-TH')
      const status = p.paid_to_tutor ? "โอนให้ติวเตอร์แล้ว" : "รอดำเนินการ"
      csvContent += `"${date}","${p.student_email}","${p.tutor_email}",${p.amount},${p.commission_amount},${p.tutor_amount},"${status}","${p.slip_url || '-'}","${p.tutor_payout_slip_url || '-'}"\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Monthly_Summary_${new Date().toISOString().slice(0, 7)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <form onSubmit={handleAdminLogin} className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-4 md:space-y-5">
          <div className="text-center">
            <span className="text-3xl md:text-4xl">👑</span>
            <h1 className="text-lg md:text-xl font-extrabold text-slate-800 mt-2">เข้าสู่ระบบแอดมิน</h1>
            <p className="text-xs text-slate-400">เข้าสู่แผงควบคุมเจ้าของแพลตฟอร์ม</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Username</label>
            <input
              type="text" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
            <input
              type="password" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            เข้าสู่ระบบ
          </button>

          <div className="text-center">
            <Link href="/" className="text-xs text-slate-400 hover:underline">← กลับหน้าหลัก</Link>
          </div>
        </form>
      </main>
    )
  }

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalCommission = payments.reduce((sum, p) => sum + Number(p.commission_amount || 0), 0)
  const pendingPayouts = payments.filter((p) => !p.paid_to_tutor)

  return (
    <main className="min-h-screen bg-slate-100/70 text-slate-800 relative">
      {/* Header Responsive */}
      <header className="bg-slate-900 text-white px-4 md:px-6 py-4 md:py-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="font-black text-base md:text-lg flex items-center gap-2">
              <span>👑</span> แผงควบคุมเจ้าของแพลตฟอร์ม
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">จัดการธุรกรรม ติวเตอร์ และนักเรียนในระบบ</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={exportMonthlyCSV} className="flex-1 md:flex-none text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 md:px-4 py-2 rounded-xl transition flex items-center justify-center gap-1 shadow-md">
              <span>📥</span> สรุป CSV
            </button>
            <button onClick={handleAdminLogout} className="flex-1 md:flex-none text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white px-3 md:px-3.5 py-2 rounded-xl transition">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Summary Cards Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-8">
          <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/80">
            <span className="text-xs text-slate-400 font-medium block mb-1">💰 ยอดเงินเข้าหมุนเวียนทั้งหมด</span>
            <span className="text-xl md:text-2xl font-black text-slate-800">{totalRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-normal">บาท</span></span>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/80">
            <span className="text-xs text-slate-400 font-medium block mb-1">✨ รายได้ค่าคอมมิชชันนายหน้า ({commissionRate}%)</span>
            <span className="text-xl md:text-2xl font-black text-emerald-600">{totalCommission.toLocaleString()} <span className="text-xs text-slate-400 font-normal">บาท</span></span>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/80">
            <span className="text-xs text-slate-400 font-medium block mb-1">🔔 ยอดรอโอนต่อให้ติวเตอร์</span>
            <span className="text-xl md:text-2xl font-black text-rose-500">{pendingPayouts.length} <span className="text-xs text-slate-400 font-normal">รายการ</span></span>
          </div>
        </div>

        {/* Tab Selection Responsive */}
        <div className="flex gap-1.5 md:gap-2 mb-6 border-b border-slate-200/80 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <span>💳</span> รายการโอน ({pendingPayouts.length > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">{pendingPayouts.length}</span>})
          </button>

          <button
            onClick={() => setActiveTab('tutors')}
            className={`px-3.5 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'tutors' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <span>👨‍🏫</span> ติวเตอร์ ({tutors.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'students' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <span>🎓</span> นักเรียน ({students.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <span>⚙️</span> ตั้งค่าระบบ
          </button>
        </div>

        {/* Tab Payments Responsive */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-xs md:text-sm text-slate-800">รายการรับชำระเงินเงินจากนักเรียน</h2>
            </div>
            {payments.length === 0 ? (
              <p className="text-center text-xs text-slate-400 p-8">ยังไม่มีรายการโอนเงินในระบบ</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] md:text-xs text-slate-700 min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="p-3 md:p-4">วันที่/เวลา</th>
                      <th className="p-3 md:p-4">นักเรียน</th>
                      <th className="p-3 md:p-4">สลิป</th>
                      <th className="p-3 md:p-4">ติวเตอร์</th>
                      <th className="p-3 md:p-4">ยอดรวม</th>
                      <th className="p-3 md:p-4">ยอดติวเตอร์</th>
                      <th className="p-3 md:p-4">บัญชีโอน</th>
                      <th className="p-3 md:p-4 text-center">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => {
                      const tutorInfo = tutors.find((t) => t.email === p.tutor_email)
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 md:p-4 text-slate-400">{new Date(p.created_at).toLocaleDateString('th-TH')}</td>
                          <td className="p-3 md:p-4 font-semibold text-slate-800 truncate max-w-[120px]">{p.student_email}</td>
                          <td className="p-3 md:p-4">
                            {p.slip_url ? (
                              <button
                                onClick={() => setSelectedSlipUrl(p.slip_url || null)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-2.5 py-1 rounded-lg border border-indigo-200 transition text-[10px]"
                              >
                                ดูสลิป
                              </button>
                            ) : (
                              <span className="text-slate-300 italic text-[10px]">ไม่มี</span>
                            )}
                          </td>
                          <td className="p-3 md:p-4 font-semibold text-slate-800 truncate max-w-[120px]">{p.tutor_email}</td>
                          <td className="p-3 md:p-4 font-bold text-slate-800">{Number(p.amount).toLocaleString()}฿</td>
                          <td className="p-3 md:p-4 font-bold text-indigo-600">{Number(p.tutor_amount).toLocaleString()}฿</td>
                          <td className="p-3 md:p-4 text-[10px] leading-tight">
                            {tutorInfo?.bank_account_no ? (
                              <div>
                                <span className="font-bold text-slate-800">{tutorInfo.bank_name}</span><br />
                                <span className="text-indigo-600 font-mono font-bold">{tutorInfo.bank_account_no}</span>
                              </div>
                            ) : (
                              <span className="text-rose-400 italic">ไม่ระบุ</span>
                            )}
                          </td>
                          <td className="p-3 md:p-4 text-center">
                            {p.paid_to_tutor ? (
                              <span className="inline-block bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ เรียบร้อย
                              </span>
                            ) : (
                              <button
                                onClick={() => setTransferModalPayment(p)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1 rounded-lg transition"
                              >
                                โอนต่อ
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Tutors Responsive */}
        {activeTab === 'tutors' && (
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-xs md:text-sm text-slate-800">รายชื่อติวเตอร์ทั้งหมด</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] md:text-xs text-slate-700 min-w-[500px]">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-3 md:p-4">ชื่อติวเตอร์</th>
                    <th className="p-3 md:p-4">วิชาที่สอน</th>
                    <th className="p-3 md:p-4">ค่าสอน/ชม.</th>
                    <th className="p-3 md:p-4">บัญชีรับเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tutors.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 md:p-4 font-bold text-slate-800">{t.name}</td>
                      <td className="p-3 md:p-4 font-semibold text-indigo-600">{t.subject}</td>
                      <td className="p-3 md:p-4 font-bold text-emerald-600">{t.price} ฿</td>
                      <td className="p-3 md:p-4 text-[10px]">
                        {t.bank_account_no ? `${t.bank_name} | ${t.bank_account_no}` : <span className="text-slate-400 italic">ยังไม่กรอก</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Students Responsive */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-xs md:text-sm text-slate-800">รายชื่อนักเรียนทั้งหมด</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] md:text-xs text-slate-700 min-w-[500px]">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-3 md:p-4">ชื่อนักเรียน</th>
                    <th className="p-3 md:p-4">อีเมล</th>
                    <th className="p-3 md:p-4">วิชาสนใจ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 md:p-4 font-bold text-slate-800">{s.name}</td>
                      <td className="p-3 md:p-4 text-slate-500">{s.email}</td>
                      <td className="p-3 md:p-4 font-semibold text-indigo-600">{s.target_subject || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Settings Responsive */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/80 max-w-lg mx-auto">
            <h2 className="text-sm md:text-base font-bold text-slate-800 mb-1">⚙️ ตั้งค่าระบบการเงินแพลตฟอร์ม</h2>
            <p className="text-xs text-slate-400 mb-4 md:mb-6">ระบุเบอร์พร้อมเพย์รับเงิน และ % คอมมิชชัน</p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">เบอร์พร้อมเพย์ แพลตฟอร์ม</label>
                <input
                  type="text" required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={promptPayNumber} onChange={(e) => setPromptPayNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">อัตราค่าคอมมิชชัน (%)</label>
                <input
                  type="number" required min="0" max="100"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={commissionRate} onChange={(e) => setCommissionRate(Number(e.target.value))}
                />
              </div>

              <button
                type="submit" disabled={savingSettings}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-lg transition disabled:bg-slate-300"
              >
                {savingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modal 1: ดูรูปสลิป Responsive */}
      {selectedSlipUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-xs md:text-sm text-slate-800 flex items-center gap-1.5">
                <span>🧾</span> หลักฐานการโอนเงิน (สลิป)
              </h3>
              <button
                onClick={() => setSelectedSlipUrl(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center max-h-[65vh] overflow-y-auto">
              <img
                src={selectedSlipUrl}
                alt="Slip full view"
                className="w-full h-auto rounded-lg shadow-sm border border-slate-200 mx-auto"
              />
            </div>

            <div className="flex justify-between items-center pt-1">
              <a
                href={selectedSlipUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 font-bold hover:underline"
              >
                🔗 เปิดในหน้าต่างใหม่
              </a>
              <button
                onClick={() => setSelectedSlipUrl(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: โอนเงินต่อให้ติวเตอร์ Responsive */}
      {transferModalPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-xs md:text-sm text-slate-800 flex items-center gap-1.5">
                <span>💸</span> โอนเงินต่อให้ติวเตอร์
              </h3>
              <button
                onClick={() => {
                  setTransferModalPayment(null)
                  setPayoutSlipFile(null)
                  setPayoutSlipPreview(null)
                }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">ติวเตอร์:</span>
                <strong className="text-slate-800 truncate max-w-[180px]">{transferModalPayment.tutor_email}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ยอดที่ต้องโอน:</span>
                <strong className="text-indigo-600 font-black">{Number(transferModalPayment.tutor_amount).toLocaleString()} บาท</strong>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                📸 แนบสลิปการโอนเงิน: <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePayoutFileChange}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl p-1"
              />

              {payoutSlipPreview && (
                <div className="mt-2 text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <img src={payoutSlipPreview} alt="Payout Slip preview" className="max-h-36 mx-auto rounded-lg shadow-sm border border-slate-200" />
                </div>
              )}
            </div>

            <button
              onClick={handleConfirmPayoutToTutor}
              disabled={submittingPayout}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs shadow-md transition disabled:bg-slate-300"
            >
              {submittingPayout ? 'กำลังบันทึก...' : 'ยืนยันโอนเงิน & ส่งสลิป'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}