'use client';

import { useRecoilState } from 'recoil';
import { pdfFileState, selectedPdfIdState } from '../../recoil/atoms';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchPdfFilesFromServer, fetchPdfDataFromServer } from './actions';


const LeftAside = () => {
  const [pdfFile, setPdfFile] = useRecoilState(pdfFileState);
  const [selectedPdfId, setSelectedPdfId] = useRecoilState(selectedPdfIdState);
  const [pdfFiles, setPdfFiles] = useState<{ id: number; filename: string }[]>(
    [],
  );
  const [pdfData, setPdfData] = useState<any>(null);

  const getCookieValue = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

// Function to get user UUID with token
const getUserUUID = async () => {
  try {
    // Obtain token from cookies
    const token = getCookieValue('token');

    // Send GET request with token in Authorization header
    const response = await axios.get('http://3.38.176.179:4000/users/uuid', {
      headers: {
        token: `${token}`,
      },
    });

    return response.data.uuid;
  } catch (error) {
    console.error('Error fetching user UUID:', error);
    throw error;
  }
};

  // Function to upload PDF file
  const uploadPdfFile = async (file: File) => {
    try {
      const uuid = await getUserUUID();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', uuid);

      await axios.post('http://3.38.176.179:8000/api/recommend/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Error uploading PDF file:', error);
      throw error;
    }
  };

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);

      try {
        // Upload PDF file
        await uploadPdfFile(file);

        // Update PDF files list
        const files = await fetchPdfFilesFromServer();
        setPdfFiles(files);
        if (files.length > 0) {
          setSelectedPdfId(files[files.length - 1].id);
        }
      } catch (error) {
        console.error('Error uploading PDF file:', error);
      }
    }
  };

  // Fetch PDF data when selected PDF ID changes
  useEffect(() => {
    if (selectedPdfId) {
      fetchPdfData();
    }
  }, [selectedPdfId]);

  // Fetch PDF data from server
  const fetchPdfData = async () => {
    if (selectedPdfId) {
      try {
        const data = await fetchPdfDataFromServer(selectedPdfId);
        setPdfData(data);
        console.log('Fetched PDF Data:', data);
      } catch (error) {
        console.error('Error fetching PDF data:', error);
      }
    }
  };

  // Fetch PDF files from server
  const fetchPdfFiles = async () => {
    try {
      const files = await fetchPdfFilesFromServer();
      setPdfFiles(files);
    } catch (error) {
      console.error('Error fetching PDF files:', error);
    }
  };

  // Handle PDF file click
  const handlePdfClick = async (id: number) => {
    setSelectedPdfId(id);
    console.log('pdfId 변경됨 : ', id);
  };

  // Fetch PDF files on component mount
  useEffect(() => {
    fetchPdfFiles();
  }, []);

  return (
    <aside className="flex flex-col w-80 shrink-0 border-r p-4">
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <p>Left Aside Content</p>
      <div>
        <h2>PDF Files</h2>
        <ul>
          {pdfFiles.map((file) => (
            <li key={file.id} onClick={() => handlePdfClick(file.id)}>
              {file.filename}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default LeftAside;
