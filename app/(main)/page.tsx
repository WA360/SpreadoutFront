'use client';

import React, { useEffect, useState } from 'react';
import PDFReader from '@/components/PDFReader';
import Graph from '@/components/Graph/Graph';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import {
  selectedPdfIdState,
  pdfFileState,
  selectedTocState,
} from '@/recoil/atoms';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import axios from 'axios';
import Chat from '@/components/Chat/Chat';

interface TabData {
  key: string;
  title: string;
}

export interface OriginNode {
  bookmarked: number;
  end_page: number;
  group: number;
  id: number;
  level: number;
  name: string;
  pdf_file_id: number;
  start_page: number;
}

export interface OriginLink {
  id: number;
  pdf_file_id: number;
  similarity: number;
  source: number;
  target: number;
}

export interface OriginSessionNode {
  id: number;
  chapter_id: number;
  name: string;
  level: number;
  user_id: number;
}

export interface OriginSessionLink {
  id: number;
  pdf_file_id: number;
  similarity: number;
  source: number;
  target: number;
}

export interface OriginGraphData {
  nodes: OriginNode[];
  links: OriginLink[];
  session_nodes: OriginSessionNode[];
  session_links: OriginSessionLink[];
}

const Page = () => {
  const selectedPdfId = useRecoilValue(selectedPdfIdState); // 현재 보고 있는 pdf id의 전역상태
  const setPdfFile = useSetRecoilState(pdfFileState); // 현재 보고 있는 pdf파일의 전역상태 설정 함수
  const selectedToc = useRecoilValue(selectedTocState); // 현재 클릭한 챕터의 전역상태
  const [tabs1, setTabs1] = useState<TabData[]>([
    // Tabs1에 소속된 Tab들의 정보가 들어있는 배열
    { key: 'diagram', title: 'Diagram' },
    { key: 'bookmarked', title: 'Bookmarked' }, // 기본 포함 탭
  ]);
  const [activeTab1, setActiveTab1] = useState<number>(0); // Tabs1에서 현재 활성화 돼있는 탭을 구분하기 위한 상태
  // Tabs1에 속한 Tab마다 pageNumber를 설정해주기 위한 상태
  const [tabPageNumbers, setTabPageNumbers] = useState<{
    [key: string]: number;
  }>({ diagram: 1 });

  const [tabs2, setTabs2] = useState<TabData[]>([
    // Tabs2에 소속된 Tab들의 정보가 들어있는 배열
    { key: 'chat', title: 'Chat' }, // Chat Tab은 미리 넣어준다.
  ]);
  const [activeTab2, setActiveTab2] = useState<number>(0); // Tabs2에서 현재 활성화 돼있는 탭을 구분하기 위한 상태
  // Tabs2에 속한 Tab들의 SessionNumber를 설정해주기 위한 상태
  const [tabSessionNumbers, setTabSessionNumbers] = useState<{
    [key: string]: number;
  }>({ chat: 0 });

  const [graphData, setGraphData] = useState<OriginGraphData | null>(null); // express서버에서 받아온 그래프 데이터가 담기는 상태

  const addTab1 = (pageNumber: number) => {
    // Tabs1에 Tab추가하는 함수
    const newTabKey = `tab-${tabs1.length}`;
    setTabs1([...tabs1, { key: newTabKey, title: `Page ${pageNumber}` }]);
    setActiveTab1(tabs1.length);
    // 해당 pdf뷰어 Tab에 전달할 pageNumber 설정
    setTabPageNumbers({ ...tabPageNumbers, [newTabKey]: pageNumber });
  };

  const removeTab1 = (key: string) => {
    // Tabs1에 Tab삭제하는 함수
    const newTabs = tabs1.filter((tab) => tab.key !== key);
    const newIndex =
      tabs1.findIndex((tab) => tab.key === key) === activeTab1 && activeTab1 > 0
        ? activeTab1 - 1
        : activeTab1;
    setTabs1(newTabs); // Tab 정보 재설정
    setActiveTab1(newIndex); // 활성 Tab 설정
    const { [key]: _, ...newTabPageNumbers } = tabPageNumbers;
    setTabPageNumbers(newTabPageNumbers); // Tab pdfReader에 pageNumber 전달
  };

  const removeTab2 = (key: string) => {
    // Tabs2에 Tab삭제하는 함수
    const newTabs = tabs2.filter((tab) => tab.key !== key);
    const newIndex =
      tabs2.findIndex((tab) => tab.key === key) === activeTab2 && activeTab2 > 0
        ? activeTab2 - 1
        : activeTab2;
    setTabs2(newTabs);
    setActiveTab2(newIndex);
    const { [key]: _, ...newTabPageNumbers } = tabSessionNumbers;
    setTabSessionNumbers(newTabPageNumbers);
  };

  const fetchGraphData = async (pdfId: number) => {
    // url, node, link 가져오는 함수
    try {
      const response = await axios.get(`http://3.38.176.179:4000/pdf`, {
        params: { pdfId },
      });
      const data = response.data;

      console.log('data---->', data);

      setGraphData(data);

      // PDF URL 추출
      const pdfUrl = data.url;
      if (pdfUrl) {
        // S3에서 PDF 파일 읽기
        const pdfResponse = await axios.get(pdfUrl, {
          responseType: 'blob',
        });
        const pdfFile = new File([pdfResponse.data], 'downloaded.pdf', {
          type: 'application/pdf',
        });
        setPdfFile(pdfFile);
        console.log('pdf 가져옴 : ', pdfFile);
      }
    } catch (error) {
      console.error('Error fetching PDF data:', error);
    }
  };

  const handleNodeClick = async (pageNumber: number) => {
    setTabs1((prevTabs) => {
      const newTabKey = `tab-${prevTabs.length}`; // prevTabs.length를 사용하여 새로운 탭 키 생성
      console.log(newTabKey); // 새 탭 키 출력
      const newTabs = [
        ...prevTabs,
        { key: newTabKey, title: `Page ${pageNumber}` },
      ]; // 이전 탭 배열에 새 탭 추가
      setActiveTab1(newTabs.length - 1); // 새로 추가된 탭을 활성화
      setTabPageNumbers((prevTabPageNumbers) => ({
        ...prevTabPageNumbers,
        [newTabKey]: pageNumber,
      })); // 새 탭의 페이지 번호 설정
      return newTabs; // 새 탭 배열 반환
    });
  };

  const handleSessionNodeClick = async (sessionId: number) => {
    setTabs2((prevTabs) => {
      const newTabKey = `session-tab-${prevTabs.length}`; // prevTabs.length를 사용하여 새로운 탭 키 생성
      console.log(newTabKey); // 새 탭 키 출력
      const newTabs = [
        ...prevTabs,
        { key: newTabKey, title: `Session ${sessionId}` },
      ]; // 이전 탭 배열에 새 탭 추가
      setActiveTab2(newTabs.length - 1); // 새로 추가된 탭을 활성화
      setTabSessionNumbers((prevTabSessionNumbers) => ({
        ...prevTabSessionNumbers,
        [newTabKey]: sessionId,
      })); // 새 탭의 세션 번호 설정
      return newTabs; // 새 탭 배열 반환
    });
  };

  useEffect(() => {
    if (selectedPdfId !== null) {
      fetchGraphData(selectedPdfId); // pdf파일 클릭시 선택된 pdfId 전달하고, url, nodes, links 가져오기
    }
  }, [selectedPdfId]);

  useEffect(() => {
    if (selectedToc) {
      addTab1(selectedToc.startPage); // 목차 클릭시 Tab 추가하고, 선택된 목차의 pageNumber pdfReader에 전달
    }
  }, [selectedToc]);

  return (
    <div className="flex h-full gap-2">
      <Tabs
        selectedIndex={activeTab1}
        onSelect={(tabIndex) => setActiveTab1(tabIndex)}
        className="flex flex-col flex-1 h-full min-w-[700px]"
      >
        <TabList>
          {tabs1.map((tab, index) => (
            <Tab key={tab.key}>
              {tab.title}
              &nbsp;
              {index > 1 && (
                <button onClick={() => removeTab1(tab.key)}>x</button>
              )}
            </Tab>
          ))}
        </TabList>
        {tabs1.map((tab) => (
          <TabPanel key={tab.key}>
            {tab.key === 'diagram' || tab.key === 'bookmarked' ? (
              <Graph
                iskey={tab.key}
                data={
                  graphData || {
                    nodes: [],
                    links: [],
                    session_nodes: [],
                    session_links: [],
                  }
                }
                handleNodeClick={handleNodeClick}
                handleSessionNodeClick={handleSessionNodeClick}
              />
            ) : (
              <div className="relative tab-panel h-full">
                <h3 className="absolute top-1 right-4 z-10">
                  Tab Number: {tabs1.findIndex((t) => t.key === tab.key)}
                </h3>
                <PDFReader
                  pageNumber={tabPageNumbers[tab.key]}
                  fetchGraphData={fetchGraphData}
                />
              </div>
            )}
          </TabPanel>
        ))}
      </Tabs>

      <Tabs
        selectedIndex={activeTab2}
        onSelect={(tabIndex) => setActiveTab2(tabIndex)}
        className="flex flex-col flex-1 h-full"
      >
        <TabList>
          {tabs2.map((tab, index) => (
            <Tab key={tab.key}>
              {tab.title}
              &nbsp;
              {index !== 0 && (
                <button onClick={() => removeTab2(tab.key)}>x</button>
              )}
            </Tab>
          ))}
        </TabList>
        {tabs2.map((tab) => (
          <TabPanel key={tab.key}>
            {tab.key === 'chat' ? (
              <Chat sessionId={tabSessionNumbers[tab.key]} />
            ) : (
              <div className="relative tab-panel h-full">
                <h3 className="absolute top-1 right-4 z-10">
                  Tab Number: {tabs2.findIndex((t) => t.key === tab.key)}
                </h3>
                <Chat sessionId={tabSessionNumbers[tab.key]} />{' '}
                {/* 세션 ID 전달 */}
              </div>
            )}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

export default Page;
