"use client";

import { useRecoilState } from "recoil";
import { pdfFileState } from "../recoil/atoms";

const LeftAside = () => {
  const [pdfFile, setPdfFile] = useRecoilState(pdfFileState);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
    }
  };

  return (
    <aside className="flex flex-col w-80 shrink-0 border-r">
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <p>Left Aside Content</p>
    </aside>
  );
};

export default LeftAside;
