"use client";

import React, { useState } from "react";
import PDFReader from "@/components/PDFReader";
import Graph from "@/components/Graph/Graph";
import { pdfFileState } from "@/recoil/atoms";
import { useRecoilValue } from "recoil";

const Page = () => {
  const [pageNumber, setPageNumber] = useState<number | null>(1);
  const pdfFile = useRecoilValue(pdfFileState);

  const handleNodeClick = (pageNumber: number) => {
    setPageNumber(pageNumber); // 페이지 번호 업데이트
  };

  return (
    <div className="flex">
      {pdfFile == null ? <></> : <Graph onNodeClick={handleNodeClick} />}
      <PDFReader pageNumber={pageNumber} />{" "}
    </div>
  );
};

export default Page;
