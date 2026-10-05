import { createHmac, timingSafeEqual } from 'node:crypto'
import { demoAccounts, getDemoAccount } from './demo-accounts'

export const AUTH_COOKIE_NAME = 'geomine-astra-session'
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 24 * 7

const passwordEnvironmentKeys: Record<string, string> = {
  'admin@geomine-astra.demo': 'GEOMINE_ADMIN_PASSWORD',
  'inspector@geomine-astra.demo': 'GEOMINE_INSPECTOR_PASSWORD',
  'manager@geomine-astra.demo': 'GEOMINE_MANAGER_PASSWORD',
}

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthConfigurationError'
  }
}

function getSigningSecret() {
  const secret = process.env.GEOMINE_AUTH_SECRET
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new AuthConfigurationError('GEOMINE_AUTH_SECRET must contain at least 32 bytes.')
  }
  return secret
}

function sign(payload: string) {
  return createHmac('sha256', getSigningSecret()).update(payload).digest('base64url')
}

export function authenticateAccount(email: string, password: string) {
  const account = getDemoAccount(email)
  if (!account) return null

  const environmentKey = passwordEnvironmentKeys[account.email]
  const expectedPassword = process.env[environmentKey]
  if (!expectedPassword) {
    throw new AuthConfigurationError(`${environmentKey} is not configured.`)
  }

  const expected = createHmac('sha256', getSigningSecret()).update(expectedPassword).digest()
  const received = createHmac('sha256', getSigningSecret()).update(password).digest()
  return timingSafeEqual(expected, received) ? account : null
}

export function createAuthSession(email: string) {
  if (!demoAccounts.some((account) => account.email === email)) {
    throw new Error('Cannot create a session for an unknown account.')
  }
  const payload = Buffer.from(`${email}|${Date.now() + AUTH_SESSION_MAX_AGE * 1000}`).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function readAuthSession(token: string | undefined) {
  if (!token) return null
  const separator = token.lastIndexOf('.')
  if (separator <= 0) return null

  const payload = token.slice(0, separator)
  const suppliedSignature = token.slice(separator + 1)
  const expectedSignature = Buffer.from(sign(payload), 'base64url')
  const actualSignature = Buffer.from(suppliedSignature, 'base64url')
  if (
    actualSignature.length !== expectedSignature.length
    || !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null
  }

  const decoded = Buffer.from(payload, 'base64url').toString('utf8')
  const separatorIndex = decoded.lastIndexOf('|')
  if (separatorIndex <= 0) return null
  const email = decoded.slice(0, separatorIndex)
  const expiresAt = Number(decoded.slice(separatorIndex + 1))
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return null
  return getDemoAccount(email) ?? null
}
