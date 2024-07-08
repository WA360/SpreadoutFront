'use client';

import React, { useEffect, useState } from 'react';
import PDFReader from '@/components/PDFReader';
import Graph from '@/components/Graph/Graph';
import { pdfFileState } from '@/recoil/atoms';
import { useRecoilValue } from 'recoil';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

interface TabData {
  key: string;
  title: string;
}

const Page = () => {
  const [pageNumber, setPageNumber] = useState<number | null>(1);
  const pdfFile = useRecoilValue(pdfFileState);

  // tab 인터페이스 관련
  const [tabs1, setTabs1] = useState<TabData[]>([
    { key: 'diagram', title: 'Diagram' },
    { key: 'a', title: 'Tab 1' },
  ]);
  const [activeTab1, setActiveTab1] = useState<string>('a'); // 활성화된 탭 상태

  const [tabs2, setTabs2] = useState<TabData[]>([
    { key: 'chat', title: 'Chat' },
    { key: 'a', title: 'Tab 1' },
  ]);
  const [activeTab2, setActiveTab2] = useState<string>('a'); // 활성화된 탭 상태

  const addTab1 = () => {
    const newKey = `tab-${tabs1.length}`;
    setTabs1([...tabs1, { key: newKey, title: `Tab ${tabs1.length}` }]);
    setActiveTab1(newKey); // 새 탭을 활성화 상태로 설정
  };

  const addTab2 = () => {
    const newKey = `tab-${tabs2.length + 1}`;
    setTabs2([...tabs2, { key: newKey, title: `Tab ${tabs2.length}` }]);
    setActiveTab2(newKey); // 새 탭을 활성화 상태로 설정
  };

  const removeTab1 = (key: string) => {
    const newTabs = tabs1.filter((tab) => tab.key !== key);
    setTabs1(newTabs);
    if (activeTab1 === key && newTabs.length > 0) {
      setActiveTab1(newTabs[0].key);
    } else if (newTabs.length === 0) {
      setActiveTab1('');
    }
  };

  const removeTab2 = (key: string) => {
    const newTabs = tabs2.filter((tab) => tab.key !== key);
    setTabs2(newTabs);
    if (activeTab2 === key && newTabs.length > 0) {
      setActiveTab2(newTabs[0].key);
    } else if (newTabs.length === 0) {
      setActiveTab2('');
    }
  };

  const handleNodeClick = (pageNumber: number) => {
    setPageNumber(pageNumber); // 페이지 번호 업데이트
  };

  useEffect(() => {
    console.log('PDF file state changed:', pdfFile);
  }, [pdfFile]);

  return (
    <div className="flex">
      <Tabs
        selectedTabClassName="active-tab"
        onSelect={(tabIndex) => setActiveTab1(tabs1[tabIndex].key)}
        className="flex-1"
      >
        <TabList>
          {tabs1.map((tab, index) => (
            <Tab key={tab.key}>
              {tab.title}
              &nbsp;
              {index != 0 && (
                <button onClick={() => removeTab1(tab.key)}>x</button>
              )}
            </Tab>
          ))}
          <button onClick={addTab1}>new tab</button>
        </TabList>
        {tabs1.map((tab) => (
          <TabPanel key={tab.key}>
            {tab.key === 'diagram' ? (
              pdfFile == null ? (
                <></>
              ) : (
                <h1>Graph</h1>
              ) //<Graph onNodeClick={handleNodeClick} />
            ) : (
              <div className="tab-panel">
                <h3>Tab Number: {tabs1.findIndex((t) => t.key === tab.key)}</h3>
                <PDFReader pageNumber={pageNumber} />{' '}
              </div>
            )}
          </TabPanel>
        ))}
      </Tabs>

      <Tabs
        selectedTabClassName="active-tab"
        onSelect={(tabIndex) => setActiveTab2(tabs2[tabIndex].key)}
        className="flex-1"
      >
        <TabList>
          {tabs2.map((tab, index) => (
            <Tab key={tab.key}>
              {tab.title}
              &nbsp;
              {index != 0 && (
                <button onClick={() => removeTab2(tab.key)}>x</button>
              )}
            </Tab>
          ))}
          <button onClick={addTab2}>new tab</button>
        </TabList>
        {tabs2.map((tab) => (
          <TabPanel key={tab.key}>
            {tab.key === 'chat' ? (
              pdfFile == null ? (
                <></>
              ) : (
                <h1>Chat</h1>
              )
            ) : (
              <div className="tab-panel">
                <h3>Tab Number: {tabs2.findIndex((t) => t.key === tab.key)}</h3>
                <PDFReader pageNumber={pageNumber} />{' '}
              </div>
            )}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

export default Page;
