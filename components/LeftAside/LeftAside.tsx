'use client';

import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import {
  pdfFileState,
  selectedPdfIdState,
  selectedTocState,
} from '../../recoil/atoms';
import { fetchPdfFilesFromServer, fetchPdfDataFromServer } from './actions';
import axios from 'axios';
import './styles.css'; // CSS 파일 import

const LeftAside = () => {
  const [, setPdfFile] = useRecoilState(pdfFileState);
  const [selectedPdfId, setSelectedPdfId] = useRecoilState(selectedPdfIdState);
  const [, setSelectedToc] = useRecoilState(selectedTocState);
  const [pdfFiles, setPdfFiles] = useState<{ id: number; filename: string }[]>(
    [],
  );
  const [pdfData, setPdfData] = useState<any>(null);
  const [isTocVisible, setIsTocVisible] = useState(true); // 목차 가시성 토글 상태
  ////////////////////////////////////////////////////////////////////////////////////////
  const getCookieValue = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const getUserUUID = async () => {
    try {
      const token = getCookieValue('token');
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

  const uploadPdfFile = async (file: File) => {
    // server에서 form으로 파일을 직접 받을 수 없어서 일단 여기 만듦. 추후 base64로 인코딩해서 서버사이드에서 처리 요망
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
  ////////////////////////////////////////////////////////////////////////////////////////
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file); // pdf 파일 저장

      try {
        await uploadPdfFile(file);
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

  useEffect(() => {
    if (selectedPdfId) {
      fetchPdfData();
    }
  }, [selectedPdfId]);

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

  const fetchPdfFiles = async () => {
    try {
      const files = await fetchPdfFilesFromServer();
      setPdfFiles(files);
    } catch (error) {
      console.error('Error fetching PDF files:', error);
    }
  };

  const handlePdfClick = async (id: number) => {
    setSelectedPdfId(id);
    console.log('pdfId 변경됨 : ', id);
  };

  const handleTocClick = (id: number, startPage: number) => {
    setSelectedToc({ id, startPage }); // selectedToc 상태 업데이트
  };

  const toggleTocVisibility = () => {
    setIsTocVisible(!isTocVisible); // 목차 가시성 토글
  };

  useEffect(() => {
    fetchPdfFiles();
  }, []);

  return (
    <aside className="flex flex-col w-80 shrink-0 border-r p-2">
      <label
        htmlFor="file_upload"
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md cursor-pointer hover:bg-blue-700 transition-colors duration-300"
      >
        파일 업로드
      </label>
      <input
        id="file_upload"
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <ul className="scrollable-list h-[calc(100%-48px)] overflow-auto">
        {pdfFiles.map((file) => (
          <li
            key={file.id}
            className="scrollable-list-item cursor-pointer"
            onClick={() => handlePdfClick(file.id)}
          >
            <div className="file-info">
              <span>{file.filename}</span>
              {selectedPdfId === file.id && (
                <button
                  className="toc-toggle-button"
                  onClick={toggleTocVisibility}
                >
                  {isTocVisible ? 'Hide' : 'Show'} TOC
                </button>
              )}
            </div>
            {selectedPdfId === file.id && isTocVisible && pdfData && (
              <ul className="toc-list">
                {pdfData.nodes.map(
                  (node: { id: number; name: string; start_page: number }) => (
                    <li
                      key={node.id}
                      className="toc-item"
                      onClick={() =>
                        handleTocClick(node.id, node.start_page)
                      }
                    >
                      {node.name}
                    </li>
                  ),
                )}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default LeftAside;
