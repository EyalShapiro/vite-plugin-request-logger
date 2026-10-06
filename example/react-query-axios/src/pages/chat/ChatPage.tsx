import { useState, useRef, useEffect } from 'react';
import { useChatMessages, useSendMessage } from '../../api/chat';

export default function ChatPage() {
  const { data: messages, isLoading } = useChatMessages();
  const sendMessageMutation = useSendMessage();
  const [text, setText] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessageMutation.mutate(text);
    setText('');
  };

  return (
    <div className="max-w-lg mx-auto h-[600px] flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-slate-100 dark:border-slate-800 dark:bg-slate-900">
      <header className="bg-pink-500 p-4 text-white text-center font-bold text-xl">
        🐶 Doggy Chat
      </header>
      
      <div className="flex-1 p-4 overflow-y-auto bg-pink-50 dark:bg-slate-800 flex flex-col gap-3">
        {isLoading && <p className="text-center text-slate-400">Loading chat...</p>}
        
        {messages?.map(msg => (
          <div 
            key={msg.id} 
            className={`px-5 py-3 max-w-[75%] break-words shadow-sm ${msg.sender === 'me' ? 'self-end bg-pink-500 text-white rounded-2xl rounded-br-sm' : 'self-start bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-sm'} ${msg.id.startsWith('optimistic') ? 'opacity-70' : 'opacity-100'}`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 flex gap-2 border-t border-slate-100 dark:border-slate-800">
        <input 
          type="text" 
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Say something to the dog..." 
          className="flex-1 px-5 py-3 rounded-full border border-slate-200 dark:border-slate-700 outline-none bg-slate-50 dark:bg-slate-800 focus:border-pink-500 dark:focus:border-pink-500 dark:text-white"
        />
        <button 
          type="submit" 
          disabled={!text.trim()}
          className={`font-bold py-3 px-6 rounded-full transition-colors ${text.trim() ? 'bg-pink-500 hover:bg-pink-600 text-white cursor-pointer' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
        >
          Send
        </button>
      </form>
    </div>
  );
}
