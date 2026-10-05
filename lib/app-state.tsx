'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { type DocumentRecord, type ExtractedField, type FieldStatus, type QueryAnswer } from './data'
import { getDemoAccount } from './demo-accounts'

const ACCOUNT_STORAGE_PREFIX = 'geomine-account:'

type ResolvedField = ExtractedField & { status: FieldStatus; manual: boolean }
type QueryRecord = { id: string; answer: QueryAnswer; durationMs: number; createdAt: string }
type ReportRecord = { id: string; title: string; documentIds: string[]; createdAt: string }
type ProcessedDocument = { document: DocumentRecord; fields: ExtractedField[] }
type UserProfile = { name: string; email: string; department: string }
type Preferences = Record<string, boolean>
type AccountData = {
  documents: DocumentRecord[]
  extractedFields: ExtractedField[]
  overrides: Record<string, FieldStatus>
  queries: QueryRecord[]
  reports: ReportRecord[]
  threshold: number
  profilePicture: string | null
  profile: UserProfile
  preferences: Preferences
}
type ProfileChanges = { name: string; department: string }

type AppState = {
  ready: boolean
  accountEmail: string | null
  profile: UserProfile | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (changes: ProfileChanges) => void
  preferences: Preferences
  setPreference: (id: string, enabled: boolean) => void
  documents: DocumentRecord[]
  addDocuments: (documents: DocumentRecord[]) => void
  finishDocumentUpload: (processed: ProcessedDocument[]) => void
  failDocumentUpload: (ids: string[]) => void
  clearDocuments: () => void
  profilePicture: string | null
  setProfilePicture: (picture: string | null) => void
  threshold: number
  setThreshold: (v: number) => void
  fields: ResolvedField[]
  getStatus: (id: string) => FieldStatus
  setFieldStatus: (id: string, status: FieldStatus) => void
  reviewedToday: number
  pendingTotal: number
  queries: QueryRecord[]
  recordQuery: (answer: QueryAnswer, durationMs: number) => void
  reports: ReportRecord[]
  recordReport: (title: string, documentIds: string[]) => void
  reportsGenerated: number
  resetVersion: number
}

const AppStateContext = createContext<AppState | null>(null)

function accountStorageKey(email: string) {
  return `${ACCOUNT_STORAGE_PREFIX}${encodeURIComponent(email)}`
}

function createDefaultAccountData(email: string): AccountData {
  const account = getDemoAccount(email)
  if (!account) throw new Error('The requested account is not registered.')
  return {
    documents: [],
    extractedFields: [],
    overrides: {},
    queries: [],
    reports: [],
    threshold: 80,
    profilePicture: null,
    profile: {
      name: account.name,
      email: account.email,
      department: account.department,
    },
    preferences: {
      'block-reports': true,
      'n-queue': true,
      'n-pq': true,
      'n-ingest': false,
      audit: true,
      onprem: false,
    },
  }
}

