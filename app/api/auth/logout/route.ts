import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/server-auth'

export async function POST() {
  const response = NextResponse.json({ signedOut: true })
  response.cookies.delete(AUTH_COOKIE_NAME)
  return response
}
