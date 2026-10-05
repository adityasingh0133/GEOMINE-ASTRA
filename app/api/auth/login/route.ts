import { NextResponse } from 'next/server'
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE,
  AuthConfigurationError,
  authenticateAccount,
  createAuthSession,
} from '@/lib/server-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const { email, password } = body as { email?: unknown; password?: unknown }
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  try {
    const account = authenticateAccount(email, password)
    if (!account) {
      return NextResponse.json({ error: 'The email address or password is incorrect.' }, { status: 401 })
    }

    const response = NextResponse.json({ email: account.email })
    response.cookies.set(AUTH_COOKIE_NAME, createAuthSession(account.email), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: AUTH_SESSION_MAX_AGE,
    })
    return response
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      console.error('Demo authentication is not configured.', error)
      return NextResponse.json({ error: 'Demo authentication is not configured on this server.' }, { status: 503 })
    }
    throw error
  }
}
