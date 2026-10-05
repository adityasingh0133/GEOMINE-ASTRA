'use client'

import { Fragment, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Check,
  ChevronRight,
  Database,
  FileUp,
  Loader2,
  ScanText,
  Table2,
  Layers,
  Gauge,
  Search,
  Type,
  Upload,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { DocumentRecord } from '@/lib/data'
import { useAppState } from '@/lib/app-state'
import { cn } from '@/lib/utils'
import { ConfidenceValue, StatusBadge } from '@/components/common/indicators'
import { DocumentDrawer } from './document-drawer'
import { processDocumentFile } from '@/lib/document-processing'

const pipeline = [
  { label: 'Upload', icon: FileUp },
  { label: 'OCR', icon: ScanText },
  { label: 'Text Extraction', icon: Type },
  { label: 'Table Extraction', icon: Table2 },
  { label: 'Structure Recovery', icon: Layers },
  { label: 'Confidence Scoring', icon: Gauge },
  { label: 'Indexing', icon: Database },
]

const PROCESSING_STEP_DELAY = 120

const formats = ['PDF', 'Scanned PDF', 'CSV', 'XLSX', 'Images', 'Plain text']

type CorpusDocument = { name: string; content: string }

function createPdfFile(name: string, text: string) {
  const escapeText = (value: string) => value
    .replace(/[^\x20-\x7e]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
  const lines = text.split('\n')
  const pages = Array.from({ length: Math.ceil(lines.length / 42) }, (_, index) => lines.slice(index * 42, (index + 1) * 42))
  const fontObject = 3 + pages.length * 2
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  ]
  pages.forEach((pageLines, index) => {
    const pageObject = 3 + index * 2
    const contentObject = pageObject + 1
    const textOperators = pageLines
      .map((line) => `(${escapeText(line)}) Tj T*`)
      .join('\n')
    const stream = `BT\n/F1 9 Tf\n48 756 Td\n13 TL\n${textOperators}\nET`
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${contentObject} 0 R >>`)
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new File([pdf], name, { type: 'application/pdf' })
}

function createAdditionalCorpusBatch(batchNumber: number): CorpusDocument[] {
  const sites = [
    'Kestrel Reach Underground Mine',
    'Larkspur East Decline',
    'Bracken Vale Colliery',
    'Morrowfen West Mine',
    'Silver Fern No. 2 Mine',
    'North Kestrel Processing Lease',
    'Alder Basin Underground Works',
    'Redwillow Ridge Mine',
  ]
  const officers = ['R. Sen', 'M. Iyer', 'P. Malik', 'S. Roy', 'N. Das', 'D. Menon', 'A. Varma', 'T. Kulkarni']
  const risks = ['Moderate', 'High', 'Low', 'Elevated']
  const baseDate = new Date(2026, 9, 5 - ((batchNumber - 1) * 13))
  const dateFor = (offset: number) => {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + offset)
    return date
  }
  const longDate = (date: Date) => date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const shortDate = (date: Date) => date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '-')
  const year = baseDate.getFullYear()
  const site = sites[(batchNumber - 1) % sites.length]
  const inspector = officers[(batchNumber - 1) % officers.length]
  const reviewer = officers[batchNumber % officers.length]
  const suffix = String(batchNumber).padStart(4, '0')
  const reference = (kind: string, record: number) => `AVM-${kind}-${year}-${suffix}-${String(record).padStart(2, '0')}`
  const inspectionDate = dateFor(0)
  const environmentalDate = dateFor(-2)
  const ventilationDate = dateFor(-5)
  const auditDate = dateFor(-9)

  const waterObserved = 108 + ((batchNumber * 17) % 77)
  const waterLimit = 95 + (batchNumber % 16)
  const trainingCompletion = 72 + ((batchNumber * 9) % 26)
  const egressRoutes = 5 + (batchNumber % 4)
  const sulfateObserved = 184 + ((batchNumber * 23) % 57)
  const sulfateLimit = 190 + (batchNumber % 21)
  const airflow = (0.72 + ((batchNumber * 7) % 35) / 100).toFixed(2)
  const methane = (0.32 + ((batchNumber * 11) % 34) / 100).toFixed(2)
  const fanAvailability = 87 + ((batchNumber * 5) % 13)
  const ppeCompliance = 84 + ((batchNumber * 7) % 16)
  const incidentRate = (1.7 + ((batchNumber * 3) % 11) / 10).toFixed(1)
  const overdueActions = 1 + (batchNumber % 4)
  const inspectionRisk = risks[(batchNumber - 1) % risks.length]
  const ventilationRisk = risks[(batchNumber + 1) % risks.length]
  const environmentalStatus = waterObserved > waterLimit || sulfateObserved > sulfateLimit
    ? 'Conditional compliance'
    : 'Compliant with observations'
  const ventilationFinding = Number(airflow) < 0.9 || Number(methane) > 0.5
    ? 'One or more monitored ventilation values were outside the approved operating range.'
    : 'Monitored ventilation values remained within range; routine calibration follow-up is required.'
  const safetyRating = ppeCompliance < 95 || Number(incidentRate) > 2.0
    ? 'Improvement required'
    : 'Effective with actions'

  return [
    {
      name: `Mine_Safety_Inspection_Report_${reference('DMS', 1)}.pdf`,
      content: [
        'ASTER VALE MINING DIRECTORATE',
        'DIRECTORATE OF MINE SAFETY | FIELD INSPECTION REPORT',
        `Reference number: ${reference('DMS', 1)}`,
        `Mine site: ${site}`,
        `Inspection date: ${longDate(inspectionDate)}`,
        `Inspection team: ${inspector}, Divisional Inspector; ${reviewer}, Ventilation Officer`,
        'Scope: Ground control, water management, emergency egress and worker competency.',
        'SECTION 1 | ENVIRONMENTAL CONTROLS',
        `Mine water TSS observed: ${waterObserved} mg/L`,
        `Mine water TSS permit limit: ${waterLimit} mg/L`,
        `Outlet sampling rounds completed: ${2 + (batchNumber % 5)}`,
        'Inspector note: Outlet readings varied between sampling rounds; retain the field sheets with the close-out record.',
        'SECTION 2 | GROUND CONTROL AND SAFETY',
        `Roof support inspections overdue: ${1 + (batchNumber % 5)} panels`,
        `Safety training completion: ${trainingCompletion}%`,
        `Emergency egress inspection completed: ${egressRoutes} of 8 routes`,
        `Risk classification: ${inspectionRisk}`,
        `Finding 01: Water TSS ${waterObserved > waterLimit ? 'exceeded' : 'remained within'} the recorded permit limit during the inspection period.`,
        'Corrective action 01: Inspect the settling circuit and submit confirmatory samples.',
        `Action owner: ${site} Environmental Superintendent`,
        `Corrective action due date: ${longDate(dateFor(12 + (batchNumber % 10)))}`,
        `Inspector sign-off: ${inspector} | ${shortDate(inspectionDate)}`,
        `Site representative: ${reviewer} | Acknowledged ${shortDate(inspectionDate)}`,
      ].join('\n'),
    },
    {
      name: `Environmental_Compliance_Assessment_${reference('ENV', 2)}.pdf`,
      content: [
        'ASTER VALE MINING DIRECTORATE',
        'ENVIRONMENTAL COMPLIANCE ASSESSMENT | QUARTERLY RETURN',
        `Reference number: ${reference('ENV', 2)}`,
        `Reporting period: ${longDate(dateFor(-92))} to ${longDate(environmentalDate)}`,
        `Operating area: ${site} and adjacent lease boundary`,
        'Prepared by: Environmental Monitoring Unit',
        'SECTION 1 | WATER QUALITY REGISTER',
        `Mine water TSS observed: ${waterObserved - 7} mg/L`,
        `Mine water TSS permit limit: ${waterLimit} mg/L`,
        `Sulphate concentration measured: ${sulfateObserved} mg/L`,
        `Sulphate concentration standard: ${sulfateLimit} mg/L`,
        `Receiving water pH observed: ${(6.1 + (batchNumber % 13) / 10).toFixed(1)}`,
        'Receiving water pH minimum standard: 6.0',
        `Quarterly sampling rounds completed: ${3 + (batchNumber % 3)}`,
        `Permit inspection visits completed: ${7 + (batchNumber % 4)} of 10`,
        'SECTION 2 | OPEN CORRECTIVE ACTIONS',
        `Unresolved corrective actions: ${overdueActions}`,
        `Priority action: Recheck the ${batchNumber % 2 === 0 ? 'north' : 'south'} settling cell after maintenance.`,
        'Action owner: Environmental Monitoring Unit',
        `Target completion date: ${longDate(dateFor(18 + (batchNumber % 12)))}`,
        `Assessment status: ${environmentalStatus}`,
        `Reviewed by: ${reviewer}, Senior Environmental Officer`,
        `Authorised by: ${inspector}, Operations Compliance Manager`,
      ].join('\n'),
    },
    {
      name: `Ventilation_System_Inspection_Report_${reference('VENT', 3)}.pdf`,
      content: [
        'ASTER VALE MINING DIRECTORATE',
        'VENTILATION SYSTEM INSPECTION REPORT',
        `Reference number: ${reference('VENT', 3)}`,
        `Mine site: ${site}`,
        `Inspection date: ${longDate(ventilationDate)}`,
        `Inspection team: ${reviewer}, Ventilation Engineer; ${inspector}, Safety Officer`,
        'SECTION 1 | AIRFLOW AND GAS MONITORING',
        `District ${1 + (batchNumber % 6)} air velocity observed: ${airflow} m/s`,
        `District ${1 + (batchNumber % 6)} air velocity minimum standard: 0.90 m/s`,
        `Return airway methane observed: ${methane}%`,
        'Return airway methane maximum limit: 0.50%',
        `Main fan availability observed: ${fanAvailability}%`,
        'Main fan availability minimum standard: 95%',
        `Gas monitoring instrument calibration date: ${shortDate(dateFor(-7))}`,
        'SECTION 2 | FINDINGS AND ACTIONS',
        `Risk classification: ${ventilationRisk}`,
        `Finding 01: ${ventilationFinding}`,
        `Finding 02: Main fan availability was ${fanAvailability < 95 ? 'below' : 'within'} the approved minimum availability target.`,
        'Corrective action: Review fan-control logs and repeat district measurements under normal production load.',
        `Action owner: ${site} Mine Manager`,
        `Corrective action due date: ${longDate(dateFor(8 + (batchNumber % 8)))}`,
        `Engineer sign-off: ${reviewer} | ${shortDate(ventilationDate)}`,
        `Mine manager acknowledgement: ${inspector} | ${shortDate(ventilationDate)}`,
      ].join('\n'),
    },
    {
      name: `Safety_Management_Audit_Report_${reference('SMS', 4)}.pdf`,
      content: [
        'ASTER VALE MINING DIRECTORATE',
        'SAFETY MANAGEMENT SYSTEM AUDIT',
        `Reference number: ${reference('SMS', 4)}`,
        `Audit period: ${longDate(dateFor(-39))} to ${longDate(auditDate)}`,
        `Site: ${site}`,
        `Lead auditor: ${inspector}, Independent Systems Auditor`,
        'SECTION 1 | WORKFORCE CONTROLS',
        `Personal protective equipment compliance observed: ${ppeCompliance}%`,
        'Personal protective equipment compliance minimum standard: 95%',
        `Safety training completion: approx. ${trainingCompletion}? percent`,
        `Emergency drills completed: ${2 + (batchNumber % 5)}`,
        `Incident frequency observed: ${incidentRate} events per 200000 hours`,
        'Incident frequency maximum limit: 2.0 events per 200000 hours',
        'SECTION 2 | ASSURANCE AND CLOSE-OUT',
        `Equipment inspections overdue: ${1 + (batchNumber % 5)}`,
        `Unresolved corrective actions: ${overdueActions}`,
        `Recurring issue: Training records were incomplete in ${1 + (batchNumber % 3)} operating sections.`,
        'Required action: Reconcile training registers and verify contractor induction records.',
        'Action owner: Safety and Training Superintendent',
        `Due date: ${longDate(dateFor(21 + (batchNumber % 14)))}`,
        `Overall audit rating: ${safetyRating}`,
        `Auditor sign-off: ${inspector} | ${shortDate(auditDate)}`,
        `Management response: Accepted for tracked close-out | ${shortDate(dateFor(-6))}`,
      ].join('\n'),
    },
  ]
}

export function DocumentsWorkspace() {
  const {
    documents: docs,
    addDocuments,
    clearDocuments: resetDocuments,
    fields,
    finishDocumentUpload,
    failDocumentUpload,
  } = useAppState()
  const [selected, setSelected] = useState<DocumentRecord | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [stage, setStage] = useState<number>(-1)
  const [dragging, setDragging] = useState(false)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pipelineTimeouts = useRef<ReturnType<typeof setTimeout>[]>([])
  const processingRun = useRef(0)

  function runPipeline() {
    pipelineTimeouts.current.forEach(clearTimeout)
    pipelineTimeouts.current = []
    setStage(0)
    pipeline.forEach((_, i) => {
      pipelineTimeouts.current.push(setTimeout(() => setStage(i + 1), (i + 1) * PROCESSING_STEP_DELAY))
    })
    return new Promise<void>((resolve) => {
      pipelineTimeouts.current.push(setTimeout(resolve, pipeline.length * PROCESSING_STEP_DELAY + 80))
    })
  }

  async function ingest(files: File[], isDemo = false) {
    if (files.length === 0 || loadingRef.current) return
    const runId = ++processingRun.current
    loadingRef.current = true
    setLoading(true)
    const usedDocumentIds = new Set(docs.map((document) => document.id))
    const added: DocumentRecord[] = files.map((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      const format: DocumentRecord['format'] =
        ext === 'csv' ? 'CSV' : ext === 'xlsx' || ext === 'xls' ? 'XLSX' : ['png', 'jpg', 'jpeg', 'tif', 'tiff'].includes(ext) ? 'Image' : ext === 'txt' ? 'Text' : 'PDF'
      let id = `document-${crypto.randomUUID()}`
      while (usedDocumentIds.has(id)) id = `document-${crypto.randomUUID()}`
      usedDocumentIds.add(id)
      return {
        id,
        name: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
        fileName: file.name,
        type: format === 'CSV' || format === 'XLSX' ? 'Dataset' : 'Annual Report',
        format,
        source: isDemo ? 'Aster Vale Mining Directorate' : 'Uploaded document',
        pages: 0,
        tables: 0,
        fields: 0,
        ocr: 0,
        tableAccuracy: 0,
        confidence: 0,
        status: 'processing',
        uploaded: 'Just now',
        processingTime: '—',
        language: 'English',
        isDemo,
        content: '',
      }
    })
    addDocuments(added)
    toast.info(`${files.length} document${files.length > 1 ? 's' : ''} queued for ingestion`)
    const processing = Promise.allSettled(files.map((file, index) => (
      processDocumentFile(file, { isDemo, id: added[index].id })
    )))
    await runPipeline()
    const outcomes = await processing
    if (runId !== processingRun.current) return
    const completed = outcomes.flatMap((outcome) => outcome.status === 'fulfilled' ? [outcome.value] : [])
    const failedIds = outcomes.flatMap((outcome, index) => outcome.status === 'rejected' ? [added[index].id] : [])
    if (completed.length > 0) finishDocumentUpload(completed)
    if (failedIds.length > 0) failDocumentUpload(failedIds)
    const extractedCount = completed.reduce((count, result) => count + result.fields.length, 0)
    if (failedIds.length > 0) {
      const failure = outcomes.find((outcome) => outcome.status === 'rejected')
      toast.error(`${failedIds.length} document${failedIds.length > 1 ? 's' : ''} could not be processed`, {
        description: failure?.status === 'rejected'
          ? failure.reason instanceof Error ? failure.reason.message : String(failure.reason)
          : undefined,
      })
    }
    if (completed.length > 0) {
      toast.success(`Processed ${completed.length} document${completed.length > 1 ? 's' : ''}, ${extractedCount} field${extractedCount === 1 ? '' : 's'} extracted`)
    }
    if (completed.some((result) => result.fields.length === 0)) {
      toast.warning('Some files were added without extracted text. OCR and binary spreadsheet parsing are not configured.')
    }
    loadingRef.current = false
    setLoading(false)
  }

  function loadDemoCorpus() {
    const demoDocuments = [
      {
        name: 'Mine_Safety_Inspection_Report_18-08-2025.pdf',
        content: [
          'ASTER VALE MINING DIRECTORATE',
          'DIRECTORATE OF MINE SAFETY | FIELD INSPECTION REPORT',
          'Reference number: AVM-DMS-INS-2025-0818-04',
          'Mine site: Kestrel Reach Underground Mine',
          'Inspection date: 18 August 2025',
          'Inspection team: R. Sen, Divisional Inspector; M. Iyer, Ventilation Officer',
          'Scope: Ground control, water management, emergency egress and worker competency.',
          'SECTION 1 | ENVIRONMENTAL CONTROLS',
          'Mine water TSS observed: 142 mg/L',
          'Mine water TSS permit limit: 100 mg/L',
          'Outlet sampling rounds completed: 4',
          'Inspector note: Settling-cell outlet readings remain variable after the maintenance cycle; repeat sampling is required before closure.',
          'SECTION 2 | GROUND CONTROL AND SAFETY',
          'Roof support inspections overdue: approx. 3 panels',
          'Safety training completion: 78%',
          'Emergency egress inspection completed: 7 of 8 routes',
          'Risk classification: High',
          'Finding 01: Discharge suspended solids exceeded the consent condition during the inspection period.',
          'Corrective action 01: Inspect the settling circuit and submit two confirmatory samples.',
          'Action owner: Kestrel Reach Environmental Superintendent',
          'Corrective action due date: 29 August 2025',
          'Inspector sign-off: R. Sen | 18 August 2025',
          'Site representative: L. Varma | Acknowledged 18 August 2025',
        ].join('\n'),
      },
      {
        name: 'Environmental_Compliance_Assessment_Q1_2025.pdf',
        content: [
          'ASTER VALE MINING DIRECTORATE',
          'ENVIRONMENTAL COMPLIANCE ASSESSMENT | QUARTERLY RETURN',
          'Reference number: AVM-ENV-Q1-2025-117',
          'Reporting period: 01 January 2025 to 31 March 2025',
          'Operating area: Kestrel Reach and Larkspur East leases',
          'Prepared by: Environmental Monitoring Unit',
          'SECTION 1 | WATER QUALITY REGISTER',
          'Mine water TSS observed: 118 mg/L',
          'Mine water TSS permit limit: 100 mg/L',
          'Sulphate concentration measured: 214 mg/L',
          'Sulphate concentration standard: 200 mg/L',
          'Receiving water pH observed: 6.8',
          'Receiving water pH minimum standard: 6.0',
          'Quarterly sampling rounds completed: 4',
          'Permit inspection visits completed: 9 of 10',
          'SECTION 2 | OPEN CORRECTIVE ACTIONS',
          'Unresolved corrective actions: 2',
          'Priority action: Recheck the south settling cell after maintenance.',
          'Action owner: Environmental Monitoring Unit',
          'Target completion date: 15 April 2025',
          'Assessment status: Conditional compliance',
          'Reviewed by: N. Das, Senior Environmental Officer',
          'Authorised by: A. K. Rao, Operations Compliance Manager',
        ].join('\n'),
      },
      {
        name: 'Ventilation_System_Inspection_Report_07-06-2025.pdf',
        content: [
          'ASTER VALE MINING DIRECTORATE',
          'VENTILATION SYSTEM INSPECTION REPORT',
          'Reference number: AVM-VENT-2025-0607-22',
          'Mine site: Larkspur East Decline',
          'Inspection date: 07 June 2025',
          'Inspection team: P. Malik, Ventilation Engineer; S. Roy, Safety Officer',
          'SECTION 1 | AIRFLOW AND GAS MONITORING',
          'District 4 air velocity observed: 0.82 m/s',
          'District 4 air velocity minimum standard: 0.90 m/s',
          'Return airway methane observed: 0.72%',
          'Return airway methane maximum limit: 0.50%',
          'Main fan availability observed: 91%',
          'Main fan availability minimum standard: 95%',
          'Gas monitoring instrument calibration date: 03 June 2025',
          'SECTION 2 | FINDINGS AND ACTIONS',
          'Risk classification: High',
          'Finding 01: District 4 airflow was below the approved ventilation plan.',
          'Finding 02: Return airway methane exceeded the operating action limit.',
          'Corrective action: Restrict access pending regulator and fan-control checks.',
          'Action owner: Larkspur East Mine Manager',
          'Corrective action due date: 10 June 2025',
          'Engineer sign-off: P. Malik | 07 June 2025',
          'Mine manager acknowledgement: S. Roy | 07 June 2025',
        ].join('\n'),
      },
      {
        name: 'Safety_Management_Audit_Report_2025.pdf',
        content: [
          'ASTER VALE MINING DIRECTORATE',
          'SAFETY MANAGEMENT SYSTEM AUDIT',
          'Reference number: AVM-SMS-AUD-2025-014',
          'Audit period: 01 January 2025 to 31 January 2025',
          'Site: Kestrel Reach Underground Mine',
          'Lead auditor: D. Menon, Independent Systems Auditor',
          'SECTION 1 | WORKFORCE CONTROLS',
          'Personal protective equipment compliance observed: 88%',
          'Personal protective equipment compliance minimum standard: 95%',
          'Safety training completion: approx. 81? percent',
          'Emergency drills completed: 4',
          'Incident frequency observed: 2.4 events per 200000 hours',
          'Incident frequency maximum limit: 2.0 events per 200000 hours',
          'SECTION 2 | ASSURANCE AND CLOSE-OUT',
          'Equipment inspections overdue: 3',
          'Unresolved corrective actions: 2',
          'Recurring issue: Training records were incomplete in two operating sections.',
          'Required action: Reconcile training registers and verify contractor induction records.',
          'Action owner: Safety and Training Superintendent',
          'Due date: 14 February 2025',
          'Overall audit rating: Improvement required',
          'Auditor sign-off: D. Menon | 31 January 2025',
          'Management response: Accepted for tracked close-out | 03 February 2025',
        ].join('\n'),
      },
    ]
    const existingNames = new Set(docs.map((document) => document.fileName.toLowerCase()))
    const existingReferences = new Set(docs.flatMap((document) => {
      const reference = document.content.match(/^Reference number:\s*(.+)$/im)?.[1]
      return reference ? [reference.trim().toLowerCase()] : []
    }))
    let selectedBatch: CorpusDocument[] | undefined
    for (let batchNumber = 0; batchNumber <= docs.length; batchNumber += 1) {
      const candidate = batchNumber === 0 ? demoDocuments : createAdditionalCorpusBatch(batchNumber)
      const names = candidate.map(({ name }) => name.toLowerCase())
      const references = candidate.map(({ content }) => content.match(/^Reference number:\s*(.+)$/im)?.[1]?.trim().toLowerCase())
      const uniqueWithinBatch = new Set(names).size === candidate.length
        && references.every((reference) => Boolean(reference))
        && new Set(references).size === candidate.length
      const alreadyLoaded = names.some((name) => existingNames.has(name))
        || references.some((reference) => reference !== undefined && existingReferences.has(reference))
      if (uniqueWithinBatch && !alreadyLoaded) {
        selectedBatch = candidate
        break
      }
    }
    if (!selectedBatch) {
      toast.error('Could not find an unused corpus batch. Clear the document list and try again.')
      return
    }
    const files = selectedBatch.map(({ name, content }) => createPdfFile(name, content))
    void ingest(files, true)
  }

  function clearDocuments() {
    processingRun.current += 1
    pipelineTimeouts.current.forEach(clearTimeout)
    pipelineTimeouts.current = []
    resetDocuments()
    setSelected(null)
    setExpanded(null)
    setStage(-1)
    setFilter('')
    loadingRef.current = false
    setLoading(false)
    toast.info('Document list cleared', { description: 'You can add new documents whenever you are ready.' })
  }

  const visible = docs.filter((d) => d.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            ingest(Array.from(e.dataTransfer.files))
          }}
          className={cn(
            'grid-bg flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed bg-card/50 px-6 py-10 text-center transition-colors',
            dragging ? 'border-primary bg-primary/5' : 'border-border',
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <Upload className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium">Drag &amp; drop documents here</p>
            <p className="text-sm text-muted-foreground">Annual reports, parliamentary questions, statistical tables, scanned archives</p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {formats.map((f) => (
              <span key={f} className="rounded border border-border bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.tif,.tiff,.txt"
              className="sr-only"
              aria-label="Upload documents"
              onChange={(e) => {
                ingest(Array.from(e.target.files ?? []))
                e.target.value = ''
              }}
            />
            <Button className="h-9" disabled={loading} onClick={() => inputRef.current?.click()}>
              {loading ? <Loader2 className="animate-spin" /> : <Upload />} Upload Documents
            </Button>
            <Button className="h-9" variant="outline" disabled={loading} onClick={loadDemoCorpus}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Load Demo Corpus
            </Button>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Processing pipeline</h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              {stage === -1 ? 'Idle' : stage >= pipeline.length ? 'Complete' : `Stage ${stage + 1}/${pipeline.length}`}
            </span>
          </div>
          <ol className="mt-4 flex flex-1 flex-col gap-1.5">
            {pipeline.map((p, i) => {
              const done = stage > i
              const active = stage === i
              return (
                <li
                  key={p.label}
                  className={cn(
                    'flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors',
                    done ? 'border-success/25 bg-success/5' : active ? 'border-primary/40 bg-primary/10' : 'border-border bg-background/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded',
                      done ? 'text-success' : active ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {done ? <Check className="size-4" /> : active ? <Loader2 className="size-4 animate-spin" /> : <p.icon className="size-4" />}
                  </span>
                  <span className={cn(done || active ? 'text-foreground' : 'text-muted-foreground')}>{p.label}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card" aria-labelledby="corpus-title">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="corpus-title" className="text-sm font-semibold">Document corpus</h2>
            <p className="text-xs text-muted-foreground">Select a document to inspect metadata, preview and extracted fields</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter documents…"
                aria-label="Filter documents"
                className="h-8 w-full rounded-md border border-input bg-background/60 pl-8 pr-3 text-sm outline-none focus-visible:border-primary/60"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={docs.length === 0}
              onClick={clearDocuments}
            >
              Clear all
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8 pl-3" />
              <TableHead>Document</TableHead>
              <TableHead>Format</TableHead>
              <TableHead className="text-right">Pages</TableHead>
              <TableHead className="text-right">Tables</TableHead>
              <TableHead className="text-right">Fields</TableHead>
              <TableHead>Text Extract</TableHead>
              <TableHead>Table Acc.</TableHead>
              <TableHead>Overall</TableHead>
              <TableHead className="pr-5">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((d) => {
                  const isOpen = expanded === d.id
                  const docFields = fields.filter((f) => f.docId === d.id)
                  const processing = d.status === 'processing'
                  const unprocessed = processing || d.status === 'uploaded'
                  return (
                    <Fragment key={d.id}>
                      <TableRow className="cursor-pointer" onClick={() => setSelected(d)}>
                        <TableCell className="pl-3">
                          <button
                            type="button"
                            aria-label={isOpen ? 'Collapse details' : 'Expand details'}
                            aria-expanded={isOpen}
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpanded(isOpen ? null : d.id)
                            }}
                            className="flex size-6 items-center justify-center rounded hover:bg-muted"
                          >
                            <ChevronRight className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                          </button>
                        </TableCell>
                        <TableCell className="max-w-80">
                          <p className="truncate font-medium">{d.fileName}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{d.source}</p>
                        </TableCell>
                        <TableCell>
                          <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px]">{d.format}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{unprocessed ? '—' : d.pages}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{unprocessed ? '—' : d.tables}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{d.fields.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{processing ? <Skeleton className="h-3 w-10" /> : unprocessed ? '—' : <ConfidenceValue value={d.ocr} />}</TableCell>
                        <TableCell>{processing ? <Skeleton className="h-3 w-10" /> : unprocessed ? '—' : <ConfidenceValue value={d.tableAccuracy} />}</TableCell>
                        <TableCell>{processing ? <Skeleton className="h-3 w-10" /> : unprocessed ? '—' : <ConfidenceValue value={d.confidence} className="font-semibold" />}</TableCell>
                        <TableCell className="pr-5">
                          <StatusBadge status={d.status} />
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="bg-background/40 hover:bg-background/40">
                          <TableCell />
                          <TableCell colSpan={9} className="py-4 pr-5 whitespace-normal">
                            {docFields.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                {processing ? 'Extraction in progress…' : 'No key fields promoted yet from this document.'}
                              </p>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {docFields.map((f) => (
                                  <div key={f.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
                                    <div className="min-w-0">
                                      <p className="truncate text-xs text-muted-foreground">{f.field}</p>
                                      <p className="font-mono text-sm font-semibold">{f.value}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <ConfidenceValue value={f.confidence} />
                                      <span className="font-mono text-[10px] text-muted-foreground">p.{f.page}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                  {docs.length === 0 ? 'No documents in the corpus yet. Upload files to get started.' : `No documents match “${filter}”.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <DocumentDrawer doc={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  )
}
