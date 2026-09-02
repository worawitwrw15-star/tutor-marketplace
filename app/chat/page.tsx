'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Message {
  id: string
  sender: string
  receiver: string
  content: string
  created_at: string
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [activePartner, setActivePartner] = useState<string>('')
  const [chatPartners, setChatPartners] = useState<string[]>([])
  const [unreadPartners, setUnreadPartners] = useState<Set<string>>(new Set())
  const [profiles, setProfiles] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null)
  
  // State สลับหน้ารายชื่อคู่สนทนาและกล่องแชทบนมือถือ
  const [showMobileList, setShowMobileList] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const tutorParam = searchParams.get('tutor')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    initChat()
  }, [])

  useEffect(() => {
    if (activePartner) {
      setUnreadPartners((prev) => {
        const next = new Set(prev)
        next.delete(activePartner)
        return next
      })
    }
  }, [activePartner])

  useEffect(() => {
    if (!userEmail) return

    const channel = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.sender === userEmail || newMsg.receiver === userEmail) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          const partner = newMsg.sender === userEmail ? newMsg.receiver : newMsg.sender
          if (partner) {
            setChatPartners((prev) => Array.from(new Set([...prev, partner])))
            fetchProfile(partner)

            if (newMsg.receiver === userEmail && partner !== activePartner) {
              setUnreadPartners((prev) => new Set(prev).add(partner))
            }
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userEmail, activePartner])

  useEffect(() => {
    scrollToBottom()
  }, [messages, activePartner])

  async function fetchProfile(email: string) {
    if (profiles[email]) return
    if (email === 'system_admin@platform.com') {
      setProfiles((prev) => ({ ...prev, [email]: '👑 แอดมินดูแลระบบ' }))
      return
    }
    const { data: tutor } = await supabase.from('tutors').select('nickname').eq('email', email).maybeSingle()
    if (tutor?.nickname) {
      setProfiles((prev) => ({ ...prev, [email]: tutor.nickname }))
      return
    }
    const { data: student } = await supabase.from('students').select('nickname').eq('email', email).maybeSingle()
    if (student?.nickname) {
      setProfiles((prev) => ({ ...prev, [email]: student.nickname }))
    }
  }

  async function initChat() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) return
    const myEmail = session.user.email
    setUserEmail(myEmail)
    fetchProfile(myEmail)

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender.eq.${myEmail},receiver.eq.${myEmail}`)
      .order('created_at', { ascending: true })

    const allMsgs: Message[] = data || []
    setMessages(allMsgs)

    const partners = new Set<string>()
    const unreads = new Set<string>()

    const lastMsgPerPartner: Record<string, Message> = {}
    allMsgs.forEach((m) => {
      const partner = m.sender === myEmail ? m.receiver : m.sender
      if (partner) {
        partners.add(partner)
        lastMsgPerPartner[partner] = m
      }
    })

    let initialActive = ''
    if (tutorParam && tutorParam !== myEmail) {
      partners.add(tutorParam)
      initialActive = tutorParam
    } else if (partners.size > 0) {
      initialActive = Array.from(partners)[0]
    }

    Object.entries(lastMsgPerPartner).forEach(([partner, lastMsg]) => {
      if (lastMsg.receiver === myEmail && partner !== initialActive) {
        unreads.add(partner)
      }
    })

    setActivePartner(initialActive)
    setUnreadPartners(unreads)

    const partnerArray = Array.from(partners)
    setChatPartners(partnerArray)
    partnerArray.forEach((p) => fetchProfile(p))

    // ถ้ามีพารามิเตอร์เลือกติวเตอร์มา ให้เปิดแชทบนมือถือทันที
    if (tutorParam) {
      setShowMobileList(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending || !activePartner) return

    setSending(true)
    const textToSend = input
    setInput('')

    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender: userEmail, receiver: activePartner, content: textToSend }])
      .select()

    if (error) {
      alert('ส่งข้อความไม่สำเร็จ: ' + error.message)
      setInput(textToSend)
    } else if (data && data.length > 0) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data[0].id)) return prev
        return [...prev, data[0] as Message]
      })
    }
    setSending(false)
  }

  const filteredMessages = messages.filter(
    (m) =>
      (m.sender === userEmail && m.receiver === activePartner) ||
      (m.sender === activePartner && m.receiver === userEmail)
  )

  const getDisplayName = (email: string) => {
    const nick = profiles[email]
    if (email === 'system_admin@platform.com') return '👑 แอดมินดูแลระบบ'
    return nick ? `${nick} (${email})` : email
  }

  const renderMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)

    return parts.map((part, index) => {
      const isImageUrl = part.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || part.includes('/storage/v1/object/public/slips/')

      if (isImageUrl) {
        const cleanedUrl = part.replace('/slips/slips/', '/slips/')
        return (
          <div key={index} className="my-1.5">
            <img
              src={cleanedUrl}
              alt="หลักฐาน/สลิป"
              className="max-w-[180px] sm:max-w-[220px] max-h-48 sm:max-h-56 rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition shadow-sm"
              onClick={() => setSelectedImageModal(cleanedUrl)}
            />
            <span className="text-[9px] text-slate-300 block mt-0.5">🔍 คลิกดูรูปใหญ่</span>
          </div>
        )
      } else if (part.match(/^https?:\/\//)) {
        return (
          <a key={index} href={part} target="_blank" rel="noreferrer" className="underline font-semibold break-all text-indigo-200 hover:text-white">
            {part}
          </a>
        )
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>
    })
  }

  return (
    <main className="min-h-screen bg-slate-100 p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full bg-white rounded-2xl md:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex h-[90vh] md:h-[85vh] overflow-hidden">
        
        {/* Sidebar Responsive */}
        <div className={`w-full md:w-1/3 border-r border-slate-100 bg-slate-50/50 flex flex-col ${!showMobileList ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3.5 md:p-4 border-b border-slate-100 bg-white">
            <h2 className="font-extrabold text-sm text-slate-800">รายการแชท</h2>
            <p className="text-[10px] md:text-[11px] text-slate-400 truncate mt-0.5">{getDisplayName(userEmail)}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chatPartners.length === 0 ? (
              <p className="text-center text-xs text-slate-400 p-4">ยังไม่มีรายการแชท</p>
            ) : (
              chatPartners.map((partner) => {
                const isActive = activePartner === partner
                const hasUnread = unreadPartners.has(partner)
                return (
                  <button
                    key={partner}
                    onClick={() => {
                      setActivePartner(partner)
                      setShowMobileList(false)
                    }}
                    className={`w-full p-3 text-left rounded-xl text-xs font-semibold transition truncate flex items-center justify-between relative ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate pr-2">💬 {getDisplayName(partner)}</span>

                    {hasUnread && !isActive && (
                      <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white"></span>
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
          <div className="p-3 border-t border-slate-100 bg-white">
            <Link href="/" className="block text-center text-xs font-semibold bg-slate-100 text-slate-600 py-2.5 rounded-xl hover:bg-slate-200 transition">
              ← กลับหน้าหลัก
            </Link>
          </div>
        </div>

        {/* Main Chat Area Responsive */}
        <div className={`flex-1 flex flex-col bg-white ${showMobileList ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3.5 md:p-4 border-b border-slate-100 bg-white flex items-center gap-2">
            <button
              onClick={() => setShowMobileList(true)}
              className="md:hidden bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1.5 rounded-lg transition"
            >
              ← แชท
            </button>
            <h1 className="font-bold text-xs md:text-sm text-slate-800 truncate">
              {activePartner ? `สนทนากับ: ${getDisplayName(activePartner)}` : 'กรุณาเลือกผู้สนทนา'}
            </h1>
          </div>

          <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3 bg-slate-50/30">
            {!activePartner ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                เลือกคู่สนทนาจากรายการเพื่อเริ่มพูดคุย
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                ยังไม่มีข้อความ เริ่มต้นพิมพ์ทักทายได้เลย!
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.sender === userEmail
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] md:text-[10px] text-slate-400 mb-0.5 px-1">
                      {getDisplayName(msg.sender)}
                    </span>
                    <div
                      className={`p-3 rounded-2xl text-xs shadow-sm max-w-[250px] sm:max-w-xs md:max-w-md leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {renderMessageContent(msg.content)}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-2.5 md:p-4 border-t border-slate-100 bg-white flex gap-2">
            <input
              type="text"
              disabled={!activePartner}
              placeholder={activePartner ? 'พิมพ์ข้อความ...' : 'เลือกคู่สนทนาก่อน'}
              className="flex-1 p-2.5 md:p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={sending || !activePartner}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-xs font-semibold shadow-md transition disabled:bg-slate-300"
            >
              {sending ? 'ส่ง...' : 'ส่ง'}
            </button>
          </form>
        </div>

      </div>

      {/* Modal ดูรูปสลิปขยายใหญ่ Responsive */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 max-w-md w-full shadow-2xl space-y-3 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-xs text-slate-800">📄 รูปภาพหลักฐาน/สลิป</h3>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
              <img src={selectedImageModal} alt="Expanded preview" className="w-full h-auto rounded-lg shadow-sm mx-auto" />
            </div>
            <div className="text-right">
              <button
                onClick={() => setSelectedImageModal(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-xs">กำลังโหลดห้องแชท...</div>}>
      <ChatContent />
    </Suspense>
  )
}