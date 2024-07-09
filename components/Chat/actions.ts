'use server';

import axios from 'axios';

export async function sendMessage(question: string): Promise<string> {
  try {
    const response = await axios.post(process.env.API_URL! + 'llm', {
      question,
    });
    return response.data.response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('메시지 전송 중 오류가 발생했습니다.');
  }
}
