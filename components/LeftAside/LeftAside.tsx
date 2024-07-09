'use client';

import { useRecoilState } from 'recoil';
import { pdfFileState, graphDataState } from '../../recoil/atoms';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchPdfFilesFromServer, fetchPdfDataFromServer } from './actions';

const LeftAside = () => {
  const [pdfFile, setPdfFile] = useRecoilState(pdfFileState);
  const [graphData, setGraphData] = useRecoilState(graphDataState);
  const [pdfFiles, setPdfFiles] = useState<{ id: number; filename: string }[]>(
    [],
  );
  const [selectedPdfId, setSelectedPdfId] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
    }
  };

  const fetchPdfFiles = async () => {
    try {
      const pdfFiles = await fetchPdfFilesFromServer();
      setPdfFiles(pdfFiles);
    } catch (error) {
      console.error('Error fetching PDF files:', error);
    }
  };

  const handlePdfClick = async (id: number) => {
    setSelectedPdfId(id);
    try {
      // PDF 파일의 전체 데이터 가져오기
      const pdfData = await fetchPdfDataFromServer(id);
      const pdfUrl = pdfData.url; // URL 추출

      // PDF 파일을 S3에서 다운로드하여 pdfFileState에 저장
      const response = await axios.get(pdfUrl, { responseType: 'blob' });
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const file = new File([pdfBlob], 'downloaded.pdf', {
        type: 'application/pdf',
      });
      setPdfFile(file);

      // 그래프 데이터를 가져오는 요청
      setGraphData({
        nodes: pdfData.node,
        links: pdfData.connection.map((conn: any) => ({
          id: conn.id,
          source: pdfData.node.find(
            (node: any) => node.id === conn.source_page,
          )!,
          target: pdfData.node.find(
            (node: any) => node.id === conn.target_page,
          )!,
          value: conn.similarity,
        })),
      });
    } catch (error) {
      console.error('Error fetching PDF or graph data:', error);
    }
  };

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
