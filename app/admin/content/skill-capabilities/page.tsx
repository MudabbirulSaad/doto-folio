'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Edit,
  Eye,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createAdminSkillCapabilityApiGateway } from '@/lib/client/adapters/http/admin-skill-capabilities-api'
import {
  addEvidenceTechnology,
  capabilityToForm,
  deleteAdminSkillCapability,
  deleteAdminSkillEvidence,
  emptyCapabilityForm,
  emptyEvidenceForm,
  evidenceToForm,
  loadAdminSkillCapabilities,
  removeEvidenceTechnology,
  saveAdminSkillCapability,
  saveAdminSkillEvidence
} from '@/lib/client/application/admin/skill-capabilities'
import type {
  AdminSkillCapability,
  AdminSkillCapabilityFormData,
  AdminSkillEvidence,
  AdminSkillEvidenceFormData
} from '@/lib/client/domain/admin-content'

type Message = { type: 'success' | 'error'; text: string } | null

function renderIcon(iconName: string, className = 'w-5 h-5') {
  const iconMap = LucideIcons as unknown as Record<string, LucideIcon>
  const IconComponent = iconMap[iconName] || Sparkles
  return <IconComponent className={className} />
}

export default function SkillCapabilitiesManagementPage() {
  const [capabilities, setCapabilities] = useState<AdminSkillCapability[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<Message>(null)
  const [capabilityFormOpen, setCapabilityFormOpen] = useState(false)
  const [editingCapability, setEditingCapability] = useState<AdminSkillCapability | null>(null)
  const [capabilityForm, setCapabilityForm] = useState<AdminSkillCapabilityFormData>(emptyCapabilityForm())
  const [evidenceFormOpen, setEvidenceFormOpen] = useState(false)
  const [evidenceCapability, setEvidenceCapability] = useState<AdminSkillCapability | null>(null)
  const [editingEvidence, setEditingEvidence] = useState<AdminSkillEvidence | null>(null)
  const [evidenceForm, setEvidenceForm] = useState<AdminSkillEvidenceFormData>(emptyEvidenceForm())
  const [newTechnology, setNewTechnology] = useState('')
  const gateway = useMemo(() => createAdminSkillCapabilityApiGateway(), [])

  const fetchCapabilities = useCallback(async () => {
    const result = await loadAdminSkillCapabilities(gateway)
    if (result.success) {
      setCapabilities(result.capabilities)
    } else {
      setMessage({ type: 'error', text: result.error })
    }
    setLoading(false)
  }, [gateway])

  useEffect(() => {
    let mounted = true

    const loadCapabilities = async () => {
      const result = await loadAdminSkillCapabilities(gateway)
      if (!mounted) return

      if (result.success) {
        setCapabilities(result.capabilities)
      } else {
        setMessage({ type: 'error', text: result.error })
      }
      setLoading(false)
    }

    loadCapabilities().catch(() => {
      if (!mounted) return
      setMessage({ type: 'error', text: 'Failed to load skill capabilities' })
      setLoading(false)
    })

    return () => {
      mounted = false
    }
  }, [gateway])

  const resetCapabilityForm = () => {
    setCapabilityForm(emptyCapabilityForm(capabilities.length + 1))
    setEditingCapability(null)
    setCapabilityFormOpen(false)
  }

  const openCapabilityForm = (capability?: AdminSkillCapability) => {
    setEditingCapability(capability || null)
    setCapabilityForm(capability ? capabilityToForm(capability) : emptyCapabilityForm(capabilities.length + 1))
    setCapabilityFormOpen(true)
  }

  const resetEvidenceForm = () => {
    setEvidenceCapability(null)
    setEditingEvidence(null)
    setEvidenceForm(emptyEvidenceForm())
    setNewTechnology('')
    setEvidenceFormOpen(false)
  }

  const openEvidenceForm = (capability: AdminSkillCapability, evidence?: AdminSkillEvidence) => {
    setEvidenceCapability(capability)
    setEditingEvidence(evidence || null)
    setEvidenceForm(evidence ? evidenceToForm(evidence) : emptyEvidenceForm(capability.evidence.length + 1))
    setNewTechnology('')
    setEvidenceFormOpen(true)
  }

  const handleCapabilitySubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    const result = await saveAdminSkillCapability(gateway, capabilityForm, editingCapability?.id)
    if (result.success) {
      setMessage({ type: 'success', text: editingCapability ? 'Capability updated.' : 'Capability created.' })
      resetCapabilityForm()
      await fetchCapabilities()
    } else {
      setMessage({ type: 'error', text: result.error })
    }
    setSaving(false)
  }

  const handleEvidenceSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!evidenceCapability) return

    setSaving(true)
    setMessage(null)

    const result = await saveAdminSkillEvidence(gateway, evidenceCapability.id, evidenceForm, editingEvidence?.id)
    if (result.success) {
      setMessage({ type: 'success', text: editingEvidence ? 'Evidence updated.' : 'Evidence created.' })
      resetEvidenceForm()
      await fetchCapabilities()
    } else {
      setMessage({ type: 'error', text: result.error })
    }
    setSaving(false)
  }

  const handleDeleteCapability = async (capability: AdminSkillCapability) => {
    if (!confirm(`Delete "${capability.title}" and all of its evidence?`)) return
    const result = await deleteAdminSkillCapability(gateway, capability.id)
    if (result.success) {
      setMessage({ type: 'success', text: 'Capability deleted.' })
      await fetchCapabilities()
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  const handleDeleteEvidence = async (evidence: AdminSkillEvidence) => {
    if (!confirm(`Delete evidence "${evidence.label}"?`)) return
    const result = await deleteAdminSkillEvidence(gateway, evidence.id)
    if (result.success) {
      setMessage({ type: 'success', text: 'Evidence deleted.' })
      await fetchCapabilities()
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  const addTechnology = () => {
    const nextForm = addEvidenceTechnology(evidenceForm, newTechnology)
    setEvidenceForm(nextForm)
    if (nextForm !== evidenceForm) setNewTechnology('')
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/content">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Content</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              Skills as Evidence
            </h1>
            <p className="text-muted-foreground mt-1">Manage capability groups, proof points, technologies, and links.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/5 border-white/10 hover:bg-white/10">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </Button>
          </Link>
          <Button onClick={() => openCapabilityForm()} className="flex items-center gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            <span>Add Capability</span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-xl border backdrop-blur-md ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{message.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-5">
        {capabilities.map((capability, index) => (
          <motion.div
            key={capability.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  {renderIcon(capability.icon_name, 'w-6 h-6')}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold text-foreground">{capability.title}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${capability.is_published !== false ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'}`}>
                      {capability.is_published !== false ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-xs text-muted-foreground bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      Order {capability.display_order}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">{capability.summary}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEvidenceForm(capability)} className="bg-white/5 border-white/10 hover:bg-white/10">
                  <Plus className="w-4 h-4 mr-2" />
                  Evidence
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openCapabilityForm(capability)} className="hover:bg-white/10 hover:text-primary">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteCapability(capability)} className="hover:bg-red-500/10 text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {capability.evidence.map((evidence) => (
                <div key={evidence.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">{evidence.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{evidence.description}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${evidence.is_published !== false ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'}`}>
                      {evidence.is_published !== false ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 my-3">
                    {evidence.technologies.map((technology) => (
                      <span key={technology} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-muted-foreground">
                        {technology}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-xs text-muted-foreground">{evidence.proof_label || 'No proof link'}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEvidenceForm(capability, evidence)} className="h-8 px-2 hover:bg-white/10">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEvidence(evidence)} className="h-8 px-2 hover:bg-red-500/10 text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {capabilities.length === 0 && (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Capabilities Yet</h2>
          <p className="text-muted-foreground mb-6">Create your first capability group to replace the old percentage-based skills display.</p>
          <Button onClick={() => openCapabilityForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Capability
          </Button>
        </div>
      )}

      <AnimatePresence>
        {capabilityFormOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#18181b]/95 border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <h2 className="text-xl font-semibold text-foreground">{editingCapability ? 'Edit Capability' : 'Add Capability'}</h2>
                <Button variant="ghost" size="sm" onClick={resetCapabilityForm} className="hover:bg-white/5 rounded-full p-2 h-auto">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <form onSubmit={handleCapabilitySubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={capabilityForm.title} onChange={(event) => setCapabilityForm({ ...capabilityForm, title: event.target.value })} className="bg-white/5 border-white/10" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capability-icon">Icon</Label>
                    <div className="relative">
                      <Input id="capability-icon" value={capabilityForm.icon_name} onChange={(event) => setCapabilityForm({ ...capabilityForm, icon_name: event.target.value })} className="bg-white/5 border-white/10 pr-10" required />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{renderIcon(capabilityForm.icon_name, 'w-4 h-4')}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea id="summary" value={capabilityForm.summary} onChange={(event) => setCapabilityForm({ ...capabilityForm, summary: event.target.value })} className="bg-white/5 border-white/10 min-h-[100px]" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-order">Display Order</Label>
                    <Input id="display-order" type="number" min="0" value={capabilityForm.display_order} onChange={(event) => setCapabilityForm({ ...capabilityForm, display_order: Number(event.target.value) })} className="bg-white/5 border-white/10" />
                  </div>
                  <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 mt-6">
                    <input type="checkbox" checked={capabilityForm.is_published} onChange={(event) => setCapabilityForm({ ...capabilityForm, is_published: event.target.checked })} />
                    <span className="text-sm">Published</span>
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-5 border-t border-white/10">
                  <Button type="button" variant="ghost" onClick={resetCapabilityForm}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {evidenceFormOpen && evidenceCapability && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#18181b]/95 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{editingEvidence ? 'Edit Evidence' : 'Add Evidence'}</h2>
                  <p className="text-sm text-muted-foreground">{evidenceCapability.title}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetEvidenceForm} className="hover:bg-white/5 rounded-full p-2 h-auto">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <form onSubmit={handleEvidenceSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input id="label" value={evidenceForm.label} onChange={(event) => setEvidenceForm({ ...evidenceForm, label: event.target.value })} className="bg-white/5 border-white/10" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={evidenceForm.description} onChange={(event) => setEvidenceForm({ ...evidenceForm, description: event.target.value })} className="bg-white/5 border-white/10 min-h-[100px]" required />
                </div>
                <div className="space-y-2">
                  <Label>Technologies</Label>
                  <div className="flex gap-2">
                    <Input value={newTechnology} onChange={(event) => setNewTechnology(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addTechnology())} className="bg-white/5 border-white/10" placeholder="Next.js, Supabase, TypeScript..." />
                    <Button type="button" onClick={addTechnology} variant="outline" className="bg-white/5 border-white/10">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-10 p-3 bg-white/5 border border-white/10 rounded-lg">
                    {evidenceForm.technologies.map((technology) => (
                      <span key={technology} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm">
                        {technology}
                        <button type="button" onClick={() => setEvidenceForm(removeEvidenceTechnology(evidenceForm, technology))}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proof-label">Proof Label</Label>
                    <Input id="proof-label" value={evidenceForm.proof_label} onChange={(event) => setEvidenceForm({ ...evidenceForm, proof_label: event.target.value })} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proof-url">Proof URL</Label>
                    <Input id="proof-url" value={evidenceForm.proof_url} onChange={(event) => setEvidenceForm({ ...evidenceForm, proof_url: event.target.value })} className="bg-white/5 border-white/10" placeholder="/skill.md or https://..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="evidence-order">Display Order</Label>
                    <Input id="evidence-order" type="number" min="0" value={evidenceForm.display_order} onChange={(event) => setEvidenceForm({ ...evidenceForm, display_order: Number(event.target.value) })} className="bg-white/5 border-white/10" />
                  </div>
                  <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 mt-6">
                    <input type="checkbox" checked={evidenceForm.is_published} onChange={(event) => setEvidenceForm({ ...evidenceForm, is_published: event.target.checked })} />
                    <span className="text-sm">Published</span>
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-5 border-t border-white/10">
                  <Button type="button" variant="ghost" onClick={resetEvidenceForm}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
