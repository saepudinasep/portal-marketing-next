'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { CameraIcon, CheckIcon, KeyRoundIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { changePassword, logoutAfterPasswordChange } from '@/actions/account';
import { currentProfile, currentUser } from '@/lib/current-user';
import { wait } from '@/lib/fake-api';

const MAX_PHOTO_MB = 2;

function Success({ children }: { children: React.ReactNode }) {
  return (
    <div
      role='status'
      className='flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm'
    >
      <CheckIcon className='size-4 shrink-0' />
      {children}
    </div>
  );
}

function ProfileCard() {
  const [saved, setSaved] = React.useState({
    name: currentProfile.name,
    phoneNumber: currentProfile.phoneNumber,
    address: currentProfile.address,
    photo: currentProfile.photo, // nama file (VARCHAR(100)), bukan binary
    photoUrl: '' as string, // hanya untuk preview di browser
  });
  const [form, setForm] = React.useState(saved);
  const [photoError, setPhotoError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);
  const urlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u)); // bersihkan preview saat halaman ditutup
  }, []);

  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setMessage('');
  };

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setPhotoError('Please choose an image file.');
    if (file.size > MAX_PHOTO_MB * 1024 * 1024)
      return setPhotoError(`Image must be at most ${MAX_PHOTO_MB} MB.`);
    setPhotoError('');
    const url = URL.createObjectURL(file);
    urlsRef.current.push(url);
    set({ photo: file.name.slice(0, 100), photoUrl: url });
  };

  const dirty =
    form.name !== saved.name ||
    form.phoneNumber !== saved.phoneNumber ||
    form.address !== saved.address ||
    form.photo !== saved.photo;
  const valid = form.name.trim() !== '' && form.phoneNumber !== '' && form.address.trim() !== '';
  const initials = form.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your photo and personal information</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex items-center gap-4'>
          <div className='relative'>
            <Avatar className='size-24 rounded-xl'>
              <AvatarImage
                src={form.photoUrl || currentUser.avatar}
                alt={form.name}
                className='rounded-xl'
              />
              <AvatarFallback className='rounded-xl text-xl'>{initials}</AvatarFallback>
            </Avatar>
            <Button
              size='icon-sm'
              variant='secondary'
              className='absolute -right-2 -bottom-2 rounded-full border'
              onClick={() => fileRef.current?.click()}
              aria-label='Change photo'
            >
              <CameraIcon />
            </Button>
            <input
              ref={fileRef}
              type='file'
              accept='image/*'
              className='sr-only'
              onChange={onPickPhoto}
              tabIndex={-1}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <span className='font-medium'>{form.name || '-'}</span>
            <Badge variant='outline' className='w-fit'>
              {currentUser.role}
            </Badge>
            {form.photo && (
              <span className='max-w-48 truncate text-xs text-muted-foreground'>{form.photo}</span>
            )}
          </div>
        </div>
        {photoError && <p className='text-xs text-destructive'>{photoError}</p>}

        <div className='flex flex-col gap-2'>
          <Label htmlFor='acc-id'>ID</Label>
          <Input id='acc-id' value={currentProfile.teacherId} disabled />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='acc-name'>Name</Label>
          <Input
            id='acc-name'
            maxLength={50}
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='acc-phone'>Phone Number</Label>
          <Input
            id='acc-phone'
            inputMode='numeric'
            maxLength={12}
            value={form.phoneNumber}
            onChange={(e) => set({ phoneNumber: e.target.value.replace(/\D/g, '') })}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='acc-address'>Address</Label>
          <Input
            id='acc-address'
            maxLength={100}
            value={form.address}
            onChange={(e) => set({ address: e.target.value })}
          />
        </div>
        {message && <Success>{message}</Success>}
      </CardContent>
      <CardFooter className='gap-2'>
        <Button
          disabled={!dirty || !valid || saving}
          onClick={async () => {
            setSaving(true);
            await wait(); // ganti dengan PATCH profil ke API
            setSaving(false);
            setSaved({ ...form, name: form.name.trim(), address: form.address.trim() });
            setForm((f) => ({ ...f, name: f.name.trim(), address: f.address.trim() }));
            setMessage('Profile updated.');
          }}
        >
          {saving && <Spinner />}
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant='outline'
          disabled={!dirty || saving}
          onClick={() => {
            setForm(saved);
            setPhotoError('');
            setMessage('');
          }}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}

function PasswordCard() {
  const [oldPw, setOldPw] = React.useState('');
  const [newPw, setNewPw] = React.useState('');
  const [confirmPw, setConfirmPw] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const type = show ? 'text' : 'password';
  const clear = () => {
    setError('');
    setMessage('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    let changed = false;
    try {
      const result = await changePassword({
        oldPassword: oldPw,
        newPassword: newPw,
        confirmPassword: confirmPw,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      changed = true;
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
      setMessage('Password changed. Signing you out, please log in with your new password...');
      await logoutAfterPasswordChange(); // mengalihkan ke /login
    } catch {
      // setelah sukses, error di sini hanyalah efek pengalihan halaman; abaikan
      if (!changed) setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <KeyRoundIcon className='size-4' />
          Change Password
        </CardTitle>
        <CardDescription>
          At least 8 characters with uppercase, lowercase, number and symbol
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='pw-old'>Old Password</Label>
          <Input
            id='pw-old'
            type={type}
            autoComplete='current-password'
            value={oldPw}
            onChange={(e) => {
              setOldPw(e.target.value);
              clear();
            }}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='pw-new'>New Password</Label>
          <Input
            id='pw-new'
            type={type}
            maxLength={72}
            autoComplete='new-password'
            value={newPw}
            onChange={(e) => {
              setNewPw(e.target.value);
              clear();
            }}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='pw-confirm'>Confirm Password</Label>
          <Input
            id='pw-confirm'
            type={type}
            maxLength={72}
            autoComplete='new-password'
            value={confirmPw}
            onChange={(e) => {
              setConfirmPw(e.target.value);
              clear();
            }}
          />
        </div>
        <div className='flex items-center gap-2'>
          <Checkbox id='pw-show' checked={show} onCheckedChange={(c) => setShow(c)} />
          <Label htmlFor='pw-show' className='font-normal'>
            Show passwords
          </Label>
        </div>
        {error && (
          <p role='alert' className='text-sm text-destructive'>
            {error}
          </p>
        )}
        {message && <Success>{message}</Success>}
      </CardContent>
      <CardFooter>
        <Button disabled={!oldPw || !newPw || !confirmPw || saving} onClick={save}>
          {saving && <Spinner />}
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function Account() {
  const { data: session } = useSession();
  const mustChange = session?.user.mustChangePassword;

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      {mustChange && (
        <div
          role='alert'
          className='rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm'
        >
          You are using a temporary password. Change it below to continue using the portal.
        </div>
      )}
      <div className='grid items-start gap-4 md:gap-6 lg:grid-cols-2'>
        <ProfileCard />
        <PasswordCard />
      </div>
    </div>
  );
}
