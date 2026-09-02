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
          // เพิ่มผู้ส่งเข้ารายชื่อคู่สนทนาหากยังไม่มี
          const partner = newMsg.sender === userEmail ? newMsg.receiver : newMsg.sender
          if (partner) {
            setChatPartners((prev) => Array.from(new Set([...prev, partner])))
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

  async function initChat() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) return
    const myEmail = session.user.email
    setUserEmail(myEmail)

    // ดึงข้อความทั้งหมดที่เกี่ยวข้องกับเรา
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender.eq.${myEmail},receiver.eq.${myEmail}`)
      .order('created_at', { ascending: true })

    const allMsgs: Message[] = data || []
    setMessages(allMsgs)

    // รวบรวมรายชื่อคู่สนทนา
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

    setChatPartners(Array.from(partners))
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

  // กรองข้อความเฉพาะระหว่างเรากับ activePartner
  const filteredMessages = messages.filter(
    (m) =>
      (m.sender === userEmail && m.receiver === activePartner) ||
      (m.sender === activePartner && m.receiver === userEmail)
  )

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex h-[85vh] overflow-hidden">
        
        {/* Sidebar รายชื่อคู่สนทนา */}
        <div className="w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-indigo-600 text-white">
            <h2 className="font-bold text-base">รายการแชท</h2>
            <p className="text-[10px] text-indigo-100 truncate">{userEmail}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatPartners.length === 0 ? (
              <p className="text-center text-xs text-gray-400 p-4">ยังไม่มีรายการแชท</p>
            ) : (
              chatPartners.map((partner) => (
                <button
                  key={partner}
                  onClick={() => setActivePartner(partner)}
                  className={`w-full p-3.5 text-left text-xs font-medium border-b border-gray-100 transition truncate block ${
                    activePartner === partner
                      ? 'bg-indigo-50 text-indigo-600 font-bold border-l-4 border-l-indigo-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  💬 {partner}
                </button>
              ))
            )}
          </div>
          <div className="p-3 border-t bg-white">
            <Link href="/" className="block text-center text-xs bg-gray-100 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition">
              ← กลับหน้าหลัก
            </Link>
          </div>
        </div>

        {/* ห้องแชทหลัก */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b bg-indigo-600 text-white flex justify-between items-center">
            <div>
              <h1 className="font-bold text-sm">
                {activePartner ? `สนทนากับ: ${activePartner}` : 'กรุณาเลือกผู้สนทนา'}
              </h1>
            </div>
          </div>

          {/* List ข้อความ */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/30">
            {!activePartner ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                เลือกคู่สนทนาจากแถบด้านซ้ายเพื่อเริ่มพูดคุย
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                ยังไม่มีข้อความ เริ่มต้นพิมพ์ทักทายได้เลย!
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.sender === userEmail
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-gray-400 mb-0.5 px-1">{msg.sender}</span>
                    <div
                      className={`p-3 rounded-2xl text-sm max-w-xs shadow-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
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

          {/* Input Form */}
          <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2">
            <input
              type="text"
              disabled={!activePartner}
              placeholder={activePartner ? 'พิมพ์ข้อความ...' : 'เลือกคู่สนทนาก่อนพิมพ์'}
              className="flex-1 p-3 border border-gray-300 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={sending || !activePartner}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:bg-gray-300"
            >
              {sending ? 'กำลังส่ง...' : 'ส่ง'}
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">กำลังโหลดห้องแชท...</div>}>
      <ChatContent />
    </Suspense>
  )
}