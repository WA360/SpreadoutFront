"use client";

import { useRecoilState } from "recoil";
import { pdfFileState } from "../../recoil/atoms";
import { useEffect, useState } from "react";
import { fetchPdfFilesFromServer, fetchPdfDataFromServer } from "./actions";
import axios from "axios";

const LeftAside = () => {
  const [pdfFile, setPdfFile] = useRecoilState(pdfFileState);
  const [pdfFiles, setPdfFiles] = useState<{ id: number; filename: string }[]>([]);
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
      console.error("Error fetching PDF files:", error);
    }
  };

  const handlePdfClick = async (id: number) => {
    setSelectedPdfId(id);
    try {
      const pdfData = await fetchPdfDataFromServer(id);
      console.log(pdfData);
    } catch (error) {
      console.error("Error fetching PDF data:", error);
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
