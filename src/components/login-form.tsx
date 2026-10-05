import { cn } from 'cn';

import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function LoginForm({ className, ...props }: React.ComponentProps<'form'>) {
  return (
    <form className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h1 className='text-2xl font-bold'>Login Portal Marketing</h1>
          <p className='text-sm text-balance text-muted-foreground'>
            Masukkan NIK dan Password untuk masuk ke portal marketing
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor='nik'>NIK</FieldLabel>
          <Input id='nik' type='text' placeholder='Masukkan NIK' required />
        </Field>
        <Field>
          <div className='flex items-center'>
            <FieldLabel htmlFor='password'>Password</FieldLabel>
            <a
              href='/forgot-password'
              className='ml-auto text-sm underline-offset-4 hover:underline'
            >
              Lupa Password?
            </a>
          </div>
          <Input id='password' type='password' placeholder='Masukkan Password' required />
        </Field>
        <Field>
          <Button type='submit'>Login</Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