function readAccountData(email: string): AccountData {
  const defaults = createDefaultAccountData(email)
  const raw = window.localStorage.getItem(accountStorageKey(email))
  if (!raw) return defaults

  try {
    const saved: unknown = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') throw new Error('Saved account data is not an object.')
    const data = saved as Partial<AccountData>
    const savedProfile = data.profile
    const validProfile = savedProfile
      && typeof savedProfile.name === 'string'
      && typeof savedProfile.department === 'string'
    const profile = validProfile
      ? { name: savedProfile.name, email, department: savedProfile.department }
      : defaults.profile
    return {
      documents: Array.isArray(data.documents) ? data.documents : defaults.documents,
      extractedFields: Array.isArray(data.extractedFields) ? data.extractedFields : defaults.extractedFields,
      overrides: data.overrides && typeof data.overrides === 'object' ? data.overrides : defaults.overrides,
      queries: Array.isArray(data.queries) ? data.queries : defaults.queries,
      reports: Array.isArray(data.reports) ? data.reports : defaults.reports,
      threshold: typeof data.threshold === 'number' ? data.threshold : defaults.threshold,
      profilePicture: typeof data.profilePicture === 'string' ? data.profilePicture : null,
      profile,
      preferences: data.preferences && typeof data.preferences === 'object'
        ? { ...defaults.preferences, ...data.preferences }
        : defaults.preferences,
    }
  } catch (error) {
    console.error(`Unable to load saved data for ${email}.`, error)
    toast.error('Saved account data could not be loaded.', {
      description: 'A fresh workspace has been opened for this account.',
    })
    return defaults
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPreferences] = useState<Preferences>({})
  const [threshold, setThreshold] = useState(80)
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([])
  const [overrides, setOverrides] = useState<Record<string, FieldStatus>>({})
  const [queries, setQueries] = useState<QueryRecord[]>([])
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [resetVersion, setResetVersion] = useState(0)
  const [profilePicture, setProfilePictureState] = useState<string | null>(null)

  const applyAccountData = useCallback((email: string, data: AccountData) => {
    setAccountEmail(email)
    setProfile(data.profile)
    setPreferences(data.preferences)
    setThreshold(data.threshold)
    setDocuments(data.documents.map((document) => (
      document.status === 'processing' ? { ...document, status: 'uploaded' } : document
    )))
    setExtractedFields(data.extractedFields)
    setOverrides(data.overrides)
    setQueries(data.queries)
    setReports(data.reports)
    setProfilePictureState(data.profilePicture)
    setResetVersion((version) => version + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    void fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status !== 401) throw new Error('Unable to verify the current sign-in.')
          return
        }

        const session: unknown = await response.json()
        if (!session || typeof session !== 'object' || typeof (session as { email?: unknown }).email !== 'string') {
          throw new Error('The server returned an invalid sign-in session.')
        }
        const email = (session as { email: string }).email
        if (!getDemoAccount(email)) throw new Error('The server returned an unrecognized account.')
        if (!cancelled) applyAccountData(email, readAccountData(email))
      })
      .catch((error: unknown) => {
        console.error('Unable to restore the saved account.', error)
        toast.error('The saved account could not be restored.', {
          description: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [applyAccountData])

  useEffect(() => {
    if (!ready || !accountEmail || !profile) return
    const data: AccountData = {
      documents,
      extractedFields,
      overrides,
      queries,
      reports,
      threshold,
      profilePicture,
      profile,
      preferences,
    }
    try {
      window.localStorage.setItem(accountStorageKey(accountEmail), JSON.stringify(data))
    } catch (error) {
      console.error(`Unable to save account data for ${accountEmail}.`, error)
      toast.error('Account data could not be saved in this browser.', {
        description: error instanceof Error ? error.message : String(error),
      })
    }
  }, [
    ready,
    accountEmail,
    profile,
    preferences,
    documents,
    extractedFields,
    overrides,
    queries,
    reports,
    threshold,
    profilePicture,
  ])

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const result: unknown = await response.json()
    if (!response.ok) {
      const message = result && typeof result === 'object' && typeof (result as { error?: unknown }).error === 'string'
        ? (result as { error: string }).error
        : 'Unable to sign in.'
      throw new Error(message)
    }
    if (!result || typeof result !== 'object' || typeof (result as { email?: unknown }).email !== 'string') {
      throw new Error('The server returned an invalid sign-in response.')
    }
    const authenticatedEmail = (result as { email: string }).email
    if (!getDemoAccount(authenticatedEmail)) throw new Error('The server returned an unrecognized account.')
    applyAccountData(authenticatedEmail, readAccountData(authenticatedEmail))
  }, [applyAccountData])

  const logout = useCallback(async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST' })
    if (!response.ok) throw new Error('The server could not end this session.')
    setAccountEmail(null)
    setProfile(null)
    setPreferences({})
    setThreshold(80)
    setDocuments([])
    setExtractedFields([])
    setOverrides({})
    setQueries([])
    setReports([])
    setProfilePictureState(null)
    setResetVersion((version) => version + 1)
  }, [])

  const updateProfile = useCallback((changes: ProfileChanges) => {
    setProfile((current) => current
      ? { ...current, name: changes.name, department: changes.department }
      : current)
  }, [])

  const setPreference = useCallback((id: string, enabled: boolean) => {
    setPreferences((current) => ({ ...current, [id]: enabled }))
  }, [])

  const setProfilePicture = useCallback((picture: string | null) => {
    setProfilePictureState(picture)
  }, [])

  const addDocuments = useCallback((added: DocumentRecord[]) => {
    setDocuments((current) => [...added, ...current])
  }, [])

  const finishDocumentUpload = useCallback((processed: ProcessedDocument[]) => {
    const ids = new Set(processed.map(({ document }) => document.id))
    setDocuments((current) => current.map((document) => (
      ids.has(document.id)
        ? processed.find(({ document: completed }) => completed.id === document.id)?.document ?? document
        : document
    )))
    setExtractedFields((current) => [
      ...processed.flatMap(({ fields }) => fields),
      ...current,
    ])
  }, [])

  const failDocumentUpload = useCallback((ids: string[]) => {
    const failed = new Set(ids)
    setDocuments((current) => current.map((document) => (
      failed.has(document.id) ? { ...document, status: 'uploaded' } : document
    )))
  }, [])

  const clearDocuments = useCallback(() => {
    setDocuments([])
    setExtractedFields([])
    setOverrides({})
    setQueries([])
    setReports([])
    setResetVersion((version) => version + 1)
  }, [])

  const fields = useMemo<ResolvedField[]>(
    () => extractedFields.map((field) => {
      const manual = overrides[field.id]
      return {
        ...field,
        status: manual ?? (field.confidence >= threshold ? 'verified' : 'needs_review'),
        manual: Boolean(manual),
      }
    }),
    [extractedFields, overrides, threshold],
  )

  const getStatus = useCallback(
    (id: string) => fields.find((field) => field.id === id)?.status ?? 'needs_review',
    [fields],
  )

  const setFieldStatus = useCallback((id: string, status: FieldStatus) => {
    if (!fields.some((field) => field.id === id)) return
    setOverrides((previous) => ({ ...previous, [id]: status }))
  }, [fields])

  const recordQuery = useCallback((answer: QueryAnswer, durationMs: number) => {
    setQueries((current) => [{
      id: `query-${crypto.randomUUID()}`,
      answer,
      durationMs,
      createdAt: new Date().toISOString(),
    }, ...current])
  }, [])

  const recordReport = useCallback((title: string, documentIds: string[]) => {
    setReports((current) => [{
      id: `report-${crypto.randomUUID()}`,
      title,
      documentIds,
      createdAt: new Date().toISOString(),
    }, ...current])
  }, [])

  const resolvedCount = Object.keys(overrides).length
  const currentReview = fields.filter((field) => field.status === 'needs_review').length

  const value: AppState = {
    ready,
    accountEmail,
    profile,
    login,
    logout,
    updateProfile,
    preferences,
    setPreference,
    documents,
    addDocuments,
    finishDocumentUpload,
    failDocumentUpload,
    clearDocuments,
    profilePicture,
    setProfilePicture,
    threshold,
    setThreshold,
    fields,
    getStatus,
    setFieldStatus,
    reviewedToday: resolvedCount,
    pendingTotal: currentReview,
    queries,
    recordQuery,
    reports,
    recordReport,
    reportsGenerated: reports.length,
    resetVersion,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}
