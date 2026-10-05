import type { DocumentRecord, ExtractedField } from './data'

type ProcessedDocument = {
  document: DocumentRecord
  fields: ExtractedField[]
}

function decodePdfText(source: string) {
  const literals: string[] = []
  const decodeLiteral = (value: string) => value
    .replace(/\\([nrtbf()\\])/g, (_, char: string) => ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' })[char] ?? char)
    .replace(/\\([0-7]{1,3})/g, (_, octal: string) => String.fromCharCode(Number.parseInt(octal, 8)))
  const textOperators = /(\(((?:\\.|[^\\)])*)\)\s*Tj)|(?:\[((?:\\.|[^\]])*)\]\s*TJ)/g
  let match: RegExpExecArray | null
  while ((match = textOperators.exec(source))) {
    const literal = match[2] ?? match[3]
    if (match[2] !== undefined) {
      literals.push(decodeLiteral(literal))
    } else {
      const arrayLiterals = /\(((?:\\.|[^\\)])*)\)/g
      let arrayMatch: RegExpExecArray | null
      while ((arrayMatch = arrayLiterals.exec(literal))) literals.push(decodeLiteral(arrayMatch[1]))
    }
  }
  return literals.join('\n')
}

async function readDocumentText(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'csv' || extension === 'txt') return file.text()
  if (extension === 'pdf') {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const source = new TextDecoder('latin1').decode(bytes)
    const streams: string[] = [source]
    if (typeof DecompressionStream !== 'undefined') {
      const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g
      let match: RegExpExecArray | null
      while ((match = streamPattern.exec(source))) {
        if (!/\/FlateDecode\b/.test(source.slice(Math.max(0, match.index - 160), match.index))) continue
        const contentOffset = match[0].indexOf(match[1])
        const start = match.index + contentOffset
        const compressed = bytes.slice(start, start + match[1].length)
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate'))
        streams.push(await new Response(stream).text())
      }
    }
    const decoded = streams.map(decodePdfText).filter(Boolean).join('\n')
    return decoded || source.replace(/[^\x20-\x7e\r\n\t]/g, ' ')
  }
  return ''
}

function parseDelimitedLine(line: string) {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && line[index + 1] === '"' && quoted) {
      cell += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += char
    }
  }
  cells.push(cell.trim())
  return cells
}

function parseRows(text: string, format: DocumentRecord['format']) {
  if (format === 'CSV') {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
    if (lines.length === 0) return []
    const headers = parseDelimitedLine(lines[0]).map((header) => header.toLowerCase())
    const valuesIndex = headers.findIndex((header) => ['value', 'result', 'amount'].includes(header))
    const keyIndex = headers.findIndex((header) => ['field', 'metric', 'name', 'parameter', 'particulars'].includes(header))
    if (keyIndex >= 0 && valuesIndex >= 0) {
      return lines.slice(1).flatMap((line) => {
        const cells = parseDelimitedLine(line)
        return cells[keyIndex] && cells[valuesIndex] ? [{
          field: cells[keyIndex],
          value: cells[valuesIndex],
          line,
          delimiter: ',',
        }] : []
      })
    }
    const observedIndex = headers.findIndex((header) => /^(observed|measured|actual)$/.test(header))
    const limitIndex = headers.findIndex((header) => /(limit|threshold|standard)$/.test(header))
    if (keyIndex >= 0 && observedIndex >= 0 && limitIndex >= 0) {
      return lines.slice(1).flatMap((line) => {
        const cells = parseDelimitedLine(line)
        const name = cells[keyIndex]
        if (!name) return []
        const unitIndex = headers.findIndex((header) => header === 'unit')
        const unit = unitIndex >= 0 && cells[unitIndex] ? ` ${cells[unitIndex]}` : ''
        return [
          { field: `${name} observed`, value: `${cells[observedIndex] ?? ''}${unit}`.trim(), line, delimiter: ',' },
          { field: `${name} limit`, value: `${cells[limitIndex] ?? ''}${unit}`.trim(), line, delimiter: ',' },
        ].filter((row) => row.value)
      })
    }
    if (headers.length > 1) {
      return lines.slice(1).flatMap((line) => {
        const cells = parseDelimitedLine(line)
        return headers.flatMap((header, index) => {
          const value = cells[index]
          return header && value ? [{ field: header, value, line, delimiter: ',' }] : []
        })
      })
    }
  }
  return text.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim().replace(/^[\s•*-]+/, '')
    if (trimmed.length < 5 || trimmed.startsWith('%PDF') || trimmed.startsWith('%%')) return []
    const delimiter = trimmed.includes(':') ? ':' : trimmed.includes('\t') ? '\t' : trimmed.includes(',') ? ',' : null
    if (!delimiter) return []
    const splitAt = trimmed.indexOf(delimiter)
    const field = trimmed.slice(0, splitAt).trim()
    const value = trimmed.slice(splitAt + 1).trim().replace(/^["']|["']$/g, '')
    if (!field || !value || field.length > 100 || value.length > 220) return []
    if (/^(field|metric|name|particulars|parameter)$/i.test(field)) return []
    return [{ field, value, line: trimmed, delimiter }]
  })
}

function confidenceFor(row: { value: string; line: string; delimiter: string }, format: DocumentRecord['format']) {
  const hasMeasuredValue = /\d/.test(row.value)
  const ambiguous = /[*?]|illegible|unclear|approx\.?/i.test(row.value)
  const longLine = row.line.length > 120
  const structuredSource = format === 'CSV' || row.delimiter === ':'
  return Math.max(52, Math.min(99, (structuredSource ? 94 : 84) + (hasMeasuredValue ? 3 : -6) - (ambiguous ? 18 : 0) - (longLine ? 8 : 0)))
}

