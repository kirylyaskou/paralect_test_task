'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setServerError('')
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Client-side quick validation
    const errors: Record<string, string[]> = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = ['Please enter a valid email address']
    }
    if (!password || password.length < 6) {
      errors.password = ['Password must be at least 6 characters']
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        router.push('/')
        return
      }

      const data = await response.json()
      if (response.status === 400 && data.details?.fieldErrors) {
        setFieldErrors(data.details.fieldErrors)
      } else if (response.status === 409) {
        setServerError(
          'An account with this email already exists. Sign in instead?'
        )
      } else {
        setServerError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
    setIsLoading(false)
  }

  return (
    <Card className="ring-0 shadow-none sm:ring-1 sm:ring-foreground/10 sm:shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold leading-tight">
          Create an account
        </CardTitle>
        <CardDescription>
          Get started with your free account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p
                id="email-error"
                className="text-xs text-destructive"
              >
                {fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={
                fieldErrors.password ? 'password-error' : 'password-hint'
              }
              disabled={isLoading}
            />
            {fieldErrors.password ? (
              <p
                id="password-error"
                className="text-xs text-destructive"
              >
                {fieldErrors.password[0]}
              </p>
            ) : (
              <p id="password-hint" className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t-0 bg-transparent">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-muted-foreground hover:text-foreground hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
