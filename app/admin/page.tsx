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
        <form onSubmit={handleAdminLogin} className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-4">
          <div className="text-center">
            <span className="text-3xl">👑</span>
            <h1 className="text-lg font-extrabold text-slate-800 mt-2">เข้าสู่ระบบแอดมิน</h1>
            <p className="text-xs text-slate-400">เข้าสู่แผงควบคุมเจ้าของแพลตฟอร์ม</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Username</label>
            <input
              type="text" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-base md:text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
            <input
              type="password" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-base md:text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-lg transition"
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
    <main className="min-h-screen bg-slate-100/70 text-slate-800 relative pb-10">
      <header className="bg-slate-900 text-white px-4 md:px-6 py-4 shadow-lg sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
          <div>
            <h1 className="font-black text-sm md:text-lg flex items-center gap-1.5">
              <span>👑</span> แผงควบคุมแอดมิน
            </h1>
            <p className="text-[10px] text-slate-400">ระบบจัดการธุรกรรมและผู้ใช้</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={exportMonthlyCSV} className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              📥 <span className="hidden sm:inline">สรุป CSV</span>
            </button>
            <button onClick={handleAdminLogout} className="text-xs font-bold bg-rose-600 text-white px-2.5 py-1.5 rounded-lg">
              ออก
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5 mb-5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] text-slate-400 font-medium block">💰 เงินหมุนเวียนทั้งหมด</span>
            <span className="text-lg md:text-2xl font-black text-slate-800">{totalRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-400">บาท</span></span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] text-slate-400 font-medium block">✨ ค่าคอมมิชชัน ({commissionRate}%)</span>
            <span className="text-lg md:text-2xl font-black text-emerald-600">{totalCommission.toLocaleString()} <span className="text-xs font-normal text-slate-400">บาท</span></span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] text-slate-400 font-medium block">🔔 รอโอนต่อติวเตอร์</span>
            <span className="text-lg md:text-2xl font-black text-rose-500">{pendingPayouts.length} <span className="text-xs font-normal text-slate-400">รายการ</span></span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1 mb-4 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeTab === 'payments' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            💳 รายการโอน ({payments.length})
          </button>

          <button
            onClick={() => setActiveTab('tutors')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeTab === 'tutors' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            👨‍🏫 ติวเตอร์ ({tutors.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeTab === 'students' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            🎓 นักเรียน ({students.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            ⚙️ ตั้งค่า
          </button>
        </div>

        {/* Tab 1: Payments */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            {/* Mobile View: Data Cards */}
            <div className="block md:hidden space-y-3">
              {payments.map((p) => {
                const tutorInfo = tutors.find((t) => t.email === p.tutor_email)
                return (
                  <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-2">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-slate-400 text-[10px]">{new Date(p.created_at).toLocaleDateString('th-TH')}</span>
                      {p.paid_to_tutor ? (
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ โอนแล้ว
                        </span>
                      ) : (
                        <button
                          onClick={() => setTransferModalPayment(p)}
                          className="bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg"
                        >
                          โอนต่อติวเตอร์
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">นักเรียน:</span>
                        <span className="font-semibold text-slate-800 truncate block">{p.student_email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">ติวเตอร์:</span>
                        <span className="font-semibold text-slate-800 truncate block">{p.tutor_email}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">ยอดรวม / ติวเตอร์ได้</span>
                        <span className="font-bold text-slate-800">{p.amount}฿</span> → <span className="font-bold text-indigo-600">{p.tutor_amount}฿</span>
                      </div>
                      {p.slip_url && (
                        <button
                          onClick={() => setSelectedSlipUrl(p.slip_url || null)}
                          className="bg-indigo-50 text-indigo-600 font-bold px-2.5 py-1 rounded-lg border border-indigo-200 text-[10px]"
                        >
                          ดูสลิป
                        </button>
                      )}
                    </div>

                    {tutorInfo?.bank_account_no && (
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between items-center">
                        <span>โอนเข้า: <strong>{tutorInfo.bank_name}</strong> {tutorInfo.bank_account_no}</span>
                        <button
                          onClick={() => copyToClipboard(tutorInfo.bank_account_no || '')}
                          className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold"
                        >
                          คัดลอก
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-4">วันที่</th>
                    <th className="p-4">นักเรียน</th>
                    <th className="p-4">สลิป</th>
                    <th className="p-4">ติวเตอร์</th>
                    <th className="p-4">ยอดรวม</th>
                    <th className="p-4">ติวเตอร์ได้รับ</th>
                    <th className="p-4">บัญชี</th>
                    <th className="p-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => {
                    const tutorInfo = tutors.find((t) => t.email === p.tutor_email)
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-slate-400">{new Date(p.created_at).toLocaleDateString('th-TH')}</td>
                        <td className="p-4 font-semibold">{p.student_email}</td>
                        <td className="p-4">
                          {p.slip_url ? (
                            <button
                              onClick={() => setSelectedSlipUrl(p.slip_url || null)}
                              className="bg-indigo-50 text-indigo-600 font-bold px-2.5 py-1 rounded-lg border border-indigo-200 text-[10px]"
                            >
                              สลิป
                            </button>
                          ) : '-'}
                        </td>
                        <td className="p-4 font-semibold">{p.tutor_email}</td>
                        <td className="p-4 font-bold">{p.amount}฿</td>
                        <td className="p-4 font-bold text-indigo-600">{p.tutor_amount}฿</td>
                        <td className="p-4 text-[10px]">
                          {tutorInfo?.bank_account_no ? `${tutorInfo.bank_name} ${tutorInfo.bank_account_no}` : '-'}
                        </td>
                        <td className="p-4 text-center">
                          {p.paid_to_tutor ? (
                            <span className="text-emerald-600 font-bold text-[11px]">✓ โอนแล้ว</span>
                          ) : (
                            <button
                              onClick={() => setTransferModalPayment(p)}
                              className="bg-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-lg"
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
          </div>
        )}

        {/* Tab 2: Tutors */}
        {activeTab === 'tutors' && (
          <div className="space-y-3">
            <div className="block md:hidden space-y-2">
              {tutors.map((t) => (
                <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{t.name} ({t.nickname || '-'})</span>
                    <span className="text-emerald-600">{t.price}฿/ชม.</span>
                  </div>
                  <p className="text-indigo-600 font-semibold">{t.subject}</p>
                  <p className="text-slate-400 text-[10px]">{t.email}</p>
                  {t.bank_account_no && (
                    <p className="text-slate-500 text-[10px] pt-1 border-t border-slate-100">
                      บัญชี: {t.bank_name} {t.bank_account_no} ({t.bank_account_name})
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-4">ชื่อ</th>
                    <th className="p-4">อีเมล</th>
                    <th className="p-4">วิชา</th>
                    <th className="p-4">ค่าสอน</th>
                    <th className="p-4">บัญชีรับเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tutors.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold">{t.name}</td>
                      <td className="p-4 text-slate-500">{t.email}</td>
                      <td className="p-4 font-semibold text-indigo-600">{t.subject}</td>
                      <td className="p-4 font-bold text-emerald-600">{t.price} ฿</td>
                      <td className="p-4 text-[10px]">
                        {t.bank_account_no ? `${t.bank_name} | ${t.bank_account_no}` : 'ยังไม่กรอก'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Students */}
        {activeTab === 'students' && (
          <div className="space-y-3">
            <div className="block md:hidden space-y-2">
              {students.map((s) => (
                <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-1">
                  <div className="font-bold text-slate-800">{s.name} ({s.nickname || '-'})</div>
                  <p className="text-slate-500 text-[10px]">{s.email}</p>
                  <p className="text-indigo-600 text-[11px]">สนใจ: {s.target_subject || '-'}</p>
                </div>
              ))}
            </div>

            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-4">ชื่อ</th>
                    <th className="p-4">อีเมล</th>
                    <th className="p-4">วิชาสนใจ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold">{s.name}</td>
                      <td className="p-4 text-slate-500">{s.email}</td>
                      <td className="p-4 font-semibold text-indigo-600">{s.target_subject || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 max-w-lg mx-auto">
            <h2 className="text-sm font-bold text-slate-800 mb-1">⚙️ ตั้งค่าระบบการเงิน</h2>
            <p className="text-xs text-slate-400 mb-4">กำหนดเบอร์พร้อมเพย์รับเงิน และ % ค่าคอมมิชชัน</p>

            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">เบอร์พร้อมเพย์</label>
                <input
                  type="text" required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base md:text-xs font-semibold text-slate-800"
                  value={promptPayNumber} onChange={(e) => setPromptPayNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ค่าคอมมิชชัน (%)</label>
                <input
                  type="number" required min="0" max="100"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base md:text-xs font-semibold text-slate-800"
                  value={commissionRate} onChange={(e) => setCommissionRate(Number(e.target.value))}
                />
              </div>

              <button
                type="submit" disabled={savingSettings}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-md"
              >
                {savingSettings ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modal View Slip */}
      {selectedSlipUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl p-4 max-w-md w-full shadow-2xl space-y-3 relative">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-xs text-slate-800">🧾 สลิปการโอนเงิน</h3>
              <button onClick={() => setSelectedSlipUrl(null)} className="text-slate-400 font-bold text-sm">✕</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <img src={selectedSlipUrl} alt="Slip" className="w-full h-auto rounded-lg" />
            </div>
            <div className="text-right">
              <button onClick={() => setSelectedSlipUrl(null)} className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl">ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Payout */}
      {transferModalPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3 relative">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-xs text-slate-800">💸 โอนเงินต่อให้ติวเตอร์</h3>
              <button onClick={() => setTransferModalPayment(null)} className="text-slate-400 font-bold text-sm">✕</button>
            </div>

            <div className="bg-indigo-50 p-3 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">ติวเตอร์:</span><strong>{transferModalPayment.tutor_email}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">ยอดสุทธิ:</span><strong className="text-indigo-600 font-black">{transferModalPayment.tutor_amount} บาท</strong></div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">แนบสลิปการโอน:</label>
              <input type="file" accept="image/*" onChange={handlePayoutFileChange} className="w-full text-xs p-1 border rounded-xl" />
              {payoutSlipPreview && <img src={payoutSlipPreview} alt="Preview" className="max-h-28 mx-auto rounded-lg mt-2" />}
            </div>

            <button onClick={handleConfirmPayoutToTutor} disabled={submittingPayout} className="w-full bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md">
              {submittingPayout ? 'กำลังบันทึก...' : 'ยืนยันโอนเงิน & ส่งสลิป'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}