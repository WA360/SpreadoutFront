"use client";

import React, { useState, useRef, useEffect, memo, useMemo } from "react";
import { useRecoilValue } from "recoil";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { pdfFileState } from "../recoil/atoms";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface PDFReaderProps {
  pageNumber: number;
}

const PDFReader: React.FC<PDFReaderProps> = memo(({ pageNumber }) => {
  const pdfFile = useRecoilValue(pdfFileState);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(pageNumber);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    scrollToPage(pageNumber);
  };

  const scrollToPage = (page: number) => {
    if (!containerRef.current || !numPages) return;
    const container = containerRef.current;
    const pageHeight = container.scrollHeight / numPages;
    const scrollPosition = pageHeight * (page - 1);
    container.scrollTo(0, scrollPosition);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !numPages) return;

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const scrollPosition = scrollTop / (scrollHeight - clientHeight);
      const newPage = Math.floor(scrollPosition * numPages) + 1;

      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [numPages, currentPage]);

  useEffect(() => {
    scrollToPage(pageNumber);
  }, [pageNumber, numPages]);

  // Memoize the Document component to avoid reloading the PDF on tab changes
  const pdfDocument = useMemo(() => (
    <Document
      file={pdfFile}
      onLoadSuccess={onDocumentLoadSuccess}
      className="border border-gray-300 rounded"
    >
      {/* Render only visible pages to optimize performance */}
      {numPages && Array.from(new Array(numPages), (el, index) => (
        <Page
          key={`page_${index + 1}`}
          pageNumber={index + 1}
          className="max-w-full h-auto mb-4"
        />
      ))}
    </Document>
  ), [pdfFile, numPages]);

  return (
    <div
      ref={containerRef}
      className="container mx-auto p-4 h-screen overflow-auto"
    >
      {pdfFile && pdfDocument}
      {numPages && (
        <div className="fixed bottom-4 right-4 bg-white p-2 rounded shadow">
          <p className="text-sm text-gray-600">
            총 {numPages}페이지 중 {currentPage}페이지
          </p>
        </div>
      )}
    </div>
  );
});

export default PDFReader;
