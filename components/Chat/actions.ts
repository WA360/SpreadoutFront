'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

interface Message {
  text: string;
  isUser: boolean;
}

export const getMessages = async (sessionId: number): Promise<Message[]> => {
  if (!sessionId) return [];

  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6Iu2FjOyKpOydtCIsInVzZXJJZCI6InRlc3QyIiwidXVpZCI6MiwiaWF0IjoxNzI1MjYxMjExLCJleHAiOjE3OTcyNjEyMTF9.8P4sPDaHi6pikx6ArF17ejU-VBNbmFeONDAsnD15D90';
  const response = await axios.get('http://3.38.176.179:4000/bot/session/detail', {
    params: { chapterId: sessionId },
    headers: {
      token: `${token}`,
    },
  });

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

export const saveMessage = async (sessionId: number, messages: Message[]): Promise<void> => {
  if (!sessionId) return;
  let result = messages
    .reverse()
    .map((item) => {
      if (item.isUser) {
        return `<<user>>${item.text}`;
      } else {
        return `<<bot>>${item.text}`;
      }
    })
    .join('');

  try {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6Iu2FjOyKpOydtCIsInVzZXJJZCI6InRlc3QyIiwidXVpZCI6MiwiaWF0IjoxNzI1MjYxMjExLCJleHAiOjE3OTcyNjEyMTF9.8P4sPDaHi6pikx6ArF17ejU-VBNbmFeONDAsnD15D90';
    const response = await axios.put(
      `http://3.38.176.179:4000/bot/session/detail`,
      {
        content: result,
        chapterId: sessionId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          token: `${token}`,
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
