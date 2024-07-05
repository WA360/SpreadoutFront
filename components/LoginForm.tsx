"use client";

import React, { useState } from "react";
import { useSetRecoilState } from "recoil";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { authAtom } from "@/recoil/atoms";
import { loginUser } from "@/app/(authentication)/login/authApi";

interface LoginResponse {
  user: {
    id: string;
    email: string;
    // 필요한 다른 필드를 추가하세요.
  };
  token: string;
}

interface MyLoginResponse {
  user: {
    id: string;
    email: string;
    name?: string; // name 필드 추가
    // 필요한 다른 필드를 추가하세요.
  };
  token: string;
}

interface LoginVariables {
  email: string;
  password: string;
}

// Type adapter function
const adaptLoginResponse = (response: LoginResponse): MyLoginResponse => ({
  user: {
    id: String(response.user.id),
    email: response.user.email,
    // 다른 필드도 필요에 따라 변환합니다.
  },
  token: response.token,
});

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setAuth = useSetRecoilState(authAtom);

  const mutation = useMutation({
    mutationFn: async (variables: LoginVariables) => {
      const response = await loginUser(variables.email, variables.password);
      console.log(response, "test");
      return adaptLoginResponse(response);
    },
    onSuccess: (data: MyLoginResponse) => {
      console.log(data, "datasdfasdfasdfa");
      setAuth({
        isAuthenticated: true,
        user: {
          ...data.user,
          name: data.user.name || "",
        },
      });
    },
  }) as UseMutationResult<MyLoginResponse, unknown, LoginVariables, unknown>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">
        {mutation.isPending ? "Loading..." : "Login"}
      </button>
    </form>
  );
};

export default LoginForm;
