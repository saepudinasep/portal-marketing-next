'use client';
import * as React from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { login } from '@/actions/auth';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
export function LoginForm({
  className,
  callbackUrl = '/dashboard',
  devHint,
  ...props
}: React.ComponentProps<'form'> & { callbackUrl?: string; devHint?: string }) {
  const [error, formAction, pending] = React.useActionState(login, undefined);
  const [show, setShow] = React.useState(false);
  return (
    <form action={formAction} className={cn('flex flex-col gap-6', className)} {...props}>
      {' '}
      <FieldGroup>
        {' '}
        <div className='flex flex-col items-center gap-1 text-center'>
          {' '}
          <h1 className='text-2xl font-bold'>SMK Nusantara</h1>{' '}
          <p className='text-sm text-balance text-muted-foreground'>
            {' '}
            Masukkan Username dan Password untuk masuk ke Sistem Informasi Akademik SMK
            Nusantara.{' '}
          </p>{' '}
        </div>{' '}
        <input type='hidden' name='callbackUrl' value={callbackUrl} />{' '}
        <Field>
          {' '}
          <FieldLabel htmlFor='username'>Username</FieldLabel>{' '}
          <Input
            id='username'
            name='username'
            type='text'
            placeholder='Masukkan Username'
            autoComplete='username'
            autoFocus
            required
            maxLength={32}
          />{' '}
        </Field>{' '}
        <Field>
          {' '}
          <div className='flex items-center'>
            {' '}
            <FieldLabel htmlFor='password'>Password</FieldLabel>{' '}
            <a
              href='/forgot-password'
              className='ml-auto text-sm underline-offset-4 hover:underline'
            >
              {' '}
              Lupa Password?{' '}
            </a>{' '}
          </div>{' '}
          <div className='relative'>
            {' '}
            <Input
              id='password'
              name='password'
              type={show ? 'text' : 'password'}
              placeholder='Masukkan Password'
              autoComplete='current-password'
              required
              maxLength={72}
              className='pr-10'
            />{' '}
            <button
              type='button'
              onClick={() => setShow((prev) => !prev)}
              className='absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground'
              aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {' '}
              {show ? <EyeOffIcon className='size-4' /> : <EyeIcon className='size-4' />}{' '}
            </button>{' '}
          </div>{' '}
        </Field>{' '}
        {error && (
          <p role='alert' className='text-sm text-destructive'>
            {' '}
            {error}{' '}
          </p>
        )}{' '}
        <Field>
          {' '}
          <Button type='submit' disabled={pending}>
            {' '}
            {pending && <Spinner />} {pending ? 'Signing in...' : 'Login'}{' '}
          </Button>{' '}
        </Field>{' '}
        {devHint && <p className='text-center text-xs text-muted-foreground'> {devHint} </p>}{' '}
      </FieldGroup>{' '}
    </form>
  );
}
