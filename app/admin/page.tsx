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
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  // Dashboard Data State
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [activeTab, setActiveTab] = useState<'payments' | 'tutors' | 'students' | 'settings'>('payments')
  const [loading, setLoading] = useState(false)

  // State สำหรับ Modal ดูสลิปนักเรียน
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null)

  // State สำหรับ Modal โอนเงินต่อให้ติวเตอร์ (พร้อมแนบสลิป)
  const [transferModalPayment, setTransferModalPayment] = useState<Payment | null>(null)
  const [payoutSlipFile, setPayoutSlipFile] = useState<File | null>(null)
  const [payoutSlipPreview, setPayoutSlipPreview] = useState<string | null>(null)
  const [submittingPayout, setSubmittingPayout] = useState(false)

  // System Settings State
  const [promptPayNumber, setPromptPayNumber] = useState('0812345678')
  const [commissionRate, setCommissionRate] = useState(15)
  const [savingSettings, setSavingSettings] = useState(false)

  // ตรวจสอบ Login ล่วงหน้าจาก Session Storage
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

  // ฟังก์ชันคัดลอกเลขบัญชี
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert(`คัดลอกเลขบัญชี (${text}) เรียบร้อยแล้ว!`)
  }

  // ฟังก์ชันเลือกไฟล์สลิปที่จะส่งให้ติวเตอร์
  const handlePayoutFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPayoutSlipFile(file)
      setPayoutSlipPreview(URL.createObjectURL(file))
    }
  }

  // ยืนยันการโอนเงินต่อให้ติวเตอร์ พร้อมอัปโหลดสลิปและส่งแชท
  const handleConfirmPayoutToTutor = async () => {
    if (!transferModalPayment) return
    if (!payoutSlipFile) {
      alert('กรุณาแนบหลักฐานสลิปการโอนเงินให้ติวเตอร์ก่อนครับ')
      return
    }

    setSubmittingPayout(true)

    try {
      // 1. อัปโหลดสลิปเข้า Supabase Storage
      const fileExt = payoutSlipFile.name.split('.').pop()
      const fileName = `payout_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `slips/${fileName}`

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

      // 2. อัปเดตตาราง payments
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

      // 3. ส่งข้อความพร้อมแนบลิงก์รูปสลิปไปยังห้องแชทติวเตอร์
      const notifyMsg = `💸 [แจ้งโอนเงินค่าสอนเรียบร้อย]\nทางแพลตฟอร์มได้โอนเงินยอดสุทธิ ${Number(transferModalPayment.tutor_amount).toLocaleString()} บาท สำหรับรายการสอนของนักเรียน (${transferModalPayment.student_email}) เรียบร้อยแล้วครับ\n\n📄 ดูหลักฐานสลิป: ${payoutSlipUrl}`

      await supabase.from('messages').insert([
        {
          sender: 'system_admin@platform.com',
          receiver: transferModalPayment.tutor_email,
          content: notifyMsg
        }
      ])

      alert('โอนเงินต่อให้ติวเตอร์เรียบร้อยแล้ว! ระบบได้ส่งสลิปไปยังห้องแชทของติวเตอร์เรียบร้อย')
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

  // ฟังก์ชันบันทึกการตั้งค่าพร้อมเพย์และ % คอมมิชชัน
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

  // ส่งออกรายงาน CSV สรุปรายเดือน
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

  // ฟอร์มเข้าสู่ระบบแอดมิน
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <form onSubmit={handleAdminLogin} className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-5">
          <div className="text-center">
            <span className="text-4xl">👑</span>
            <h1 className="text-xl font-extrabold text-slate-800 mt-2">เข้าสู่ระบบแอดมิน</h1>
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
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
      <header className="bg-slate-900 text-white px-6 py-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-black text-lg flex items-center gap-2">
              <span>👑</span> แผงควบคุมเจ้าของแพลตฟอร์ม (Admin Dashboard)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">จัดการธุรกรรม ติวเตอร์ และนักเรียนในระบบ</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportMonthlyCSV} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition flex items-center gap-1 shadow-md">
              <span>📥</span> โหลดสรุปรายเดือน (CSV)
            </button>
            <button onClick={handleAdminLogout} className="text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl transition">
              ออกจากระบบแอดมิน
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80">
            <span className="text-xs text-slate-400 font-medium block mb-1">💰 ยอดเงินเข้าหมุนเวียนทั้งหมด</span>
            <span className="text-2xl font-black text-slate-800">{totalRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-normal">บาท</span></span>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80">
            <span className="text-xs text-slate-400 font-medium block mb-1">✨ รายได้ค่าคอมมิชชันนายหน้า ({commissionRate}%)</span>
            <span className="text-2xl font-black text-emerald-600">{totalCommission.toLocaleString()} <span className="text-xs text-slate-400 font-normal">บาท</span></span>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80">
            <span className="text-xs text-slate-400 font-medium block mb-1">🔔 ยอดรอโอนต่อให้ติวเตอร์</span>
            <span className="text-2xl font-black text-rose-500">{pendingPayouts.length} <span className="text-xs text-slate-400 font-normal">รายการ</span></span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 mb-6 border-b border-slate-200/80 pb-3">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <span>💳</span> รายการโอนเงิน ({pendingPayouts.length > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{pendingPayouts.length}</span>})
          </button>

          <button
            onClick={() => setActiveTab('tutors')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'tutors' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <span>👨‍🏫</span> รายชื่อติวเตอร์ ({tutors.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'students' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <span>🎓</span> รายชื่อนักเรียน ({students.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <span>⚙️</span> ตั้งค่าระบบการเงิน
          </button>
        </div>

        {/* Tab Payments */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-sm text-slate-800">รายการรับชำระเงินเงินจากนักเรียน</h2>
            </div>
            {payments.length === 0 ? (
              <p className="text-center text-xs text-slate-400 p-8">ยังไม่มีรายการโอนเงินในระบบ</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="p-4">วันที่/เวลา</th>
                      <th className="p-4">นักเรียน (ผู้โอน)</th>
                      <th className="p-4">หลักฐานสลิป</th>
                      <th className="p-4">ติวเตอร์ (ผู้รับ)</th>
                      <th className="p-4">ยอดรวม</th>
                      <th className="p-4">ค่าคอมฯ นายหน้า</th>
                      <th className="p-4">ยอดติวเตอร์จะได้รับ</th>
                      <th className="p-4">บัญชีรับเงินติวเตอร์</th>
                      <th className="p-4 text-center">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => {
                      const tutorInfo = tutors.find((t) => t.email === p.tutor_email)
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 text-slate-400">{new Date(p.created_at).toLocaleString('th-TH')}</td>
                          <td className="p-4 font-semibold text-slate-800">{p.student_email}</td>
                          <td className="p-4">
                            {p.slip_url ? (
                              <button
                                onClick={() => setSelectedSlipUrl(p.slip_url || null)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-3 py-1.5 rounded-xl border border-indigo-200 transition flex items-center gap-1 text-[11px]"
                              >
                                <span>🧾</span> ดูสลิป
                              </button>
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">ไม่มีสลิป</span>
                            )}
                          </td>
                          <td className="p-4 font-semibold text-slate-800">{p.tutor_email}</td>
                          <td className="p-4 font-bold text-slate-800">{Number(p.amount).toLocaleString()} ฿</td>
                          <td className="p-4 font-bold text-emerald-600">+{Number(p.commission_amount).toLocaleString()} ฿</td>
                          <td className="p-4 font-bold text-indigo-600">{Number(p.tutor_amount).toLocaleString()} ฿</td>
                          <td className="p-4 text-[11px] leading-snug">
                            {tutorInfo?.bank_account_no ? (
                              <div className="space-y-1">
                                <div>
                                  <span className="font-bold text-slate-800">{tutorInfo.bank_name}</span><br />
                                  <span className="text-indigo-600 font-mono font-bold text-xs">{tutorInfo.bank_account_no}</span><br />
                                  <span className="text-slate-400">({tutorInfo.bank_account_name})</span>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(tutorInfo.bank_account_no || '')}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200 transition flex items-center gap-1 mt-1"
                                >
                                  📋 คัดลอกเลขบัญชี
                                </button>
                              </div>
                            ) : (
                              <span className="text-rose-400 italic">ไม่ได้ระบุบัญชี</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {p.paid_to_tutor ? (
                              <div className="space-y-1">
                                <span className="inline-block bg-emerald-50 text-emerald-600 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                                  ✓ ดำเนินการเรียบร้อยแล้ว
                                </span>
                                {p.tutor_payout_slip_url && (
                                  <div>
                                    <button
                                      onClick={() => setSelectedSlipUrl(p.tutor_payout_slip_url || null)}
                                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                                    >
                                      📄 ดูสลิปที่โอนให้ติวเตอร์
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => setTransferModalPayment(p)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition"
                              >
                                โอนต่อให้ติวเตอร์
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

        {/* Tab Tutors */}
        {activeTab === 'tutors' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-sm text-slate-800">รายชื่อติวเตอร์ทั้งหมด</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-4">ชื่อติวเตอร์</th>
                    <th className="p-4">ชื่อเล่น</th>
                    <th className="p-4">อีเมล</th>
                    <th className="p-4">วิชาที่สอน</th>
                    <th className="p-4">ค่าสอน/ชม.</th>
                    <th className="p-4">ข้อมูลบัญชีรับเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tutors.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-bold text-slate-800">{t.name}</td>
                      <td className="p-4 text-slate-600">{t.nickname || '-'}</td>
                      <td className="p-4 text-slate-500">{t.email}</td>
                      <td className="p-4 font-semibold text-indigo-600">{t.subject}</td>
                      <td className="p-4 font-bold text-emerald-600">{t.price} ฿</td>
                      <td className="p-4 text-[11px]">
                        {t.bank_account_no ? (
                          <div className="flex items-center gap-2">
                            <span>{t.bank_name} | <strong className="font-mono">{t.bank_account_no}</strong> ({t.bank_account_name})</span>
                            <button
                              onClick={() => copyToClipboard(t.bank_account_no || '')}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold"
                            >
                              📋 คัดลอก
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">ยังไม่กรอก</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Students */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-sm text-slate-800">รายชื่อนักเรียนทั้งหมด</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-4">ชื่อนักเรียน</th>
                    <th className="p-4">ชื่อเล่น</th>
                    <th className="p-4">อีเมล</th>
                    <th className="p-4">ระดับชั้น</th>
                    <th className="p-4">วิชาที่สนใจเรียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-bold text-slate-800">{s.name}</td>
                      <td className="p-4 text-slate-600">{s.nickname || '-'}</td>
                      <td className="p-4 text-slate-500">{s.email}</td>
                      <td className="p-4 text-slate-600">{s.grade_level || '-'}</td>
                      <td className="p-4 font-semibold text-indigo-600">{s.target_subject || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 max-w-lg mx-auto">
            <h2 className="text-base font-bold text-slate-800 mb-1">⚙️ ตั้งค่าระบบการเงินแพลตฟอร์ม</h2>
            <p className="text-xs text-slate-400 mb-6">ระบุเบอร์พร้อมเพย์รับเงิน และ % คอมมิชชันที่หักจากติวเตอร์</p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">เบอร์พร้อมเพย์ / เลขผู้เสียภาษี แพลตฟอร์ม</label>
                <input
                  type="text" required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="เช่น 0812345678"
                  value={promptPayNumber} onChange={(e) => setPromptPayNumber(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1">* ระบบจะนำเบอร์นี้ไปเจน PromptPay QR Code ให้นักเรียนสแกนจ่ายอัตโนมัติ</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">อัตราค่าคอมมิชชันนายหน้า (%)</label>
                <input
                  type="number" required min="0" max="100"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={commissionRate} onChange={(e) => setCommissionRate(Number(e.target.value))}
                />
              </div>

              <button
                type="submit" disabled={savingSettings}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition disabled:bg-slate-300"
              >
                {savingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modal 1: ดูรูปสลิป */}
      {selectedSlipUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <span>🧾</span> หลักฐานการโอนเงิน (สลิป)
              </h3>
              <button
                onClick={() => setSelectedSlipUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 text-center max-h-[70vh] overflow-y-auto">
              <img
                src={selectedSlipUrl}
                alt="Slip full view"
                className="w-full h-auto rounded-xl shadow-sm border border-slate-200 mx-auto"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={selectedSlipUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                🔗 เปิดรูปในหน้าต่างใหม่
              </a>
              <button
                onClick={() => setSelectedSlipUrl(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: โอนเงินต่อให้ติวเตอร์ + อัปโหลดสลิปส่งเข้าแชท */}
      {transferModalPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <span>💸</span> โอนเงินต่อให้ติวเตอร์
              </h3>
              <button
                onClick={() => {
                  setTransferModalPayment(null)
                  setPayoutSlipFile(null)
                  setPayoutSlipPreview(null)
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* ข้อมูลการโอน */}
            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">ติวเตอร์ผู้รับ:</span>
                <strong className="text-slate-800">{transferModalPayment.tutor_email}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ยอดเงินสุทธิที่ต้องโอน:</span>
                <strong className="text-indigo-600 text-sm font-black">{Number(transferModalPayment.tutor_amount).toLocaleString()} บาท</strong>
              </div>
              {(() => {
                const tutorObj = tutors.find((t) => t.email === transferModalPayment.tutor_email)
                return tutorObj?.bank_account_no ? (
                  <div className="pt-2 border-t border-indigo-100/80 flex justify-between items-center">
                    <div>
                      <span className="text-slate-500 block text-[11px]">บัญชีโอนเงิน:</span>
                      <strong className="text-slate-800 font-mono">{tutorObj.bank_name} {tutorObj.bank_account_no}</strong>
                    </div>
                    <button
                      onClick={() => copyToClipboard(tutorObj.bank_account_no || '')}
                      className="bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm transition"
                    >
                      📋 คัดลอก
                    </button>
                  </div>
                ) : null
              })()}
            </div>

            {/* ช่องแนบสลิปการโอน */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                📸 แนบสลิปการโอนเงินให้ติวเตอร์: <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePayoutFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl p-1.5"
              />

              {payoutSlipPreview && (
                <div className="mt-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 mb-1.5 font-medium">ตัวอย่างสลิปที่จะส่งให้ติวเตอร์:</p>
                  <img src={payoutSlipPreview} alt="Payout Slip preview" className="max-h-44 mx-auto rounded-xl shadow-sm border border-slate-200" />
                </div>
              )}
            </div>

            <button
              onClick={handleConfirmPayoutToTutor}
              disabled={submittingPayout}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:bg-slate-300"
            >
              {submittingPayout ? 'กำลังบันทึกและส่งสลิป...' : 'ยืนยันโอนเงิน & ส่งสลิปให้ติวเตอร์'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}