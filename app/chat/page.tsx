'use client'
import { useEffect, useState } from 'react'
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
  const [senderName, setSenderName] = useState('นักเรียน')

  useEffect(() => {
    fetchMessages()
    const channel = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchMessages() {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    await supabase.from('messages').insert([{ sender: senderName, content: input }])
    setInput('')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white rounded-t-2xl">
          <h1 className="font-bold text-lg">ห้องแชทพูดคุย / นัดหมายเวลาเรียน</h1>
          <Link href="/" className="text-xs bg-indigo-500 px-3 py-1 rounded hover:bg-indigo-700">กลับหน้าหลัก</Link>
        </div>

        <div className="p-3 bg-gray-100 border-b flex items-center gap-2 text-sm text-gray-700">
          <span>ส่งในนาม:</span>
          <select value={senderName} onChange={(e) => setSenderName(e.target.value)} className="p-1 border rounded bg-white">
            <option value="นักเรียน">นักเรียน</option>
            <option value="ติวเตอร์">ติวเตอร์</option>
          </select>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === senderName ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-gray-400 mb-1">{msg.sender}</span>
              <div className={`p-3 rounded-xl text-sm max-w-xs ${msg.sender === senderName ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
          <input
            type="text"
            placeholder="พิมพ์ข้อความเพื่อนัดหมาย..."
            className="flex-1 p-3 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition">
            ส่ง
          </button>
        </form>
      </div>
    </main>
  )
}