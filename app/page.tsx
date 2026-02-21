'use client'

import React, { useState, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  HiMagnifyingGlass,
  HiBriefcase,
  HiBuildingOffice2,
  HiChevronDown,
  HiChevronUp,
  HiXMark,
  HiArrowTopRightOnSquare,
  HiStar,
  HiClock,
  HiPlus,
  HiUser,
  HiTag,
  HiFunnel,
} from 'react-icons/hi2'

// ---- Constants ----
const AGENT_ID = '6999596f938bc0103dbe0bec'

// ---- TypeScript Interfaces ----
interface RankedJob {
  job_title: string
  company_name: string
  match_score: number
  job_description_summary: string
  key_requirements: string[]
  match_reasoning: string
  application_url: string
  posted_date: string
}

interface JobSearchResponse {
  ranked_jobs: RankedJob[]
  total_found: number
  filtered_count: number
  companies_searched: string[]
  ranking_summary: string
}

interface FormData {
  currentCompany: string
  currentRole: string
  yearsOfExperience: string
  targetDomain: string
  targetRole: string
  skills: string[]
  targetCompanies: string[]
  appliedJobIds: string
}

// ---- Sample Data ----
const SAMPLE_FORM: FormData = {
  currentCompany: 'TechVista Inc.',
  currentRole: 'Product Manager',
  yearsOfExperience: '6',
  targetDomain: 'FinTech',
  targetRole: 'Senior Product Manager',
  skills: ['Product Strategy', 'Agile/Scrum', 'Data Analytics', 'Stakeholder Management', 'SQL', 'User Research'],
  targetCompanies: ['Stripe', 'Plaid', 'Robinhood'],
  appliedJobIds: 'JOB-2024-1234\nJOB-2024-5678',
}

const SAMPLE_RESULTS: JobSearchResponse = {
  ranked_jobs: [
    {
      job_title: 'Senior Product Manager, Payments Platform',
      company_name: 'Stripe',
      match_score: 94,
      job_description_summary: 'Lead the strategic direction of Stripe\'s core payments platform. Define product roadmap, work with engineering teams, and drive growth metrics for merchant-facing products.',
      key_requirements: ['5+ years PM experience', 'Payments/FinTech background', 'Data-driven decision making', 'Stakeholder management', 'SQL proficiency'],
      match_reasoning: 'Strong alignment with candidate\'s product management experience and FinTech domain interest. SQL and data analytics skills directly match requirements. Years of experience exceeds minimum threshold.',
      application_url: 'https://stripe.com/jobs/senior-pm-payments',
      posted_date: '2025-02-15',
    },
    {
      job_title: 'Product Manager, Risk & Compliance',
      company_name: 'Plaid',
      match_score: 87,
      job_description_summary: 'Own the product vision for Plaid\'s risk and compliance tools. Collaborate with cross-functional teams to build solutions that help financial institutions manage regulatory requirements.',
      key_requirements: ['4+ years PM experience', 'FinTech or banking experience', 'Regulatory knowledge preferred', 'Agile methodologies', 'Strong communication'],
      match_reasoning: 'Excellent match on PM experience and Agile/Scrum skills. FinTech domain aligns perfectly. Stakeholder management experience is a strong plus. Slight gap in regulatory domain knowledge.',
      application_url: 'https://plaid.com/careers/pm-risk',
      posted_date: '2025-02-10',
    },
    {
      job_title: 'Senior Product Manager, Brokerage',
      company_name: 'Robinhood',
      match_score: 82,
      job_description_summary: 'Drive product strategy for Robinhood\'s brokerage platform. Focus on user acquisition, engagement, and retention through data-informed product decisions.',
      key_requirements: ['6+ years PM experience', 'Consumer product experience', 'Growth metrics expertise', 'A/B testing', 'User research skills'],
      match_reasoning: 'Good match on years of experience and user research skills. Consumer product focus aligns with candidate profile. Some gap in specific brokerage/trading domain knowledge.',
      application_url: 'https://robinhood.com/careers/sr-pm-brokerage',
      posted_date: '2025-02-12',
    },
    {
      job_title: 'Product Manager, Data Infrastructure',
      company_name: 'Square',
      match_score: 71,
      job_description_summary: 'Lead the data infrastructure product team at Square. Build scalable data pipelines and analytics platforms that power merchant insights and internal decision-making.',
      key_requirements: ['4+ years PM experience', 'Technical background', 'Data engineering knowledge', 'SQL expertise', 'API design experience'],
      match_reasoning: 'Moderate match. SQL skills align well, but the role requires deeper technical/data engineering background. FinTech domain is a plus but the infrastructure focus is a departure from candidate\'s product strategy background.',
      application_url: 'https://squareup.com/careers/pm-data',
      posted_date: '2025-02-08',
    },
    {
      job_title: 'Associate Product Manager, Lending',
      company_name: 'SoFi',
      match_score: 55,
      job_description_summary: 'Support the lending product team in defining features for personal loan and refinance products. Assist in market research, requirements gathering, and sprint planning.',
      key_requirements: ['2+ years PM experience', 'Financial services interest', 'Basic SQL', 'Communication skills', 'Attention to detail'],
      match_reasoning: 'FinTech domain matches, but this is a more junior role than candidate\'s current level. The Associate PM title represents a step down from current Product Manager role. Skills match but experience level is overqualified.',
      application_url: 'https://sofi.com/careers/apm-lending',
      posted_date: '2025-02-05',
    },
  ],
  total_found: 23,
  filtered_count: 2,
  companies_searched: ['Stripe', 'Plaid', 'Robinhood', 'Square', 'SoFi', 'Affirm', 'Brex', 'Chime'],
  ranking_summary: 'Found 23 matching positions across 8 FinTech companies. 2 previously applied positions were filtered out. Top matches are concentrated at Stripe and Plaid, which closely align with your product management experience and FinTech domain focus. Your SQL and data analytics skills are highly sought after in this space.',
}

