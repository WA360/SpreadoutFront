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

export interface origin_Node {
  bookmarked: number;
  end_page: number;
  group: number;
  id: number;
  level: number;
  name: string;
  pdf_file_id: number;
  start_page: number;
}

export interface origin_Link {
  id: number;
  pdf_file_id: number;
  similarity: number;
  source: number;
  target: number;
}

export interface GraphData {
  nodes: origin_Node[];
  links: origin_Link[];
}

const Page = () => {
  const selectedPdfId = useRecoilValue(selectedPdfIdState);
  const setPdfFile = useSetRecoilState(pdfFileState);
  const selectedToc = useRecoilValue(selectedTocState);
  const [tabs1, setTabs1] = useState<TabData[]>([
    { key: 'diagram', title: 'Diagram' },
  ]);
  const [activeTab1, setActiveTab1] = useState<number>(0);
  const [tabPageNumbers1, setTabPageNumbers1] = useState<{
    [key: string]: number;
  }>({ diagram: 1 });
  const [tabs2, setTabs2] = useState<TabData[]>([
    { key: 'chat', title: 'Chat' },
  ]);
  const [activeTab2, setActiveTab2] = useState<number>(0);
  const [tabPageNumbers2, setTabPageNumbers2] = useState<{
    [key: string]: number;
  }>({ chat: 1 });
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  const addTab1 = (pageNumber: number) => {
    const newTabKey = `tab-${tabs1.length}`;
    setTabs1([...tabs1, { key: newTabKey, title: `Page ${pageNumber}` }]);
    setActiveTab1(tabs1.length);
    setTabPageNumbers1({ ...tabPageNumbers1, [newTabKey]: pageNumber });
  };

  const removeTab1 = (key: string) => {
    const newTabs = tabs1.filter((tab) => tab.key !== key);
    const newIndex =
      tabs1.findIndex((tab) => tab.key === key) === activeTab1 && activeTab1 > 0
        ? activeTab1 - 1
        : activeTab1;
    setTabs1(newTabs);
    setActiveTab1(newIndex);
    const { [key]: _, ...newTabPageNumbers } = tabPageNumbers1;
    setTabPageNumbers1(newTabPageNumbers);
  };

  const removeTab2 = (key: string) => {
    const newTabs = tabs2.filter((tab) => tab.key !== key);
    const newIndex =
      tabs2.findIndex((tab) => tab.key === key) === activeTab2 && activeTab2 > 0
        ? activeTab2 - 1
        : activeTab2;
    setTabs2(newTabs);
    setActiveTab2(newIndex);
    const { [key]: _, ...newTabPageNumbers } = tabPageNumbers2;
    setTabPageNumbers2(newTabPageNumbers);
  };

  const fetchGraphData = async (pdfId: number) => {
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
    const newTabKey = `tab-${tabs1.length}`;
    setTabs1([...tabs1, { key: newTabKey, title: `Page ${pageNumber}` }]);
    setActiveTab1(tabs1.length);
    setTabPageNumbers1({ ...tabPageNumbers1, [newTabKey]: pageNumber });
  };

  useEffect(() => {
    if (selectedPdfId !== null) {
      fetchGraphData(selectedPdfId);
    }
  }, [selectedPdfId]);

  useEffect(() => {
    if (selectedToc) {
      addTab1(selectedToc.startPage);
    }
  }, [selectedToc]);

  return (
    <div className="flex h-full">
      <Tabs
        selectedIndex={activeTab1}
        onSelect={(tabIndex) => setActiveTab1(tabIndex)}
        className="flex flex-col flex-1 h-full"
      >
        <TabList>
          {tabs1.map((tab, index) => (
            <Tab key={tab.key}>
              {tab.title}
              &nbsp;
              {index !== 0 && (
                <button onClick={() => removeTab1(tab.key)}>x</button>
              )}
            </Tab>
          ))}
        </TabList>
        {tabs1.map((tab) => (
          <TabPanel key={tab.key}>
            {tab.key === 'diagram' ? (
              selectedPdfIdState == null ? (
                <></>
              ) : (
                <Graph
                  data={graphData || { nodes: [], links: [] }}
                  handleNodeClick={handleNodeClick}
                />
              )
            ) : (
              <div className="relative tab-panel h-full">
                <h3 className="absolute top-1 right-4 z-10">
                  Tab Number: {tabs1.findIndex((t) => t.key === tab.key)}
                </h3>
                <PDFReader pageNumber={tabPageNumbers1[tab.key]} />
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
              <Chat />
            ) : (
              <div className="relative tab-panel h-full">
                <h3 className="absolute top-1 right-4 z-10">
                  Tab Number: {tabs2.findIndex((t) => t.key === tab.key)}
                </h3>
              </div>
            )}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

export default Page;
