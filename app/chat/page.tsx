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

interface UserProfile {
  email: string
  nickname: string
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [activePartner, setActivePartner] = useState<string>('')
  const [chatPartners, setChatPartners] = useState<string[]>([])
  const [profiles, setProfiles] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
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
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userEmail])

  useEffect(() => {
    scrollToBottom()
  }, [messages, activePartner])

  async function fetchProfile(email: string) {
    if (profiles[email]) return
    // ค้นหาชื่อเล่นจากตารางติวเตอร์และนักเรียน
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
    allMsgs.forEach((m) => {
      if (m.sender === myEmail && m.receiver) partners.add(m.receiver)
      if (m.receiver === myEmail && m.sender) partners.add(m.sender)
    })

    if (tutorParam && tutorParam !== myEmail) {
      partners.add(tutorParam)
      setActivePartner(tutorParam)
    } else if (partners.size > 0) {
      setActivePartner(Array.from(partners)[0])
    }

    const partnerArray = Array.from(partners)
    setChatPartners(partnerArray)
    partnerArray.forEach((p) => fetchProfile(p))
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
    return nick ? `${nick} (${email})` : email
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6 flex flex-col items-center">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex h-[85vh] overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r border-slate-100 bg-slate-50/50 flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-white">
            <h2 className="font-extrabold text-sm text-slate-800">รายการแชท</h2>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{getDisplayName(userEmail)}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chatPartners.length === 0 ? (
              <p className="text-center text-xs text-slate-400 p-4">ยังไม่มีรายการแชท</p>
            ) : (
              chatPartners.map((partner) => (
                <button
                  key={partner}
                  onClick={() => setActivePartner(partner)}
                  className={`w-full p-3 text-left rounded-xl text-xs font-semibold transition truncate block ${
                    activePartner === partner
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  💬 {getDisplayName(partner)}
                </button>
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-100 bg-white">
            <Link href="/" className="block text-center text-xs font-semibold bg-slate-100 text-slate-600 py-2.5 rounded-xl hover:bg-slate-200 transition">
              ← กลับหน้าหลัก
            </Link>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
            <h1 className="font-bold text-sm text-slate-800">
              {activePartner ? `สนทนากับ: ${getDisplayName(activePartner)}` : 'กรุณาเลือกผู้สนทนา'}
            </h1>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
            {!activePartner ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                เลือกคู่สนทนาจากแถบด้านซ้ายเพื่อเริ่มพูดคุย
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
                    <span className="text-[10px] text-slate-400 mb-1 px-1">
                      {getDisplayName(msg.sender)}
                    </span>
                    <div
                      className={`p-3.5 rounded-2xl text-xs shadow-sm max-w-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 bg-white flex gap-2">
            <input
              type="text"
              disabled={!activePartner}
              placeholder={activePartner ? 'พิมพ์ข้อความ...' : 'เลือกคู่สนทนาก่อนพิมพ์'}
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={sending || !activePartner}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition disabled:bg-slate-300"
            >
              {sending ? 'ส่ง...' : 'ส่ง'}
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">กำลังโหลดห้องแชท...</div>}>
      <ChatContent />
    </Suspense>
  )
}