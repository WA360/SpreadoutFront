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

const graph_data = {
  nodes: [
    {
      id: 1,
      level: 1,
    },
    {
      id: 20,
      level: 1,
    },
    {
      id: 38,
      level: 3,
    },
    {
      id: 56,
      level: 1,
    },
    {
      id: 89,
      level: 2,
    },
    {
      id: 97,
      level: 3,
    },
    {
      id: 101,
      level: 1,
    },
    {
      id: 120,
      level: 2,
    },
  ],
  links: [
    {
      source: 1,
      target: 20,
      value: 0.8175730082622867,
    },
    {
      source: 20,
      target: 38,
      value: 0.8736505396586434,
    },
    {
      source: 20,
      target: 120,
      value: 0.8201159179735522,
    },
    {
      source: 38,
      target: 89,
      value: 0.8029193163652873,
    },
    {
      source: 56,
      target: 97,
      value: 0.8442600976246891,
    },
    {
      source: 56,
      target: 101,
      value: 0.8303469875692099,
    },
  ],
};

const Page = () => {
  const pdfFile = useRecoilValue(pdfFileState);

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

  const handleNodeClick = (pageNumber: number) => {
    const newTabKey = `tab-${tabs1.length}`;
    setTabs1([...tabs1, { key: newTabKey, title: `Page ${pageNumber}` }]);
    setActiveTab1(tabs1.length);
    setTabPageNumbers1({ ...tabPageNumbers1, [newTabKey]: pageNumber });
  };

  useEffect(() => {
    console.log('PDF file state changed:', pdfFile);
  }, [pdfFile]);

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
              pdfFile == null ? (
                <></>
              ) : (
                <Graph data={graph_data} onNodeClick={handleNodeClick} />
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
        className="flex-1"
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
              pdfFile == null ? (
                <></>
              ) : (
                <h1>Chat</h1>
              ) // 채팅 들어갈 자리
            ) : (
              <div className="relative tab-panel h-full">
                <h3 className="absolute top-">
                  Tab Number: {tabs2.findIndex((t) => t.key === tab.key)}
                </h3>
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
