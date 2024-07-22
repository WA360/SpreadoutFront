import React, { useState, useRef, useEffect } from 'react';
import { getMessages, saveMessage } from './actions';
import { useMutation, useQuery } from '@tanstack/react-query';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import 'github-markdown-css/github-markdown.css';
import { emojify } from 'node-emoji';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  pdfDataState,
  selectedPdfIdState,
  Message,
  messageState,
} from '@/recoil/atoms';
import { Data } from '@/components/Graph/Graph';

interface ChatProps {
  sessionId: number;
}

export default function Chat({ sessionId }: ChatProps) {
  const [messages, setMessages] = useRecoilState(messageState);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnd, setIsEnd] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedPdfId = useRecoilValue(selectedPdfIdState);
  const pdfData = useRecoilValue<Data | null>(pdfDataState);

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
    // 랜덤으로 1부터 1000000까지 생성
    const random = (min: number, max: number): number => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const randomNumber = random(1, 1000000);
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
          fileNum: selectedPdfId,
          ...(pdfData?.nodes[0]?.filename && {
            fileName: pdfData?.nodes[0]?.filename,
          }),
          chatNum: randomNumber,
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
    const userMessage: Message = {
      isUser: true,
      text: inputMessage.replace(/\n/g, '<br>'), // 줄바꿈 문자를 <br>로 변환
    };
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.log('test');
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any); // 타입 캐스팅
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

  const [testLoading, setTestLoading] = useState(true);

  // 로딩 상태를 제어하는 로직 (예시)
  useEffect(() => {
    const timer = setTimeout(() => setTestLoading(false), 15000); // 5초 후 로딩 완료
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-full border overflow-hidden">
      <div className="flex flex-col flex-1 p-[8px] overflow-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start mb-4 ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!message.isUser && (
              <div className="text-3xl shadow-md border rounded-full flex items-center justify-center mr-2 h-10 w-10">
                🤖
              </div>
            )}
            <div
              className={`p-3 rounded-lg shadow-md max-w-[70%] text-xl ${message.isUser ? 'bg-white text-gray-800 border shadow-md' : 'bg-white text-gray-800 border shadow-md'}`}
            >
              <div className="markdown-body bg-transparent text-inherit">
                <Markdown
                  rehypePlugins={[rehypeRaw]}
                  remarkPlugins={[remarkGfm]}
                  className={'text-xl [&>p:last-child]:mb-0'}
                >
                  {DOMPurify.sanitize(message.text)}
                </Markdown>
              </div>
            </div>
            {message.isUser && (
              <div className="text-3xl shadow-md border rounded-full flex items-center justify-center ml-2 h-10 w-10">
                😊
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start mb-4 justify-start">
            <div className="text-3xl shadow-md border rounded-full flex items-center justify-center mr-2 h-10 w-10">
              🤖
            </div>
            <div className="flex p-4 rounded-lg bg-white text-gray-800 border shadow-md items-center justify-center space-x-2">
              <div className="dot bg-gray-500 w-2.5 h-2.5 rounded-full animate-bounce"></div>
              <div className="dot bg-gray-500 w-2.5 h-2.5 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="dot bg-gray-500 w-2.5 h-2.5 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSendMessage}
        className="flex items-center border p-[8px]"
      >
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          disabled={!isEnd}
          className="flex-grow p-2 border rounded-l resize-none"
          rows={1}
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
}
