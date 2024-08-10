'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export const fetchPdfFilesFromServer = async () => {
  try {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6Iu2FjOyKpOydtCIsInVzZXJJZCI6InRlc3QyIiwidXVpZCI6MiwiaWF0IjoxNzIzMjkxMDczLCJleHAiOjE3MjM4MzEwNzN9.F7Zdp5Shllu_PsRHq-0py_wmtonkfKeFaPbj8zsI6Q4';
    const response = await axios.get('http://3.38.176.179:4000/pdf/list', {
      headers: {
        token: `${token}`,
      },
    });
    return response.data.user;
  } catch (error) {
    console.error('Error fetching PDF files from server:', error);
    throw error;
  }
};

export const fetchPdfDataFromServer = async (pdfId: number) => {
  try {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6Iu2FjOyKpOydtCIsInVzZXJJZCI6InRlc3QyIiwidXVpZCI6MiwiaWF0IjoxNzIzMjkxMDczLCJleHAiOjE3MjM4MzEwNzN9.F7Zdp5Shllu_PsRHq-0py_wmtonkfKeFaPbj8zsI6Q4';
    const response = await axios.get('http://3.38.176.179:4000/pdf', {
      params: { pdfId },
      headers: {
        token: `${token}`,
      },
    });
    return response.data; // data 전체를 가져옴
  } catch (error) {
    console.error('Error fetching PDF data from server:', error);
    throw error;
  }
};
