'use client';

import React from 'react';
import { useFormState } from 'react-dom';
import { logout } from './action';
import Button from '../Button';

export default function LogoutButton() {
  const [, dispatch] = useFormState(logout, null);

  return (
    <form action={dispatch} className="flex flex-col gap-3">
      <Button text="Log Out" />
    </form>
  );
}
