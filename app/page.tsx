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
  bio: string
  email?: string
  avatar_url?: string
  is_verified?: boolean
}

interface Review {
  id: string
  tutor_email: string
  student_email: string
  rating: number
  comment: string
  created_at: string
}

export default function Home() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [search, setSearch] = useState('')
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'mid' | 'high'>('all')
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating'>('default')
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [isTutor, setIsTutor] = useState(false)
  const [isStudent, setIsStudent] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)

  const [selectedTutorForReview, setSelectedTutorForReview] = useState<Tutor | null>(null)
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const router = useRouter()
  const ADMIN_EMAIL = 'system_admin@platform.com'

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  useEffect(() => {
    if (!userEmail) return

    const channel = supabase
      .channel('unread_messages_home')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new
        if (newMsg.receiver === userEmail) {
          setHasUnread(true)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userEmail])

  async function checkUserAndFetchData() {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const email = session.user.email || ''
    setUserEmail(email)

    const { data: tutorData, error } = await supabase.from('tutors').select('*')
    if (error) console.error('Error fetching tutors:', error)
    else {
      setTutors(tutorData || [])
      setIsTutor((tutorData || []).some((t) => t.email === email))
    }

    const { data: reviewData } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
    setReviews(reviewData || [])

    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    setIsStudent(!!studentData)

    const { data: recentMsg } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver', email)
      .limit(1)

    if (recentMsg && recentMsg.length > 0) {
      setHasUnread(true)
    }

    setLoading(false)
  }

  const getTutorRatingInfo = (tutorEmail?: string) => {
    if (!tutorEmail) return { avg: '0.0', count: 0, numericAvg: 0 }
    const tutorReviews = reviews.filter((r) => r.tutor_email === tutorEmail)
    if (tutorReviews.length === 0) return { avg: '0.0', count: 0, numericAvg: 0 }
    const sum = tutorReviews.reduce((acc, r) => acc + r.rating, 0)
    const avgNum = sum / tutorReviews.length
    return {
      avg: avgNum.toFixed(1),
      count: tutorReviews.length,
      numericAvg: avgNum
    }
  }

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTutorForReview || !selectedTutorForReview.email) return
    if (!newComment.trim()) {
      alert('กรุณากรอกความคิดเห็นก่อนส่งรีวิวครับ')
      return
    }

    setSubmittingReview(true)

    const { error } = await supabase.from('reviews').insert([
      {
        tutor_email: selectedTutorForReview.email,
        student_email: userEmail,
        rating: newRating,
        comment: newComment.trim()
      }
    ])

    if (error) {
      alert('เกิดข้อผิดพลาดในการส่งรีวิว: ' + error.message)
    } else {
      alert('ขอบคุณสำหรับรีวิวครับ!')
      setNewComment('')
      setNewRating(5)
      const { data: updatedReviews } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
      setReviews(updatedReviews || [])
    }

    setSubmittingReview(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-xs md:text-sm">
        กำลังตรวจสอบสิทธิ์การใช้งาน...
      </div>
    )
  }

  const filteredTutors = tutors
    .filter((t) => {
      const matchSearch =
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.nickname && t.nickname.toLowerCase().includes(search.toLowerCase()))

      if (!matchSearch) return false

      const displayPrice = t.price < 50 ? 50 : t.price

      if (priceFilter === 'low') return displayPrice >= 50 && displayPrice <= 150
      if (priceFilter === 'mid') return displayPrice > 150 && displayPrice <= 300
      if (priceFilter === 'high') return displayPrice > 300
      return true
    })
    .sort((a, b) => {
      const priceA = a.price < 50 ? 50 : a.price
      const priceB = b.price < 50 ? 50 : b.price

      if (sortBy === 'price-asc') return priceA - priceB
      if (sortBy === 'price-desc') return priceB - priceA
      if (sortBy === 'rating') {
        const ratingA = getTutorRatingInfo(a.email).numericAvg
        const ratingB = getTutorRatingInfo(b.email).numericAvg
        return ratingB - ratingA
      }
      return 0
    })

  return (
    <main className="min-h-screen bg-slate-50/60 text-slate-800 relative">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 md:px-6 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg shadow-indigo-600/20">
                T
              </div>
              <div>
                <h1 className="font-extrabold text-sm md:text-base text-slate-800 leading-tight">Tutor Marketplace</h1>
                <p className="text-[10px] md:text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 truncate max-w-[180px] sm:max-w-xs">
                  <span className="truncate">{userEmail}</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-slate-300 flex-shrink-0"></span>
                  {isTutor ? (
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/60 flex-shrink-0">
                      👨‍🏫 ติวเตอร์
                    </span>
                  ) : isStudent ? (
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/60 flex-shrink-0">
                      🎓 นักเรียน
                    </span>
                  ) : (
                    <span className="text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                      👤 ผู้ใช้ทั่วไป
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="sm:hidden px-2.5 py-1.5 text-[11px] font-bold text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-lg transition"
            >
              ออก
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end overflow-x-auto pb-1 sm:pb-0">
            <Link 
              href={`/chat?tutor=${encodeURIComponent(ADMIN_EMAIL)}`}
              className="px-3 py-1.5 md:py-2 text-[11px] md:text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md shadow-amber-500/20 transition flex items-center gap-1 flex-shrink-0"
            >
              <span>🎧</span> ติดต่อแอดมิน
            </Link>

            {isTutor && (
              <>
                <Link 
                  href="/schedule" 
                  className="px-3 py-1.5 md:py-2 text-[11px] md:text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md transition flex-shrink-0"
                >
                  📅 ตารางสอน
                </Link>
                <Link href="/register" className="px-3 py-1.5 md:py-2 text-[11px] md:text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition flex-shrink-0">
                  โปรไฟล์ติวเตอร์
                </Link>
              </>
            )}

            <Link 
              href="/profile" 
              className="px-3 py-1.5 md:py-2 text-[11px] md:text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-md transition flex items-center gap-1 flex-shrink-0"
            >
              <span>⚙️</span> ตั้งค่าโปรไฟล์
            </Link>

            <Link 
              href="/chat" 
              onClick={() => setHasUnread(false)}
              className="relative px-3 py-1.5 md:py-2 text-[11px] md:text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md transition flex items-center gap-1 flex-shrink-0"
            >
              <span>💬</span> ห้องแชท
              {hasUnread && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
                </span>
              )}
            </Link>

            <button 
              onClick={handleLogout} 
              className="hidden sm:block px-3 py-1.5 md:py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-xl transition"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-4 md:pb-6">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl md:rounded-3xl p-6 md:p-12 text-white shadow-xl shadow-indigo-600/10 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="bg-white/20 text-white text-[10px] md:text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md inline-block mb-2 md:mb-3">
              ✨ แพลตฟอร์มค้นหาติวเตอร์ส่วนตัว (เริ่มต้นเพียง 50 บาท/ชม.)
            </span>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2 md:mb-3">
              ค้นหาติวเตอร์ส่วนตัวที่เหมาะกับคุณ
            </h2>
            <p className="text-xs md:text-sm text-indigo-100 mb-6 md:mb-8 max-w-md mx-auto leading-relaxed">
              เชื่อมต่อติวเตอร์คุณภาพ พร้อมระบบสแกนจ่าย QR Code ชำระเงินความปลอดภัยสูง
            </p>

            <div className="relative max-w-lg mx-auto mb-4">
              <input
                type="text"
                placeholder="ค้นหาตามวิชา, ชื่อติวเตอร์..."
                className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white/95 backdrop-blur-md rounded-xl md:rounded-2xl shadow-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-white/30 transition placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base md:text-lg">🔍</span>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-1.5 md:gap-2">
              <span className="text-[11px] font-medium text-indigo-100 mr-1">เรตราคา/ชม.:</span>
              <button onClick={() => setPriceFilter('all')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition ${priceFilter === 'all' ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/15 text-white hover:bg-white/25'}`}>ทั้งหมด</button>
              <button onClick={() => setPriceFilter('low')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition ${priceFilter === 'low' ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/15 text-white hover:bg-white/25'}`}>50 - 150 ฿</button>
              <button onClick={() => setPriceFilter('mid')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition ${priceFilter === 'mid' ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/15 text-white hover:bg-white/25'}`}>151 - 300 ฿</button>
              <button onClick={() => setPriceFilter('high')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition ${priceFilter === 'high' ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/15 text-white hover:bg-white/25'}`}>มากกว่า 300 ฿</button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16 pt-2 md:pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
          <h3 className="font-extrabold text-base md:text-lg text-slate-800">
            ติวเตอร์พร้อมสอน ({filteredTutors.length})
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-400 font-medium">จัดเรียงตาม:</span>
            <select
              className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
            >
              <option value="default">ค่าเริ่มต้น</option>
              <option value="rating">⭐ คะแนนรีวิวสูงสุด</option>
              <option value="price-asc">💵 ค่าเรียน: น้อยไปมาก</option>
              <option value="price-desc">💵 ค่าเรียน: มากไปน้อย</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredTutors.map((tutor) => {
            const { avg, count, numericAvg } = getTutorRatingInfo(tutor.email)
            const displayPrice = tutor.price < 50 ? 50 : tutor.price
            const isPopular = count >= 3 || numericAvg >= 4.5
            const isOwnProfile = tutor.email === userEmail

            return (
              <div key={tutor.id} className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-100 shadow-lg shadow-slate-200/40 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-lg shadow-sm flex-shrink-0">
                        {tutor.avatar_url ? (
                          <img src={tutor.avatar_url} alt={tutor.name} className="w-full h-full object-cover" />
                        ) : (
                          tutor.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <h4 className="font-bold text-sm md:text-base text-slate-800 leading-tight truncate">{tutor.name}</h4>
                          <span className="text-emerald-500 text-xs font-extrabold" title="ยืนยันตัวตนแล้ว">✔</span>
                        </div>
                        {tutor.nickname && (
                          <span className="text-[11px] md:text-xs font-medium text-slate-400 block mt-0.5 truncate">({tutor.nickname})</span>
                        )}
                      </div>
                    </div>
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] md:text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-indigo-100/50 flex-shrink-0">
                      {tutor.subject}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                      🛡️ ยืนยันตัวตนแล้ว
                    </span>
                    {isPopular && (
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                        🔥 ติวเตอร์ยอดนิยม
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-amber-50/60 border border-amber-100/80 px-3 py-1.5 md:py-2 rounded-xl md:rounded-2xl mb-3 md:mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 font-bold text-xs">⭐ {count > 0 ? avg : 'ใหม่'}</span>
                      <span className="text-[10px] md:text-[11px] text-slate-400 font-medium">({count} รีวิว)</span>
                    </div>
                    <button
                      onClick={() => setSelectedTutorForReview(tutor)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      💬 ดูรีวิว
                    </button>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed mb-4 md:mb-6 line-clamp-3 bg-slate-50 p-3 rounded-xl md:rounded-2xl border border-slate-100/80">
                    {tutor.bio}
                  </p>
                </div>

                <div className="pt-3 md:pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] md:text-[10px] text-slate-400 font-medium block">ค่าเรียน</span>
                    <span className="text-base md:text-lg font-black text-emerald-600">{displayPrice} <span className="text-[10px] md:text-xs font-medium text-slate-400">฿/ชม.</span></span>
                  </div>
                  <div className="flex gap-1.5">
                    <Link 
                      href={tutor.email ? `/chat?tutor=${encodeURIComponent(tutor.email)}` : '/chat'} 
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2.5 md:px-3 py-2 rounded-xl transition"
                    >
                      แชท
                    </Link>
                    
                    {/* สลับการแสดงผลระหว่างปุ่ม "ตารางสอน" (ถ้าเป็นโปรไฟล์ตัวเอง) และ "จองเรียน" (สำหรับนักเรียน) */}
                    {isOwnProfile ? (
                      <Link 
                        href="/schedule" 
                        className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3 md:px-3.5 py-2 rounded-xl transition shadow-md shadow-violet-600/20"
                      >
                        ตารางสอน
                      </Link>
                    ) : (
                      <Link 
                        href={tutor.email ? `/checkout?tutor=${encodeURIComponent(tutor.email)}` : '/checkout'} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 md:px-3.5 py-2 rounded-xl transition shadow-md shadow-indigo-600/20"
                      >
                        จองเรียน
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {selectedTutorForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 max-w-lg w-full shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-extrabold text-sm md:text-base text-slate-800">
                  ⭐ รีวิวของ {selectedTutorForReview.name}
                </h3>
                <p className="text-[11px] text-slate-400">วิชา {selectedTutorForReview.subject}</p>
              </div>
              <button
                onClick={() => setSelectedTutorForReview(null)}
                className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs md:text-sm transition"
              >
                ✕
              </button>
            </div>

            {isStudent && (
              <form onSubmit={handleAddReview} className="bg-slate-50 p-3.5 md:p-4 rounded-xl md:rounded-2xl border border-slate-200/80 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700">✍️ เขียนรีวิว / ให้ดาวติวเตอร์คนนี้</h4>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">คะแนน:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className={`text-base md:text-lg transition-transform ${star <= newRating ? 'scale-110' : 'opacity-30'}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-600 ml-1">{newRating} ดาว</span>
                </div>

                <textarea
                  required
                  rows={2}
                  placeholder="พิมพ์ความคิดเห็นของคุณ..."
                  className="w-full p-2.5 md:p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition disabled:bg-slate-300"
                >
                  {submittingReview ? 'กำลังส่งรีวิว...' : 'ส่งรีวิว'}
                </button>
              </form>
            )}

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700">💬 ความคิดเห็นทั้งหมด</h4>
              {(() => {
                const tutorReviews = reviews.filter((r) => r.tutor_email === selectedTutorForReview.email)
                if (tutorReviews.length === 0) {
                  return <p className="text-center text-xs text-slate-400 py-4">ยังไม่มีรีวิวสำหรับติวเตอร์คนนี้</p>
                }
                return tutorReviews.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 truncate max-w-[180px]">{r.student_email}</span>
                      <span className="text-amber-500 font-bold text-[11px]">{'⭐'.repeat(r.rating)}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{r.comment}</p>
                    <span className="text-[9px] text-slate-400 block pt-0.5">
                      {new Date(r.created_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}