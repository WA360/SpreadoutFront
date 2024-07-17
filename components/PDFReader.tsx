// src/components/PDFReader.tsx
'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRecoilValue } from 'recoil';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { pdfFileState, selectedTocState } from '../recoil/atoms';
import axios from 'axios';
import { headers } from 'next/headers';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFReaderProps {
  pageNumber: number;
}

const PDFReader: React.FC<PDFReaderProps> = ({ pageNumber }) => {
  const pdfFile = useRecoilValue(pdfFileState);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBookmark, setIsBookmark] = useState(0);
  const selectedToc = useRecoilValue(selectedTocState);

  useEffect(() => {
    console.log('잘 가져왔는가 : ', selectedToc);
    setIsBookmark(selectedToc!.bookmarked);
  }, [selectedToc]);

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

  const getCookieValue = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const handleBookmarkedButtonClick = async (chapterId: number) => {
    setIsBookmark((isBookmark + 1) % 2);
    console.log('api 작동!');
    try {
      const token = getCookieValue('token');
      const response = await axios.put(
        'http://3.38.176.179:4000/pdf/bookmark',
        {
          bookmarked: (selectedToc!.bookmarked + 1) % 2,
          chapterId: chapterId,
        },
        {
          headers: {
            token: `${token}`,
          },
        },
      );
    } catch (error) {
      console.error('백엔드 문제입니다. : ', error);
    }
  };

  return (
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
          <button
            className="bookmark-button"
            onClick={() => handleBookmarkedButtonClick(selectedToc!.id)}
          >
            {isBookmark ? '북마크 됨' : '북마크 안됨'}
          </button>
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
  );
};

export default PDFReader;
