"use server";

import axios from 'axios';
import { cookies } from 'next/headers';

export const fetchPdfFilesFromServer = async () => {
  try {
    const token = cookies().get('token');
    const response = await axios.get('http://3.38.176.179:4000/pdf/list', {
      headers: {
        token: `${token?.value}`,
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
    const token = cookies().get('token');
    const response = await axios.get('http://3.38.176.179:4000/pdf', {
      params: { pdfId },
      headers: {
        token: `${token?.value}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PDF data from server:', error);
    throw error;
  }
};
