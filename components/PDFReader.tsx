// src/components/PDFReader.tsx
"use client";

import React, { useState } from "react";
import { useRecoilValue } from "recoil";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { pdfFileState } from "../recoil/atoms";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface PDFReaderProps {
  pageNumber: number | null; // 페이지 번호를 prop으로 추가
}

const PDFReader: React.FC<PDFReaderProps> = ({ pageNumber }) => {
  // prop 추가
  const pdfFile = useRecoilValue(pdfFileState);
  const [numPages, setNumPages] = useState<number | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="container mx-auto p-4">
      {pdfFile && (
        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
          className="border border-gray-300 rounded">
          {pageNumber !== null && (
            <Page pageNumber={pageNumber} className="max-w-full h-auto" />
          )}
        </Document>
      )}
      {numPages && (
        <p className="mt-4 text-sm text-gray-600">
          총 {numPages}페이지 중 {pageNumber !== null ? pageNumber : "1"}페이지
        </p>
      )}
    </div>
  );
};

export default PDFReader;
