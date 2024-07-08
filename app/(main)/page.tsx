// src/app/(main)/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import PDFReader from "@/components/PDFReader";
import Graph from "@/components/Graph/Graph";
import { pdfFileState } from "@/recoil/atoms";
import { useRecoilValue } from "recoil";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import axios from "axios"; // 사용자 정의 axios 인스턴스 임포트

interface TabData {
  key: string;
  title: string;
}

const Page = () => {
  const pdfFile = useRecoilValue(pdfFileState);

  const [tabs1, setTabs1] = useState<TabData[]>([{ key: 'diagram', title: 'Diagram' }]);
  const [activeTab1, setActiveTab1] = useState<number>(0);
  const [tabPageNumbers1, setTabPageNumbers1] = useState<{ [key: string]: number }>({ diagram: 1 });

  const [tabs2, setTabs2] = useState<TabData[]>([{ key: 'chat', title: 'Chat' }]);
  const [activeTab2, setActiveTab2] = useState<number>(0);
  const [tabPageNumbers2, setTabPageNumbers2] = useState<{ [key: string]: number }>({ chat: 1 });

  const [graphData, setGraphData] = useState<any>(null); // Graph 데이터 상태 관리

  const addTab1 = () => {
    const newKey = `tab-${tabs1.length}`;
    setTabs1([...tabs1, { key: newKey, title: `Tab ${tabs1.length}` }]);
    setActiveTab1(tabs1.length);
    setTabPageNumbers1({ ...tabPageNumbers1, [newKey]: 1 });
  };

  const addTab2 = () => {
    const newKey = `tab-${tabs2.length}`;
    setTabs2([...tabs2, { key: newKey, title: `Tab ${tabs2.length}` }]);
    setActiveTab2(tabs2.length);
    setTabPageNumbers2({ ...tabPageNumbers2, [newKey]: 1 });
  };

  const removeTab1 = (key: string) => {
    const newTabs = tabs1.filter(tab => tab.key !== key);
    const newIndex = tabs1.findIndex(tab => tab.key === key) === activeTab1 && activeTab1 > 0 ? activeTab1 - 1 : activeTab1;
    setTabs1(newTabs);
    setActiveTab1(newIndex);
    const { [key]: _, ...newTabPageNumbers } = tabPageNumbers1;
    setTabPageNumbers1(newTabPageNumbers);
  };

  const removeTab2 = (key: string) => {
    const newTabs = tabs2.filter(tab => tab.key !== key);
    const newIndex = tabs2.findIndex(tab => tab.key === key) === activeTab2 && activeTab2 > 0 ? activeTab2 - 1 : activeTab2;
    setTabs2(newTabs);
    setActiveTab2(newIndex);
    const { [key]: _, ...newTabPageNumbers } = tabPageNumbers2;
    setTabPageNumbers2(newTabPageNumbers);
  };

  const handleNodeClick = async (pageNumber: number) => {
    const newTabKey = `tab-${tabs1.length}`;
    setTabs1([...tabs1, { key: newTabKey, title: `Page ${pageNumber}` }]);
    setActiveTab1(tabs1.length);
    setTabPageNumbers1({ ...tabPageNumbers1, [newTabKey]: pageNumber });

    // 선택한 노드의 페이지 번호를 사용하여 PDF 관련 데이터 요청
    try {
      const response = await axios.get(`http://3.38.176.179:4000/pdf`, { params: { pdfId: pageNumber } });
      setGraphData(response.data); // Graph 데이터 업데이트
    } catch (error) {
      console.error("Error fetching PDF data:", error);
    }
  };

  useEffect(() => {
    console.log('PDF file state changed:', pdfFile);
  }, [pdfFile]);

  return (
    <div className="flex">
      <Tabs selectedIndex={activeTab1} onSelect={(tabIndex) => setActiveTab1(tabIndex)} className="flex-1">
        <TabList>
          {tabs1.map((tab, index) => (
            <Tab key={tab.key}>
              {tab.title}
              &nbsp;
              {index !== 0 && <button onClick={() => removeTab1(tab.key)}>x</button>}
            </Tab>
          ))}
        </TabList>
        {tabs1.map((tab) => (
          <TabPanel key={tab.key}>
            {tab.key === 'diagram' ? (
              pdfFile == null ? <></> : <Graph data={graphData} onNodeClick={handleNodeClick} />
            ) : (
              <div className="tab-panel">
                <h3>Tab Number: {tabs1.findIndex(t => t.key === tab.key)}</h3>
                <PDFReader pageNumber={tabPageNumbers1[tab.key]} />
              </div>
            )}
          </TabPanel>
        ))}
      </Tabs>

      <Tabs selectedIndex={activeTab2} onSelect={(tabIndex) => setActiveTab2(tabIndex)} className="flex-1">
        <TabList>
          {tabs2.map((tab, index) => (
            <Tab key={tab.key}>
              {tab.title}
              &nbsp;
              {index !== 0 && <button onClick={() => removeTab2(tab.key)}>x</button>}
            </Tab>
          ))}
        </TabList>
        {tabs2.map((tab) => (
          <TabPanel key={tab.key}>
            {tab.key === 'chat' ? (
              pdfFile == null ? <></> : <h1>Chat</h1> // 채팅 들어갈 자리
            ) : (
              <div className="tab-panel">
                <h3>Tab Number: {tabs2.findIndex(t => t.key === tab.key)}</h3>
                <PDFReader pageNumber={tabPageNumbers2[tab.key]} />
              </div>
            )}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

export default Page;
