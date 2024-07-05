import axios from "axios";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
} from "@/lib/constants";
import { User } from "@/recoil/atoms";
import { z } from "zod";

interface LoginResponse {
  name: string;
  result: string;
  token: string;
}

const formSchema = z.object({
  id: z.string().min(1, "ID is required"),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH)
    .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
});

export async function logIn(prevState: any, formData: FormData) {
  const data = {
    id: formData.get("id"),
    password: formData.get("password"),
  };
  const result = await formSchema.spa(data);

  if (!result.success) {
    return result.error.flatten();
  } else {
    const response = await axios.post<LoginResponse>(
      "http://172.16.194.19:3000/users/login",
      data
    );

    if (response.status === 200) {
      document.cookie = `token=${response.data.token}`;
      return response.data;
    }
  }
}

export async function cookieTest(prevState: any, formData: FormData) {
  const response = await axios.get<any>("http://172.16.194.19:3000/users", {
    withCredentials: true,
  });

  console.log(response, "respon");
}

export async function cookieTest2(prevState: any, formData: FormData) {
  const response = await axios.get<any>("http://172.16.194.19:3000/users");

  console.log(response, "respon");
}