function pageCount(text: string, format: DocumentRecord['format']) {
  if (format === 'PDF') {
    const pages = text.match(/\/Type\s*\/Page\b/g)?.length ?? 0
    return Math.max(pages, Math.ceil(text.length / 1800))
  }
  return text ? Math.max(1, Math.ceil(text.length / 1800)) : 0
}

function documentType(format: DocumentRecord['format'], name: string): DocumentRecord['type'] {
  if (format === 'CSV' || format === 'XLSX') return 'Dataset'
  if (/ventilation|statistical/i.test(name)) return 'Statistical Report'
  if (/safety|inspection|environment|compliance/i.test(name)) return 'Compliance Report'
  if (/question|parliament/i.test(name)) return 'Parliamentary Question'
  return 'Annual Report'
}

export async function processDocumentFile(
  file: File,
  options: { isDemo?: boolean; id?: string } = {},
): Promise<ProcessedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const format: DocumentRecord['format'] =
    extension === 'csv' ? 'CSV' :
    extension === 'xlsx' || extension === 'xls' ? 'XLSX' :
    ['png', 'jpg', 'jpeg', 'tif', 'tiff'].includes(extension) ? 'Image' :
    extension === 'txt' ? 'Text' : 'PDF'
  const id = options.id ?? `document-${crypto.randomUUID()}`
  const content = await readDocumentText(file)
  const rows = parseRows(content, format)
  const hasMeasurementTable = rows.some((row) => /\b(observed|measured|actual)\b/i.test(row.field))
    && rows.some((row) => /\b(limit|threshold|standard)\b/i.test(row.field))
  const now = new Date()
  const document: DocumentRecord = {
    id,
    name: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
    fileName: file.name,
    type: documentType(format, file.name),
    format,
    source: options.isDemo ? 'Aster Vale Mining Directorate' : 'Uploaded document',
    pages: pageCount(content, format),
    tables: (format === 'CSV' && rows.length > 0) || hasMeasurementTable ? 1 : 0,
    fields: rows.length,
    ocr: 0,
    tableAccuracy: 0,
    confidence: 0,
    status: rows.length > 0 ? 'needs_review' : 'uploaded',
    uploaded: now.toLocaleString(),
    processingTime: '—',
    language: 'English',
    isDemo: options.isDemo ?? false,
    content,
  }
  const fields = rows.map((row, index): ExtractedField => {
    const confidence = confidenceFor(row, format)
    const suspicious = /\b(observed|measured|actual|concentration|movement)\b/i.test(row.field)
    const lowConfidence = confidence < 80
    return {
      id: `${id}-field-${index + 1}`,
      field: row.field,
      value: row.value,
      confidence,
      ocr: confidence,
      tableAccuracy: confidence,
      docId: id,
      docName: document.name,
      docShort: document.name,
      page: Math.max(1, Math.ceil((content.indexOf(row.line) + 1) / 1800)),
      method: format === 'CSV' ? 'CSV row parsing' : 'Embedded text extraction',
      snippet: {
        before: `${row.field}: `,
        match: row.value,
        after: '',
      },
      reason: lowConfidence ? 'Low extraction confidence' : suspicious ? 'Measurement available for compliance review' : undefined,
      priority: lowConfidence || suspicious ? 'high' : 'normal',
    }
  })
  if (fields.length > 0) {
    const average = fields.reduce((total, field) => total + field.confidence, 0) / fields.length
    document.confidence = Math.round(average * 10) / 10
    document.ocr = Math.round(fields.reduce((total, field) => total + field.ocr, 0) / fields.length)
    document.tableAccuracy = Math.round(fields.reduce((total, field) => total + field.tableAccuracy, 0) / fields.length)
    document.status = fields.some((field) => field.confidence < 80) ? 'needs_review' : 'verified'
  } else {
    document.status = 'uploaded'
  }
  return { document, fields }
}

export type ComplianceFinding = {
  field: string
  observed: number
  limit: number
  unit: string
  riskScore: number
  docName: string
  page: number
}

export function deriveComplianceFindings(fields: ExtractedField[]): ComplianceFinding[] {
  const numericValue = (value: string) => {
    const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
    return match ? Number(match[0]) : null
  }
  const normalizedKey = (field: string) => field
    .toLowerCase()
    .replace(/\b(observed|measured|actual|permit|regulatory|action|target|limit|threshold|standard|maximum|min(?:imum)?)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  const limits = fields.filter((field) => /\b(limit|threshold|standard|maximum)\b/i.test(field.field))
  return fields.flatMap((field) => {
    if (!/\b(observed|measured|actual)\b/i.test(field.field)) return []
    const observed = numericValue(field.value)
    const limitField = limits.find((limit) => limit.docId === field.docId && normalizedKey(limit.field) === normalizedKey(field.field))
    const limit = limitField ? numericValue(limitField.value) : null
    const minimum = Boolean(limitField && /\b(min(?:imum)?|lower bound)\b/i.test(limitField.field))
    const isViolation = minimum ? observed !== null && limit !== null && observed < limit : observed !== null && limit !== null && observed > limit
    if (observed === null || limit === null || !isViolation || limit <= 0) return []
    const unit = field.value.match(/^-?\d+(?:\.\d+)?\s*(.*)$/)?.[1].trim().replace(/[.;,]+$/, '') ?? ''
    const riskScore = Math.min(100, Math.round((Math.abs(observed - limit) / limit) * 100 + 60))
    return [{
      field: field.field.replace(/\b(observed|measured|actual)\b/i, '').trim(),
      observed,
      limit,
      unit,
      riskScore,
      docName: field.docName,
      page: field.page,
    }]
  })
}
