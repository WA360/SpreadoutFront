'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export const fetchPdfFilesFromServer = async () => {
  try {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6Iu2FjOyKpOydtCIsInVzZXJJZCI6InRlc3QyIiwidXVpZCI6MiwiaWF0IjoxNzIyNTc1NTkwLCJleHAiOjE3MjMxMTU1OTB9._kMJqWAJvOvjLoTtIT9WqV8GL4clW_1-XFk4_IzANR0';
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
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6Iu2FjOyKpOydtCIsInVzZXJJZCI6InRlc3QyIiwidXVpZCI6MiwiaWF0IjoxNzIyNTc1NTkwLCJleHAiOjE3MjMxMTU1OTB9._kMJqWAJvOvjLoTtIT9WqV8GL4clW_1-XFk4_IzANR0';
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
