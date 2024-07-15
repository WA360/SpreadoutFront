'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

interface Message {
  text: string;
  isUser: boolean;
}

export const getMessages = async (sessionId: number): Promise<Message[]> => {
  if (!sessionId) return [];

  const token = cookies().get('token');
  const response = await axios.get(
    'http://3.38.176.179:4000/bot/session/detail',
    {
      params: { chapterId: sessionId },
      headers: {
        token: `${token?.value}`,
      },
    },
  );
  console.log(response.data.message);
  console.log(response.data.message[0].content);

  const pattern = /<<(\w+)>>(.*?)(?=<<|$)/g;
  let match;
  const data = [];

  while ((match = pattern.exec(response.data.message[0].content)) !== null) {
    const userType = match[1] === 'user';
    const text = match[2];

    data.unshift({ isUser: userType, text: text.trim() });
  }

  return data;
};

export const saveMessage = async (
  sessionId: number,
  messages: Message,
): Promise<void> => {
  if (!sessionId) return;
  console.log('messages', messages);

  try {
    const response = await axios.put(
      `http://your-api-endpoint/sessions/${sessionId}/messages`,
      {
        content: message.text,
        chapterId: sessionId, // chapterId로 키가 잘못 설정됨
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status !== 200) {
      throw new Error('Failed to save message');
    }
  } catch (error) {
    console.error('Error saving message:', error);
  }
};

export const sendMessage = async (
  question: string,
): Promise<ReadableStream<Uint8Array>> => {
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
