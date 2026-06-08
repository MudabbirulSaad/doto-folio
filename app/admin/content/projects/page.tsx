'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  FolderOpen,
  Briefcase
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  addProjectTechnology,
  emptyProjectForm,
  projectToForm,
  removeProjectTechnology,
  saveProject
} from '@/lib/client/application/admin/projects'
import { createAdminProjectApiGateway } from '@/lib/client/adapters/http/admin-projects-api'
import type { AdminProject, AdminProjectFormData } from '@/lib/client/domain/admin-content'

const statusOptions = [
  { value: 'Planning', label: 'Planning', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { value: 'In Development', label: 'In Development', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'Completed', label: 'Completed', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'On Hold', label: 'On Hold', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
]

export default function ProjectsManagementPage() {
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState<AdminProjectFormData>(emptyProjectForm())
  const [newTechnology, setNewTechnology] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setProjects(await createAdminProjectApiGateway().list())
    } catch (error) {
      console.error('Error fetching projects:', error)
      setMessage({ type: 'error', text: 'Failed to load projects' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(emptyProjectForm())
    setNewTechnology('')
    setEditingProject(null)
    setShowForm(false)
  }

  const handleEdit = (project: AdminProject) => {
    setEditingProject(project)
    setFormData(projectToForm(project))
    setShowForm(true)
  }

  const addTechnology = () => {
    const nextFormData = addProjectTechnology(formData, newTechnology)
    setFormData(nextFormData)
    if (nextFormData !== formData) setNewTechnology('')
  }

  const removeTechnology = (tech: string) => {
    setFormData(removeProjectTechnology(formData, tech))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSaving(true)
    setMessage(null)

    try {
      const result = await saveProject(createAdminProjectApiGateway(), formData, editingProject?.id)

      if (result.success) {
        setMessage({
          type: 'success',
          text: editingProject ? 'Project updated successfully!' : 'Project created successfully!'
        })
        resetForm()
        fetchProjects()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      console.error('Error saving project:', error)
      setMessage({ type: 'error', text: 'Failed to save project' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (project: AdminProject) => {
    if (!confirm(`Are you sure you want to delete "${project.title}"?`)) {
      return
    }

    try {
      await createAdminProjectApiGateway().delete(project.id)
      setMessage({ type: 'success', text: 'Project deleted successfully!' })
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      setMessage({ type: 'error', text: 'Failed to delete project' })
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin/content">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Content</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-primary" />
              Projects Management
            </h1>
            <p className="text-muted-foreground mt-1">Add, edit, and manage your portfolio projects</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-white/5 border-white/10 hover:bg-white/10">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </Button>
          </Link>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </Button>
        </div>
      </div>

      {/* Status Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-xl border backdrop-blur-md ${message.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
          >
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#18181b]/90 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  {editingProject ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h2>
                <Button variant="ghost" size="sm" onClick={resetForm} className="hover:bg-white/5 rounded-full p-2 h-auto">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter project title..."
                    className="bg-white/5 border-white/10 focus:border-primary/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter project description..."
                    className="bg-white/5 border-white/10 focus:border-primary/50 min-h-[100px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm focus:outline-none focus:border-primary/50 text-foreground"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-[#18181b]">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <div className="flex flex-col gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_featured}
                          onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                          className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
                        />
                        <span className="text-sm">Featured Project</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_published}
                          onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                          className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
                        />
                        <span className="text-sm">Published</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Technologies</Label>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        value={newTechnology}
                        onChange={(e) => setNewTechnology(e.target.value)}
                        placeholder="Add technology (e.g., React, Node.js)..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                        className="bg-white/5 border-white/10 focus:border-primary/50"
                      />
                      <Button type="button" onClick={addTechnology} size="sm" className="bg-white/10 hover:bg-white/20 text-foreground">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {formData.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded-lg border border-white/10 min-h-[60px]">
                        {formData.technologies.map((tech, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm"
                          >
                            <span>{tech}</span>
                            <button
                              type="button"
                              onClick={() => removeTechnology(tech)}
                              className="text-primary/60 hover:text-primary ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                  <Button type="button" variant="ghost" onClick={resetForm} className="hover:bg-white/5">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="shadow-lg shadow-primary/20">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingProject ? 'Update Project' : 'Create Project'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Start by adding your first project to showcase your work to the world.</p>
            <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              <span>Add Your First Project</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projects.map((project) => {
              const statusOption = statusOptions.find(s => s.value === project.status)
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all duration-300 backdrop-blur-sm group"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusOption?.color}`}>
                          {project.status}
                        </span>
                        {project.is_featured && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Featured
                          </span>
                        )}
                        {!project.is_published && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                            Draft
                          </span>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

                      {project.project_technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.project_technologies.map((tech) => (
                            <span
                              key={tech.id}
                              className="px-2 py-1 bg-white/5 text-muted-foreground border border-white/10 rounded-md text-xs"
                            >
                              {tech.technology_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 md:self-start pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(project)}
                        className="flex items-center space-x-1 hover:bg-white/10 hover:text-primary"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(project)}
                        className="flex items-center space-x-1 hover:bg-red-500/10 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