// ---- Error Boundary ----
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ---- Markdown Renderer ----
function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// ---- Tag Input Component ----
function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  id,
}: {
  tags: string[]
  onAdd: (tag: string) => void
  onRemove: (index: number) => void
  placeholder: string
  id: string
}) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = inputValue.trim()
      if (trimmed && !tags.includes(trimmed)) {
        onAdd(trimmed)
        setInputValue('')
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-[hsl(160,22%,20%)] border-border"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            const trimmed = inputValue.trim()
            if (trimmed && !tags.includes(trimmed)) {
              onAdd(trimmed)
              setInputValue('')
            }
          }}
          className="shrink-0 border-border hover:bg-secondary"
        >
          <HiPlus className="h-4 w-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge
              key={`${tag}-${index}`}
              variant="secondary"
              className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
              >
                <HiXMark className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Match Score Badge ----
function MatchScoreBadge({ score }: { score: number }) {
  const safeScore = typeof score === 'number' ? score : 0
  let bgClass = 'bg-red-900/60 text-red-300 border-red-700/50'
  if (safeScore >= 80) {
    bgClass = 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
  } else if (safeScore >= 60) {
    bgClass = 'bg-amber-900/60 text-amber-300 border-amber-700/50'
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${bgClass}`}>
      <HiStar className="h-4 w-4" />
      {safeScore}%
    </div>
  )
}

// ---- Job Result Card ----
function JobResultCard({ job }: { job: RankedJob }) {
  const [expanded, setExpanded] = useState(false)

  const title = job?.job_title ?? 'Untitled Position'
  const company = job?.company_name ?? 'Unknown Company'
  const score = typeof job?.match_score === 'number' ? job.match_score : 0
  const summary = job?.job_description_summary ?? ''
  const requirements = Array.isArray(job?.key_requirements) ? job.key_requirements : []
  const reasoning = job?.match_reasoning ?? ''
  const url = job?.application_url ?? ''
  const postedDate = job?.posted_date ?? ''

  return (
    <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground tracking-tight leading-snug">{title}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <HiBuildingOffice2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">{company}</span>
              {postedDate && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <HiClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">{postedDate}</span>
                </>
              )}
            </div>
          </div>
          <MatchScoreBadge score={score} />
        </div>

        {summary && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3">{summary}</p>
        )}

        {requirements.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {requirements.map((req, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5 font-normal">
                {req}
              </Badge>
            ))}
          </div>
        )}

        {reasoning && (
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-[hsl(160,70%,40%)] hover:text-[hsl(160,70%,50%)] transition-colors mb-2 cursor-pointer">
              {expanded ? <HiChevronUp className="h-3.5 w-3.5" /> : <HiChevronDown className="h-3.5 w-3.5" />}
              {expanded ? 'Hide' : 'Show'} Match Reasoning
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-secondary/50 rounded-lg p-3 border border-border text-sm text-muted-foreground leading-relaxed">
                {renderMarkdown(reasoning)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {url && (
          <div className="mt-3 pt-3 border-t border-border">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(160,70%,40%)] text-[hsl(160,20%,98%)] text-sm font-semibold hover:bg-[hsl(160,70%,45%)] transition-colors"
            >
              Apply Now
              <HiArrowTopRightOnSquare className="h-4 w-4" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---- Loading Skeletons ----
function LoadingSkeletons({ domain }: { domain: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-5 w-5 border-2 border-[hsl(160,70%,40%)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">
          Scanning career sites{domain ? ` across ${domain}` : ''}...
        </p>
      </div>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="bg-card border-border">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---- Empty State ----
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-5">
        <HiBriefcase className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">Discover Your Next Role</h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        Enter your profile details on the left and click Find Matching Jobs to discover opportunities tailored to your experience.
      </p>
    </div>
  )
}

// ---- Agent Status Panel ----
function AgentStatusPanel({ activeAgentId, hasResults }: { activeAgentId: string | null; hasResults: boolean }) {
  const agents = [
    { id: '6999596f938bc0103dbe0bec', name: 'Job Search Coordinator', role: 'Orchestrates discovery and ranking workflow' },
    { id: '6999595d7929f75fa2684e9f', name: 'Company & Job Discovery', role: 'Searches career sites for matching positions' },
    { id: '6999595d37b6d94b64a41ba5', name: 'Job Match & Ranking', role: 'Scores and ranks jobs against your profile' },
  ]

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <HiFunnel className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent Pipeline</span>
        </div>
        <div className="space-y-2">
          {agents.map((agent) => {
            const isActive = activeAgentId === agent.id
            return (
              <div
                key={agent.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${isActive ? 'bg-[hsl(160,70%,40%)]/10 border border-[hsl(160,70%,40%)]/30' : 'bg-secondary/30'}`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-[hsl(160,70%,40%)] animate-pulse' : hasResults ? 'bg-emerald-600' : 'bg-muted-foreground/30'}`} />
                <div className="min-w-0">
                  <p className={`font-medium truncate ${isActive ? 'text-[hsl(160,70%,40%)]' : 'text-foreground/80'}`}>{agent.name}</p>
                  <p className="text-muted-foreground/70 truncate">{agent.role}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Main Page ----
export default function Page() {
  const [formData, setFormData] = useState<FormData>({
    currentCompany: '',
    currentRole: '',
    yearsOfExperience: '',
    targetDomain: '',
    targetRole: '',
    skills: [],
    targetCompanies: [],
    appliedJobIds: '',
  })

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<JobSearchResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>('best_match')
  const [optionalOpen, setOptionalOpen] = useState(false)
  const [showSample, setShowSample] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  const displayForm = showSample && !results ? SAMPLE_FORM : formData
  const displayResults = showSample && !results ? SAMPLE_RESULTS : results

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const addSkill = useCallback((skill: string) => {
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, skill] }))
  }, [])

  const removeSkill = useCallback((index: number) => {
    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }))
  }, [])

  const addCompany = useCallback((company: string) => {
    setFormData((prev) => ({ ...prev, targetCompanies: [...prev.targetCompanies, company] }))
  }, [])

  const removeCompany = useCallback((index: number) => {
    setFormData((prev) => ({ ...prev, targetCompanies: prev.targetCompanies.filter((_, i) => i !== index) }))
  }, [])

  const handleSearch = useCallback(async () => {
    const activeForm = showSample && !results ? SAMPLE_FORM : formData
    if (!activeForm.targetRole.trim() && !activeForm.targetDomain.trim()) {
      setErrorMsg('Please enter at least a Target Role or Target Domain.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setResults(null)
    setActiveAgentId(AGENT_ID)

    const message = `
Find matching jobs for the following profile:

Current Company: ${activeForm.currentCompany || 'Not specified'}
Current Role: ${activeForm.currentRole || 'Not specified'}
Years of Experience: ${activeForm.yearsOfExperience || 'Not specified'}
Target Domain: ${activeForm.targetDomain || 'Not specified'}
Target Job Role: ${activeForm.targetRole || 'Not specified'}
Skills/Requirements: ${activeForm.skills.length > 0 ? activeForm.skills.join(', ') : 'Not specified'}
${activeForm.targetCompanies.length > 0 ? `Target Companies: ${activeForm.targetCompanies.join(', ')}` : ''}
${activeForm.appliedJobIds.trim() ? `Previously Applied Job IDs to exclude: ${activeForm.appliedJobIds}` : ''}

Please search for matching job openings, evaluate them against this profile, and return a ranked list with match scores.
`.trim()

    try {
      const result = await callAIAgent(message, AGENT_ID)

      if (result.success) {
        let data = result?.response?.result as any

        if (typeof data === 'string') {
          try {
            data = JSON.parse(data)
          } catch {
            const jsonMatch = data.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              try {
                data = JSON.parse(jsonMatch[0])
              } catch {
                // fallback
              }
            }
          }
        }

        const parsed: JobSearchResponse = {
          ranked_jobs: Array.isArray(data?.ranked_jobs) ? data.ranked_jobs : [],
          total_found: typeof data?.total_found === 'number' ? data.total_found : 0,
          filtered_count: typeof data?.filtered_count === 'number' ? data.filtered_count : 0,
          companies_searched: Array.isArray(data?.companies_searched) ? data.companies_searched : [],
          ranking_summary: data?.ranking_summary ?? '',
        }

        if (parsed.ranked_jobs.length === 0 && typeof data === 'object' && data !== null) {
          const text = data?.text ?? data?.message ?? data?.response ?? ''
          if (typeof text === 'string' && text.length > 0) {
            const innerJsonMatch = text.match(/\{[\s\S]*\}/)
            if (innerJsonMatch) {
              try {
                const innerData = JSON.parse(innerJsonMatch[0])
                parsed.ranked_jobs = Array.isArray(innerData?.ranked_jobs) ? innerData.ranked_jobs : []
                parsed.total_found = typeof innerData?.total_found === 'number' ? innerData.total_found : parsed.total_found
                parsed.filtered_count = typeof innerData?.filtered_count === 'number' ? innerData.filtered_count : parsed.filtered_count
                parsed.companies_searched = Array.isArray(innerData?.companies_searched) ? innerData.companies_searched : parsed.companies_searched
                parsed.ranking_summary = innerData?.ranking_summary ?? parsed.ranking_summary
              } catch {
                // fallback
              }
            }
          }
        }

        setResults(parsed)
        setShowSample(false)
      } else {
        setErrorMsg(result?.error ?? result?.response?.message ?? 'An error occurred while searching for jobs. Please try again.')
      }
    } catch (err) {
      setErrorMsg('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [formData, showSample, results])

  const sortedJobs = React.useMemo(() => {
    const jobs = Array.isArray(displayResults?.ranked_jobs) ? [...displayResults.ranked_jobs] : []
    if (sortBy === 'most_recent') {
      return jobs.sort((a, b) => {
        const dateA = a?.posted_date ?? ''
        const dateB = b?.posted_date ?? ''
        return dateB.localeCompare(dateA)
      })
    }
    return jobs.sort((a, b) => {
      const scoreA = typeof a?.match_score === 'number' ? a.match_score : 0
      const scoreB = typeof b?.match_score === 'number' ? b.match_score : 0
      return scoreB - scoreA
    })
  }, [displayResults, sortBy])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[hsl(160,70%,40%)] flex items-center justify-center">
                <HiBriefcase className="h-4.5 w-4.5 text-[hsl(160,20%,98%)]" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">JobMatch Scout</h1>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">
                Sample Data
              </Label>
              <Switch
                id="sample-toggle"
                checked={showSample}
                onCheckedChange={(checked) => {
                  setShowSample(checked)
                  if (!checked) {
                    // keep results if they exist
                  }
                }}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Panel — Input Form */}
            <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 space-y-4">
              {/* Profile Section */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <HiUser className="h-4 w-4 text-[hsl(160,70%,40%)]" />
                    <CardTitle className="text-sm font-semibold tracking-tight">Your Profile</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentCompany" className="text-xs text-muted-foreground">
                      Current Company
                    </Label>
                    <Input
                      id="currentCompany"
                      placeholder="e.g., Acme Corp"
                      value={showSample && !results ? displayForm.currentCompany : formData.currentCompany}
                      onChange={(e) => updateField('currentCompany', e.target.value)}
                      className="bg-[hsl(160,22%,20%)] border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currentRole" className="text-xs text-muted-foreground">
                      Current Role
                    </Label>
                    <Input
                      id="currentRole"
                      placeholder="e.g., Software Engineer"
                      value={showSample && !results ? displayForm.currentRole : formData.currentRole}
                      onChange={(e) => updateField('currentRole', e.target.value)}
                      className="bg-[hsl(160,22%,20%)] border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="yearsOfExperience" className="text-xs text-muted-foreground">
                      Years of Experience
                    </Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="e.g., 5"
                      value={showSample && !results ? displayForm.yearsOfExperience : formData.yearsOfExperience}
                      onChange={(e) => updateField('yearsOfExperience', e.target.value)}
                      className="bg-[hsl(160,22%,20%)] border-border"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Target Section */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <HiMagnifyingGlass className="h-4 w-4 text-[hsl(160,70%,40%)]" />
                    <CardTitle className="text-sm font-semibold tracking-tight">Target Position</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="targetDomain" className="text-xs text-muted-foreground">
                      Target Domain
                    </Label>
                    <Input
                      id="targetDomain"
                      placeholder="e.g., FinTech, HealthTech"
                      value={showSample && !results ? displayForm.targetDomain : formData.targetDomain}
                      onChange={(e) => updateField('targetDomain', e.target.value)}
                      className="bg-[hsl(160,22%,20%)] border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="targetRole" className="text-xs text-muted-foreground">
                      Target Job Role
                    </Label>
                    <Input
                      id="targetRole"
                      placeholder="e.g., Senior Product Manager"
                      value={showSample && !results ? displayForm.targetRole : formData.targetRole}
                      onChange={(e) => updateField('targetRole', e.target.value)}
                      className="bg-[hsl(160,22%,20%)] border-border"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Skills/Requirements Section */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <HiTag className="h-4 w-4 text-[hsl(160,70%,40%)]" />
                    <CardTitle className="text-sm font-semibold tracking-tight">Skills & Requirements</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Type a skill and press Enter to add</CardDescription>
                </CardHeader>
                <CardContent>
                  <TagInput
                    id="skills-input"
                    tags={showSample && !results ? displayForm.skills : formData.skills}
                    onAdd={addSkill}
                    onRemove={removeSkill}
                    placeholder="e.g., React, Python, Project Management"
                  />
                </CardContent>
              </Card>

              {/* Optional Section — Collapsible */}
              <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
                <Card className="bg-card border-border shadow-md">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HiBuildingOffice2 className="h-4 w-4 text-[hsl(160,70%,40%)]" />
                          <CardTitle className="text-sm font-semibold tracking-tight">Optional Filters</CardTitle>
                        </div>
                        {optionalOpen ? (
                          <HiChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <HiChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Target Companies</Label>
                        <TagInput
                          id="companies-input"
                          tags={showSample && !results ? displayForm.targetCompanies : formData.targetCompanies}
                          onAdd={addCompany}
                          onRemove={removeCompany}
                          placeholder="e.g., Google, Microsoft"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="appliedJobIds" className="text-xs text-muted-foreground">
                          Previously Applied Job IDs
                        </Label>
                        <Textarea
                          id="appliedJobIds"
                          placeholder="One per line or comma-separated"
                          rows={3}
                          value={showSample && !results ? displayForm.appliedJobIds : formData.appliedJobIds}
                          onChange={(e) => updateField('appliedJobIds', e.target.value)}
                          className="bg-[hsl(160,22%,20%)] border-border text-sm"
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* CTA Button */}
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full h-12 bg-[hsl(160,70%,40%)] text-[hsl(160,20%,98%)] font-semibold text-sm rounded-xl hover:bg-[hsl(160,70%,45%)] transition-colors shadow-lg shadow-[hsl(160,70%,40%)]/20 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-[hsl(160,20%,98%)] border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <HiMagnifyingGlass className="h-4 w-4" />
                    Find Matching Jobs
                  </span>
                )}
              </Button>

              {/* Error message below CTA */}
              {errorMsg && (
                <div className="rounded-xl bg-red-900/20 border border-red-800/40 px-4 py-3 text-sm text-red-300">
                  <p className="mb-2">{errorMsg}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSearch}
                    disabled={loading}
                    className="border-red-700/50 text-red-300 hover:bg-red-900/30 text-xs"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Agent Status */}
              <AgentStatusPanel activeAgentId={activeAgentId} hasResults={!!displayResults} />
            </div>

            {/* Right Panel — Results */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <LoadingSkeletons domain={showSample && !results ? SAMPLE_FORM.targetDomain : formData.targetDomain} />
              ) : displayResults ? (
                <div className="space-y-4">
                  {/* Results Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center flex-wrap gap-3">
                      <Badge className="bg-[hsl(160,70%,40%)]/15 text-[hsl(160,70%,50%)] border-[hsl(160,70%,40%)]/30 px-3 py-1 text-sm font-semibold">
                        {displayResults?.total_found ?? sortedJobs.length} jobs found
                      </Badge>
                      {(displayResults?.filtered_count ?? 0) > 0 && (
                        <Badge variant="secondary" className="px-3 py-1 text-xs">
                          <HiFunnel className="h-3 w-3 mr-1" />
                          {displayResults.filtered_count} filtered out
                        </Badge>
                      )}
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px] bg-card border-border text-sm h-9">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="best_match">Best Match</SelectItem>
                        <SelectItem value="most_recent">Most Recent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Companies Searched */}
                  {Array.isArray(displayResults?.companies_searched) && displayResults.companies_searched.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-medium">Searched:</span>
                      {displayResults.companies_searched.map((company, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs px-2 py-0.5 font-normal border-border text-muted-foreground">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Ranking Summary */}
                  {displayResults?.ranking_summary && (
                    <Card className="bg-secondary/30 border-border shadow-sm">
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {renderMarkdown(displayResults.ranking_summary)}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Job Cards */}
                  {sortedJobs.length > 0 ? (
                    <div className="space-y-3">
                      {sortedJobs.map((job, idx) => (
                        <JobResultCard key={`${job?.job_title ?? 'job'}-${job?.company_name ?? 'company'}-${idx}`} job={job} />
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-card border-border">
                      <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground text-sm">No matching jobs found. Try adjusting your search criteria.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
