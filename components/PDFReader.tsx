// src/components/PDFReader.tsx
'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRecoilValue } from 'recoil';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import {
  pdfFileState,
  selectedTocState,
  selectedPdfIdState,
} from '../recoil/atoms';
import axios from 'axios';
import { headers } from 'next/headers';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFReaderProps {
  pageNumber: number;
  fetchGraphData: (pdfId: number) => void;
}

const PDFReader: React.FC<PDFReaderProps> = ({
  pageNumber,
  fetchGraphData,
}) => {
  const pdfFile = useRecoilValue(pdfFileState);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    const initialVisiblePages = [
      // Math.max(1, pageNumber - 2),
      // Math.max(1, pageNumber - 1),
      pageNumber,
      Math.min(numPages, pageNumber + 1),
      Math.min(numPages, pageNumber + 2),
      Math.min(numPages, pageNumber + 3),
      Math.min(numPages, pageNumber + 4),
    ].filter((value, index, self) => self.indexOf(value) === index);
    setVisiblePages(initialVisiblePages);
  };

  const loadMorePages = (direction: 'up' | 'down') => {
    if (isLoading || !numPages) return;

    setIsLoading(true);
    setTimeout(() => {
      setVisiblePages((prev) => {
        const newPages = [...prev];
        if (direction === 'up' && newPages[0] > 1) {
          newPages.unshift(newPages[0] - 1);
        } else if (
          direction === 'down' &&
          newPages[newPages.length - 1] < numPages
        ) {
          newPages.push(newPages[newPages.length - 1] + 1);
        }
        return newPages;
      });
      setIsLoading(false);
    }, 10); // 300ms delay to simulate loading
  };

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;

        if (scrollTop < clientHeight * 0.6) {
          loadMorePages('up');
        } else if (scrollBottom < clientHeight * 0.2) {
          loadMorePages('down');
        }
      }
    };
    // handleScroll();

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [visiblePages, numPages, isLoading]);

  return (
    <div className="pdf-reader-wrapper relative h-screen">
      <div
        ref={containerRef}
        className="container mx-auto p-4 overflow-auto h-full"
      >
        {pdfFile && (
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            className="border border-gray-300 rounded"
          >
            {visiblePages.map((pageNum) => (
              <Page
                key={pageNum}
                pageNumber={pageNum}
                className="max-w-full h-auto mb-4"
              />
            ))}
          </Document>
        )}
        {numPages && (
          <p className="mt-4 text-sm text-gray-600">
            총 {numPages}페이지 중 {visiblePages[0]} -{' '}
            {visiblePages[visiblePages.length - 1]}페이지 표시 중
          </p>
        )}
      </div>
    </div>
  );
};

export default PDFReader;
