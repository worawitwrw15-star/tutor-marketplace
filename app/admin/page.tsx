'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
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
  created_at: string
}

export default function AdminDashboard() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [activeTab, setActiveTab] = useState<'payments' | 'tutors' | 'students'>('payments')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchAdminData()
  }, [])

  async function fetchAdminData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    // ดึงข้อมูลการชำระเงิน ติวเตอร์ และนักเรียน
    const { data: payData } = await supabase.from('payments').select('*').order('created_at', { ascending: false })
    const { data: tutorData } = await supabase.from('tutors').select('*')
    const { data: studentData } = await supabase.from('students').select('*')

    setPayments(payData || [])
    setTutors(tutorData || [])
    setStudents(studentData || [])
    setLoading(false)
  }

  // ฟังก์ชันกดยืนยันว่าโอนเงินให้ติวเตอร์แล้ว
  const handleTransferToTutor = async (paymentId: string) => {
    if (!confirm('ยืนยันว่าคุณได้โอนเงินส่วนของติวเตอร์เข้าบัญชีเรียบร้อยแล้ว?')) return

    const { error } = await supabase
      .from('payments')
      .update({
        paid_to_tutor: true,
        paid_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      alert('บันทึกสถานะการโอนเงินเรียบร้อยแล้ว!')
      fetchAdminData()
    }
  }

  // คำนวณรายได้รวมของแพลตฟอร์ม
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalCommission = payments.reduce((sum, p) => sum + Number(p.commission_amount || 0), 0)
  const pendingPayouts = payments.filter((p) => !p.paid_to_tutor)

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">กำลังโหลดข้อมูลแอดมิน...</div>
  }

  return (
    <main className="min-h-screen bg-slate-100/70 text-slate-800">
      {/* Top Header */}
      <header className="bg-slate-900 text-white px-6 py-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-black text-lg flex items-center gap-2">
              <span>👑</span> แผงควบคุมเจ้าของแพลตฟอร์ม (Admin Dashboard)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">จัดการธุรกรรม ติวเตอร์ และนักเรียนในระบบ</p>
          </div>
          <Link href="/" className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition border border-slate-700">
            ← กลับหน้าหลัก
          </Link>
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
            <span className="text-xs text-slate-400 font-medium block mb-1">✨ รายได้ค่าคอมมิชชันนายหน้า</span>
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
              activeTab === 'payments'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
            }`}
          >
            <span>💳</span> รายการโอนเงิน ({pendingPayouts.length > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{pendingPayouts.length}</span>})
          </button>

          <button
            onClick={() => setActiveTab('tutors')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'tutors'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
            }`}
          >
            <span>👨‍🏫</span> รายชื่อติวเตอร์ ({tutors.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
            }`}
          >
            <span>🎓</span> รายชื่อนักเรียน ({students.length})
          </button>
        </div>

        {/* Tab 1: รายการโอนเงินและการโอนต่อให้ติวเตอร์ */}
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
                          <td className="p-4 font-semibold text-slate-800">{p.tutor_email}</td>
                          <td className="p-4 font-bold text-slate-800">{Number(p.amount).toLocaleString()} ฿</td>
                          <td className="p-4 font-bold text-emerald-600">+{Number(p.commission_amount).toLocaleString()} ฿</td>
                          <td className="p-4 font-bold text-indigo-600">{Number(p.tutor_amount).toLocaleString()} ฿</td>
                          <td className="p-4 text-[11px] leading-snug">
                            {tutorInfo?.bank_account_no ? (
                              <div>
                                <span className="font-bold text-slate-800">{tutorInfo.bank_name}</span><br />
                                <span className="text-indigo-600 font-mono font-bold">{tutorInfo.bank_account_no}</span><br />
                                <span className="text-slate-400">({tutorInfo.bank_account_name})</span>
                              </div>
                            ) : (
                              <span className="text-rose-400 italic">ไม่ได้ระบุบัญชี</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {p.paid_to_tutor ? (
                              <span className="inline-block bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                                ✓ โอนให้ติวเตอร์แล้ว
                              </span>
                            ) : (
                              <button
                                onClick={() => handleTransferToTutor(p.id)}
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

        {/* Tab 2: ข้อมูลติวเตอร์ */}
        {activeTab === 'tutors' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-sm text-slate-800">รายชื่อติวเตอร์ทั้งหมดในแพลตฟอร์ม</h2>
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
                          `${t.bank_name} | ${t.bank_account_no} (${t.bank_account_name})`
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

        {/* Tab 3: ข้อมูลนักเรียน */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-sm text-slate-800">รายชื่อนักเรียนทั้งหมดในแพลตฟอร์ม</h2>
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
      </div>
    </main>
  )
}