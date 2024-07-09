import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from './actions';

interface Message {
  text: string;
  isUser: boolean;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 컴포넌트가 마운트되거나 메시지를 보낸 후 input에 포커스
    inputRef.current?.focus();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      setMessages((prev) => [{ text: inputMessage, isUser: true }, ...prev]);
      setIsLoading(true);
      try {
        const response = await sendMessage(inputMessage);
        const responseText =
          typeof response === 'object' ? JSON.stringify(response) : response;
        setMessages((prev) => [{ text: responseText, isUser: false }, ...prev]);
      } catch (error) {
        setMessages((prev) => [
          { text: '죄송합니다. 오류가 발생했습니다.', isUser: false },
          ...prev,
        ]);
      } finally {
        setIsLoading(false);
        setInputMessage('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full border">
      <div className="flex flex-col-reverse flex-1 p-[8px] overflow-auto">
        {isLoading && <div>메시지를 처리 중입니다...</div>}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-2 ${message.isUser ? 'text-right' : 'text-left'}`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSendMessage}
        className="flex items-center border p-[8px]"
      >
        <input
          type="text"
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading}
          className="flex-grow p-2 border rounded-l"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="p-2 bg-blue-500 text-white rounded-r"
        >
          전송
        </button>
      </form>
    </div>
  );
};

export default Chat;
