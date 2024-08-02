'use server';

import axios from 'axios';
import { PASSWORD_MIN_LENGTH, PASSWORD_REGEX, PASSWORD_REGEX_ERROR } from '@/lib/constants';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface LoginResponse {
  name: string;
  result: string;
  token: string;
}

const formSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  password: z.string().min(PASSWORD_MIN_LENGTH).regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
});

export async function logIn(prevState: any, formData: FormData) {
  const data = {
    id: formData.get('id') as string,
    password: formData.get('password') as string,
  };
  const result = await formSchema.safeParseAsync(data);

  if (!result.success) {
    return result.error.flatten();
  } else {
    try {
      const response = await axios.post<LoginResponse>(`${process.env.API_URL}users/login`, data);

      if (response.status === 200) {
        cookies().set('token', response.data.token);
      } else {
        return {
          formErrors: { general: response.data.result || 'Login failed' },
          fieldErrors: {},
        };
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          return {
            formErrors: {
              general: 'Invalid ID or password',
            },
            fieldErrors: {
              id: [`${error.response?.data.result}`],
              password: [`${error.response?.data.result}`],
            },
          };
        } else {
          return {
            formErrors: { general: 'An unexpected error occurred. Please try again later.' },
            fieldErrors: {},
          };
        }
      } else {
        return {
          formErrors: { general: 'An unexpected error occurred. Please try again later.' },
          fieldErrors: {},
        };
      }
    }
    redirect('/');
  }
}
