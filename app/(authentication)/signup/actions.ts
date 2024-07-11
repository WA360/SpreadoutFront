'use server';

import axios from 'axios';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
} from '@/lib/constants';
import { z } from 'zod';
import { redirect } from 'next/navigation';

const checkPassword = ({
  password,
  confirm_password,
}: {
  password: string;
  confirm_password: string;
}) => password === confirm_password;

export const checkDuplicateId = async (id: string) => {
  const res = await axios.get(
    `${process.env.API_URL!}users/signup/checkid?id=${id}`,
  );
  return !res.data.result;
};

const formSchema = z
  .object({
    id: z
      .string({
        invalid_type_error: '아이디는 문자열이어야 합니다!',
        required_error: '아이디를 입력해주세요.',
      })
      .toLowerCase()
      .trim()
      .min(4)
      .max(10),
    name: z.string().min(1, { message: '이름을 입력해주세요.' }),
    password: z
      .string({
        required_error: '비밀번호를 입력해주세요.',
      })
      .min(PASSWORD_MIN_LENGTH)
      .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
    confirm_password: z.string().min(PASSWORD_MIN_LENGTH),
  })
  .superRefine(async ({ id }, ctx) => {
    const isUnique = await checkDuplicateId(id);
    if (!isUnique) {
      ctx.addIssue({
        code: 'custom',
        message: '이미 사용 중인 아이디입니다.',
        path: ['id'],
        fatal: true,
      });
      return z.NEVER;
    }
  })
  .refine(checkPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirm_password'],
  });

export async function createAccount(prevState: any, formData: FormData) {
  const data = {
    id: formData.get('id'),
    name: formData.get('name'),
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
  };

  const result = await formSchema.spa(data);

  if (!result.success) {
    return result.error.flatten();
  } else {
    const res = await axios.post(`${process.env.API_URL!}users/signup`, {
      id: result.data.id,
      name: result.data.name,
      password: result.data.password,
    });

    if (res.status === 200) {
      redirect('/login');
    }
  }
}
