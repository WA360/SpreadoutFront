import axios from "axios";

export interface Connection {
  id: number;
  source_page: number;
  target_page: number;
  similarity: number;
  pdf_file_id: number;
}

export interface DataResponse {
  url: string;
  connection: Connection[];
}

export const fetchPdf = async (): Promise<DataResponse> => {
  const response = await axios.get<DataResponse>(
    "http://3.38.176.179:4000/pdf?pdfId=20"
  );
  return response.data;
};
