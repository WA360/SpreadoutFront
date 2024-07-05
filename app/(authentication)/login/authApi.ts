import axios from "axios";
import { User } from "@/recoil/atoms";

interface LoginResponse {
  user: User;
  token: string;
}

export const loginUser = async (
  id: string,
  password: string
): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(
    "http://3.38.176.179:4000/users/login",
    {
      id: "test2",
      password: "123",
    }
  );
  return response.data;
};
