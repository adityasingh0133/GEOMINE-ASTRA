export type DocStatus = 'verified' | 'needs_review' | 'processing' | 'uploaded'
export type FieldStatus = 'verified' | 'needs_review' | 'rejected'

export type DocumentRecord = {
  id: string
  name: string
  fileName: string
  type: 'Annual Report' | 'Parliamentary Question' | 'Dataset' | 'Statistical Report' | 'Compliance Report'
  format: 'PDF' | 'Scanned PDF' | 'XLSX' | 'CSV' | 'Image' | 'Text'
  source: string
  pages: number
  tables: number
  fields: number
  ocr: number
  tableAccuracy: number
  confidence: number
  status: DocStatus
  uploaded: string
  processingTime: string
  language: string
  isDemo: boolean
  content: string
}

export const documents: DocumentRecord[] = []

export type ExtractedField = {
  id: string
  field: string
  value: string
  confidence: number
  ocr: number
  tableAccuracy: number
  docId: string
  docName: string
  docShort: string
  page: number
  method: string
  snippet: { before: string; match: string; after: string }
  reason?: string
  priority?: 'high' | 'normal'
}

export const extractedFields: ExtractedField[] = []

export const productionTrend: { year: string; production: number; dispatch: number }[] = []

export type Source = {
  docName: string
  page: number
  excerpt: { before: string; match: string; after: string }
  confidence: number
}

export type QueryAnswer = {
  key: string
  question: string
  answer: string
  confidence: number
  sources: Source[]
  fieldIds: string[]
  lowConfidence?: boolean
  showTrend?: boolean
  noEvidence?: boolean
}

export const suggestedQueries: string[] = []
export const queryAnswers: Record<string, QueryAnswer> = {}
export const recentQueries: { q: string; by: string; time: string; confidence: number; sources: number }[] = []
export const topics: { name: string; relevance: number; docs: number; trend: number; weight: number }[] = []
export const cloudWords: { text: string; weight: number; topic: string }[] = []
export const topicsByType: Record<string, Record<string, number>> = {}
export const confidenceDistribution: { bucket: string; fields: number }[] = []
export const docsOverTime: { day: string; docs: number }[] = []
export const verificationTrend: { day: string; approved: number; rejected: number; pending: number }[] = []
export const responseTimes: { run: string; seconds: number }[] = []

export function matchQuery(
  question: string,
  documents: DocumentRecord[],
  fields: ExtractedField[],
): QueryAnswer {
  const terms = question.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []
  const stopWords = new Set(['what', 'when', 'where', 'which', 'were', 'with', 'from', 'this', 'that', 'have', 'does', 'show', 'tell', 'about'])
  const keywords = terms.filter((term) => !stopWords.has(term))
  const rankedFields = fields
    .map((field) => {
      const source = documents.find((document) => document.id === field.docId)
      const fieldText = `${field.field} ${field.value} ${field.docName}`.toLowerCase()
      const fieldMatches = keywords.reduce((score, term) => score + (fieldText.includes(term) ? 1 : 0), 0)
      const documentText = source?.content.toLowerCase() ?? ''
      const documentMatches = keywords.reduce((score, term) => score + (documentText.includes(term) ? 1 : 0), 0)
      return { field, score: fieldMatches * 10 + documentMatches, fieldMatches, documentMatches }
    })
    .filter(({ fieldMatches, documentMatches }) => fieldMatches > 0 || documentMatches > 1)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
  const matches = rankedFields.map(({ field }) => field)
  const sources = matches.map((field) => ({
    docName: field.docName,
    page: field.page,
    excerpt: field.snippet,
    confidence: field.confidence,
  }))

  return {
    key: matches.length > 0 ? matches[0].id : 'no-evidence',
    question,
    answer: matches.length > 0
      ? matches.map((field) => `${field.field}: ${field.value}`).join('; ')
      : documents.length === 0
        ? 'No documents have been uploaded or indexed yet. Upload a document to search its contents.'
        : 'No extracted fields matching this question were found in the current document corpus.',
    confidence: matches.length > 0
      ? Math.round(matches.reduce((sum, field) => sum + field.confidence, 0) / matches.length)
      : 0,
    sources,
    fieldIds: matches.map((field) => field.id),
    noEvidence: matches.length === 0,
  }
}
