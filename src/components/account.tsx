'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { CameraIcon, CheckIcon, KeyRoundIcon, Trash2Icon } from 'lucide-react';

import {
  changePassword,
  logoutAfterPasswordChange,
  removePhoto,
  saveProfile,
} from '@/actions/account';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { uploadProfilePhoto } from '@/lib/cloudinary-upload';
import type { AccountProfile } from '@/lib/data/account';

const MAX_PHOTO_MB = 2;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

const roleLabel = { admin: 'Admin', teacher: 'Teacher', student: 'Student' } as const;
const idLabel = { admin: 'Username', teacher: 'Teacher ID', student: 'Student ID' } as const;

function ProfileCard({ profile }: { profile: AccountProfile }) {
  const { update } = useSession();
  const isAdmin = profile.role === 'admin';

  const [saved, setSaved] = React.useState({
    name: profile.name,
    phoneNumber: profile.phoneNumber,
    address: profile.address,
    email: profile.email,
    photo: profile.photo,
  });
  const [form, setForm] = React.useState(saved);
  const [pending, setPending] = React.useState<{ file: File; url: string } | null>(null);
  const [photoError, setPhotoError] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // bersihkan URL preview saat diganti atau halaman ditutup
  React.useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.url);
    };
  }, [pending]);

  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setMessage('');
    setError('');
  };

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type))
      return setPhotoError('Please choose a JPG, PNG or WebP image.');
    if (file.size > MAX_PHOTO_MB * 1024 * 1024)
      return setPhotoError(`Image must be at most ${MAX_PHOTO_MB} MB.`);
    setPhotoError('');
    setMessage('');
    setPending({ file, url: URL.createObjectURL(file) });
  };

  const dirty = isAdmin
    ? form.email !== saved.email || pending !== null
    : form.name !== saved.name ||
      form.phoneNumber !== saved.phoneNumber ||
      form.address !== saved.address ||
      pending !== null;
  const valid = isAdmin
    ? form.email === '' || form.email.includes('@')
    : form.name.trim() !== '' && form.phoneNumber !== '' && form.address.trim() !== '';

  const shownPhoto = pending?.url ?? form.photo ?? undefined;
  const initials =
    (isAdmin ? 'Admin' : form.name)
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const photo = pending ? await uploadProfilePhoto(pending.file) : undefined;
      const result = await saveProfile(
        isAdmin
          ? { email: form.email.trim(), ...(photo ? { photo } : {}) }
          : {
              name: form.name.trim(),
              phoneNumber: form.phoneNumber,
              address: form.address.trim(),
              ...(photo ? { photo } : {}),
            },
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await update(); // sesi dibaca ulang dari database: nama & foto di sidebar ikut berubah
      const next = {
        ...form,
        name: result.name,
        photo: result.photo,
        email: form.email.trim(),
        address: form.address.trim(),
      };
      setSaved(next);
      setForm(next);
      setPending(null);
      setMessage('Profile updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    setError('');
    try {
      const result = await removePhoto();
      if (!result.ok) {
        setError(result.error);
      } else {
        await update();
        setSaved((s) => ({ ...s, photo: null }));
        setForm((f) => ({ ...f, photo: null }));
        setPending(null);
        setMessage('Photo removed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setRemoving(false);
      setConfirmRemove(false);
    }
  };

  const hasPhoto = Boolean(form.photo) || pending !== null;

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
              <AvatarImage src={shownPhoto} alt={form.name} className='rounded-xl' />
              <AvatarFallback className='rounded-xl text-xl'>{initials}</AvatarFallback>
            </Avatar>
            {profile.photoEnabled && (
              <>
                <Button
                  size='icon-sm'
                  variant='secondary'
                  className='absolute -right-2 -bottom-2 rounded-full border'
                  onClick={() => fileRef.current?.click()}
                  disabled={saving || removing}
                  aria-label='Change photo'
                >
                  <CameraIcon />
                </Button>
                <input
                  ref={fileRef}
                  type='file'
                  accept={PHOTO_TYPES.join(',')}
                  className='sr-only'
                  onChange={onPickPhoto}
                  tabIndex={-1}
                />
              </>
            )}
          </div>
          <div className='flex flex-col gap-1'>
            <span className='font-medium'>{isAdmin ? 'Administrator' : form.name || '-'}</span>
            <Badge variant='outline' className='w-fit'>
              {roleLabel[profile.role]}
            </Badge>
            {profile.photoEnabled ? (
              <span className='text-xs text-muted-foreground'>
                JPG, PNG or WebP, max {MAX_PHOTO_MB} MB
              </span>
            ) : (
              <span className='text-xs text-muted-foreground'>Photo upload is not configured</span>
            )}
            {profile.photoEnabled && hasPhoto && !pending && (
              <Button
                variant='ghost'
                size='sm'
                className='-ml-2 h-7 w-fit text-destructive'
                disabled={saving || removing}
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2Icon />
                Remove photo
              </Button>
            )}
            {pending && (
              <span className='text-xs text-muted-foreground'>
                New photo selected. Press Save to upload.
              </span>
            )}
          </div>
        </div>
        {photoError && (
          <p role='alert' className='text-xs text-destructive'>
            {photoError}
          </p>
        )}

        <div className='flex flex-col gap-2'>
          <Label htmlFor='acc-id'>{idLabel[profile.role]}</Label>
          <Input id='acc-id' value={profile.code} disabled />
        </div>
        {isAdmin ? (
          <div className='flex flex-col gap-2'>
            <Label htmlFor='acc-email'>Email</Label>
            <Input
              id='acc-email'
              type='email'
              maxLength={100}
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </div>
        ) : (
          <>
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
                maxLength={profile.role === 'teacher' ? 100 : 150}
                value={form.address}
                onChange={(e) => set({ address: e.target.value })}
              />
            </div>
          </>
        )}
        {error && (
          <p role='alert' className='text-sm text-destructive'>
            {error}
          </p>
        )}
        {message && <Success>{message}</Success>}
      </CardContent>
      <CardFooter className='gap-2'>
        <Button disabled={!dirty || !valid || saving || removing} onClick={save}>
          {saving && <Spinner />}
          {saving ? (pending ? 'Uploading...' : 'Saving...') : 'Save'}
        </Button>
        <Button
          variant='outline'
          disabled={!dirty || saving || removing}
          onClick={() => {
            setForm(saved);
            setPending(null);
            setPhotoError('');
            setError('');
            setMessage('');
          }}
        >
          Cancel
        </Button>
      </CardFooter>

      <AlertDialog
        open={confirmRemove}
        onOpenChange={(open) => !removing && setConfirmRemove(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove profile photo?</AlertDialogTitle>
            <AlertDialogDescription>
              Your photo will be deleted permanently and replaced by your initials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant='outline' disabled={removing} onClick={() => setConfirmRemove(false)}>
              Cancel
            </Button>
            <Button variant='destructive' disabled={removing} onClick={remove}>
              {removing && <Spinner />}
              {removing ? 'Removing...' : 'Remove'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

export function Account({ profile }: { profile: AccountProfile }) {
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
        <ProfileCard profile={profile} />
        <PasswordCard />
      </div>
    </div>
  );
}
