"use client";

import React from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useFormState } from "react-dom";
import { logIn } from "./actions";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";

export default function Login() {
  const [state, dispatch] = useFormState(logIn, null);

  return (
    <div className="flex flex-col gap-10 py-8 px-6">
      <div className="flex flex-col gap-2 *:font-medium">
        <h1 className="text-2xl">로그인</h1>
        <h2 className="text-xl">Log in with email and password.</h2>
      </div>
      <form action={dispatch} className="flex flex-col gap-3">
        <Input name="id" type="text" placeholder="id" required />
        <Input
          name="password"
          type="password"
          placeholder="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
        />
        <Button text="Log in" />
      </form>
    </div>
  );
}
