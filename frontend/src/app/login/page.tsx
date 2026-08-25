'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError('');

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send code.');
        return;
      }

      // Pass email to verify page
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col h-full pt-12 pb-8">
      {/* Brand */}
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Inkto</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Handwriting & scans — typed in seconds.
        </p>
      </header>

      <div className="flex-1">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>

          {error && (
            <div className="p-3 text-sm font-medium bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-base"
            disabled={isPending || !email}
          >
            {isPending ? 'Sending code…' : 'Continue'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            No password needed — we'll send a 6-digit code.
          </p>
        </form>
      </div>
    </div>
  );
}
