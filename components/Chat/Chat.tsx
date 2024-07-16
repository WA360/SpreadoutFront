import React, { useState, useRef, useEffect } from 'react';
import { getMessages, saveMessage } from './actions'; // actions.ts 파일에서 함수들을 가져옵니다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Message {
  text: string;
  isUser: boolean;
}

interface ChatProps {
  sessionId: number;
}

const Chat: React.FC<ChatProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnd, setIsEnd] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // React Query를 사용하여 메시지 가져오기
  const { data: server_messages = [] } = useQuery<Message[]>({
    queryKey: ['server_messages', sessionId],
    queryFn: () => getMessages(sessionId!),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (server_messages.length > 0) {
      setMessages(server_messages);
    }
  }, [server_messages]);

  const sendMessage = async (
    question: string,
  ): Promise<ReadableStream<Uint8Array>> => {
    if (!isEnd) return new ReadableStream<Uint8Array>();

    const response = await fetch(
      'http://3.38.176.179:8100/question/langchain',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question, fileNum: 3, fileName: "fileName" }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body!;
  };

  // 메시지 저장을 위한 뮤테이션
  const saveMutation = useMutation({
    mutationFn: ({
      sessionId,
      messages,
    }: {
      sessionId: number;
      messages: Message[];
    }) => saveMessage(sessionId, messages),
    onSuccess: () => {
      // 성공적으로 저장되면 캐시를 업데이트합니다.
      // queryClient.invalidateQueries({
      //   queryKey: ['server_messages', sessionId],
      // });
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = { isUser: true, text: inputMessage };
    setMessages((prev) => [userMessage, ...prev]);
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
            newMessages.unshift({ text: aiMessage, isUser: false });
          } else if (newMessages.length > 0) {
            newMessages[0] = {
              text: aiMessage,
              isUser: false,
            };
          } else {
            newMessages.push({ text: aiMessage, isUser: false });
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        text: '메시지 전송 중 오류가 발생했습니다.',
        isUser: false,
      };
      setMessages((prev) => [errorMessage, ...prev]);
      setIsEnd(true);
    } finally {
      setIsLoading(false);
      setIsEnd(true);
    }
  };

  useEffect(() => {
    if (!messages[0] || isLoading || !isEnd) return;
    saveMutation.mutate({
      sessionId,
      messages,
    });
  }, [isLoading, isEnd]);

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
