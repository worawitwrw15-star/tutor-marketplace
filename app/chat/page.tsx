'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Message {
  id: string
  sender: string
  content: string
  created_at: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ฟังก์ชันสั่งเลื่อนลงด้านล่างสุด
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    getUser()
    fetchMessages()

    const channel = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === payload.new.id)) return prev
          return [...prev, payload.new as Message]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // เลื่อนลงล่างสุดอัตโนมัติทุกครั้งที่รายการข้อความ (messages) มีการเปลี่ยนแปลง
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function getUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      setUserEmail(session.user.email)
    } else {
      setUserEmail('ผู้ใช้งานทั่วไป')
    }
  }

  async function fetchMessages() {
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
    if (error) console.error('Error fetching messages:', error)
    else setMessages(data || [])
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    setSending(true)
    const textToSend = input
    setInput('')

    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender: userEmail, content: textToSend }])
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

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white rounded-t-2xl">
          <div>
            <h1 className="font-bold text-lg">ห้องแชทพูดคุย / นัดหมาย</h1>
            <p className="text-xs text-indigo-100">ผู้ใช้ปัจจุบัน: {userEmail}</p>
          </div>
          <Link href="/" className="text-xs bg-indigo-500 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">
            กลับหน้าหลัก
          </Link>
        </div>

        {/* List ข้อความ */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50">
          {messages.map((msg) => {
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
          })}
          {/* Element อ้างอิงจุดล่างสุดสำหรับสั่ง scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={sendMessage} className="p-4 border-t bg-white rounded-b-2xl flex gap-2">
          <input
            type="text"
            placeholder="พิมพ์ข้อความที่นี่..."
            className="flex-1 p-3 border border-gray-300 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:bg-gray-400"
          >
            {sending ? 'กำลังส่ง...' : 'ส่ง'}
          </button>
        </form>
      </div>
    </main>
  )
}