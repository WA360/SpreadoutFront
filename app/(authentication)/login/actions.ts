"use server";

import axios from "axios";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
} from "@/lib/constants";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
      process.env.API_URL! + "users/login",
      data
    );

    if (response.status === 200) {
      cookies().set("token", response.data.token);
      throw redirect("/");
    } else {
      throw new Error("Login failed");
    }
  }
}
