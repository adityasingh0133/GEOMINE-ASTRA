import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, AuthConfigurationError, readAuthSession } from '@/lib/server-auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const account = readAuthSession(request.cookies.get(AUTH_COOKIE_NAME)?.value)
    if (!account) {
      const response = NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
      response.cookies.delete(AUTH_COOKIE_NAME)
      return response
    }
    return NextResponse.json({ email: account.email }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      console.error('Demo authentication is not configured.', error)
      return NextResponse.json({ error: 'Demo authentication is not configured on this server.' }, { status: 503 })
    }
    throw error
  }
}
