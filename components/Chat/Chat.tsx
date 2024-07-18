import React, { useState, useRef, useEffect } from 'react';
import { getMessages, saveMessage } from './actions'; // actions.ts 파일에서 함수들을 가져옵니다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import 'github-markdown-css/github-markdown.css';
import { emojify } from 'node-emoji';

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
  const messagesEndRef = useRef<HTMLDivElement>(null); // 메시지 끝에 대한 ref 추가

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
        body: JSON.stringify({
          question: question,
          fileNum: 3,
          fileName: 'csapp.pdf',
          chatNum: 7,
        }),
      },
    );

    console.log('response', response);

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
    setMessages((prev) => [...prev, userMessage]);
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

        console.log('aiMessage', aiMessage);

        setMessages((prev) => {
          const newMessages = [...prev];
          if (
            newMessages.length > 0 &&
            !newMessages[newMessages.length - 1].isUser
          ) {
            newMessages[newMessages.length - 1] = {
              text: emojify(aiMessage),
              isUser: false,
            };
          } else {
            newMessages.push({ text: emojify(aiMessage), isUser: false });
          }
          return newMessages;
        });

        console.log('messages', messages);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        text: '메시지 전송 중 오류가 발생했습니다.',
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  // 메시지가 업데이트될 때마다 스크롤을 하단으로 이동시키는 useEffect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full border">
      <div className="flex flex-col flex-1 p-[8px] overflow-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex mb-4 ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!message.isUser && (
              <div className="w-8 h-8 shadow-md border rounded-full flex items-center justify-center mr-2">
                🤖
              </div>
            )}
            <div
              className={`p-3 rounded-lg shadow-md max-w-[70%] ${message.isUser ? 'bg-white text-gray-800 border shadow-md' : 'bg-white text-gray-800 border shadow-md'}`}
            >
              {message.isUser ? (
                message.text
              ) : (
                <div className="markdown-body bg-transparent text-inherit">
                  <Markdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                  >
                    {DOMPurify.sanitize(message.text)}
                  </Markdown>
                </div>
              )}
            </div>
            {message.isUser && (
              <div className="w-8 h-8 shadow-md border rounded-full flex items-center justify-center ml-2">
                😊
              </div>
            )}
          </div>
        ))}
        {isLoading && <div>메시지를 처리 중입니다...</div>}
        <div ref={messagesEndRef} />
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
