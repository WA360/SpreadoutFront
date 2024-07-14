import React, { useState, useRef, useEffect } from 'react';

interface Message {
  text: string;
  isUser: boolean;
}

interface ChatProps {
  sessionId?: number;
}

const Chat: React.FC<ChatProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnd, setIsEnd] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async (
    question: string,
  ): Promise<ReadableStream<Uint8Array>> => {
    if (!isEnd) return new ReadableStream<Uint8Array>();

    const response = await fetch('http://3.38.176.179:8100/question/bedrock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body!;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    setIsLoading(true);
    setMessages((prev) => [{ text: inputMessage, isUser: true }, ...prev]);
    setInputMessage('');
    setIsEnd(false);

    try {
      const stream = await sendMessage(inputMessage);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let aiMessage = '';
      let isReading = true;

      while (isReading) {
        const { done, value } = await reader.read();
        setIsLoading(false);
        if (done) {
          isReading = false;
          break;
        }

        const chunk = decoder.decode(value);
        aiMessage += chunk;

        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages.length > 0 && newMessages[0].isUser) {
            // 기존 메시지가 사용자 메시지인 경우 새로운 메시지를 앞에 추가
            newMessages.unshift({ text: aiMessage, isUser: false });
          } else if (newMessages.length > 0) {
            // 기존 메시지가 AI 메시지인 경우 메시지를 교체
            newMessages[0] = {
              text: aiMessage,
              isUser: false,
            };
          } else {
            // 배열이 비어 있는 경우 새로운 메시지를 추가
            newMessages.push({ text: aiMessage, isUser: false });
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { text: '메시지 전송 중 오류가 발생했습니다.', isUser: false },
      ]);
      setIsEnd(true);
    } finally {
      setIsLoading(false);
      setIsEnd(true);
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
          disabled={!isEnd}
          className="flex-grow p-2 border rounded-l"
        />
        <button
          type="submit"
          disabled={!isEnd}
          className="p-2 bg-blue-500 text-white rounded-r"
        >
          전송
        </button>
      </form>
    </div>
  );
};

export default Chat;
