'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    Code2,
    Cpu,
    Database,
    Layout,
    Terminal,
    Wrench
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import * as LucideIcons from 'lucide-react'

interface Skill {
    id: string
    name: string
    category: 'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'Tools' | 'Other'
    proficiency: number
    icon_name: string
    display_order: number
}

interface SkillFormData {
    name: string
    category: 'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'Tools' | 'Other'
    proficiency: number
    icon_name: string
}

const categories = [
    { value: 'Frontend', label: 'Frontend', icon: Layout, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { value: 'Backend', label: 'Backend', icon: Terminal, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { value: 'Database', label: 'Database', icon: Database, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    { value: 'DevOps', label: 'DevOps', icon: Cpu, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { value: 'Tools', label: 'Tools', icon: Wrench, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    { value: 'Other', label: 'Other', icon: Code2, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' }
]

export default function SkillsManagementPage() {
    const [skills, setSkills] = useState<Skill[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [formData, setFormData] = useState<SkillFormData>({
        name: '',
        category: 'Frontend',
        proficiency: 50,
        icon_name: 'Code2'
    })

    useEffect(() => {
        fetchSkills()
    }, [])

    const fetchSkills = async () => {
        try {
            const response = await fetch('/api/admin/content/skills')
            if (response.ok) {
                const result = await response.json()
                setSkills(result.data)
            } else {
                setMessage({ type: 'error', text: 'Failed to load skills' })
            }
        } catch (error) {
            console.error('Error fetching skills:', error)
            setMessage({ type: 'error', text: 'Failed to load skills' })
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            category: 'Frontend',
            proficiency: 50,
            icon_name: 'Code2'
        })
        setEditingSkill(null)
        setShowForm(false)
    }

    const handleEdit = (skill: Skill) => {
        setEditingSkill(skill)
        setFormData({
            name: skill.name,
            category: skill.category,
            proficiency: skill.proficiency,
            icon_name: skill.icon_name
        })
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: 'Skill name is required' })
            return
        }

        setSaving(true)
        setMessage(null)

        try {
            const url = editingSkill
                ? `/api/admin/content/skills/${editingSkill.id}`
                : '/api/admin/content/skills'

            const method = editingSkill ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const result = await response.json()

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: editingSkill ? 'Skill updated successfully!' : 'Skill created successfully!'
                })
                resetForm()
                fetchSkills()
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to save skill' })
            }
        } catch (error) {
            console.error('Error saving skill:', error)
            setMessage({ type: 'error', text: 'Failed to save skill' })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (skill: Skill) => {
        if (!confirm(`Are you sure you want to delete "${skill.name}"?`)) {
            return
        }

        try {
            const response = await fetch(`/api/admin/content/skills/${skill.id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setMessage({ type: 'success', text: 'Skill deleted successfully!' })
                fetchSkills()
            } else {
                const result = await response.json()
                setMessage({ type: 'error', text: result.error || 'Failed to delete skill' })
            }
        } catch (error) {
            console.error('Error deleting skill:', error)
            setMessage({ type: 'error', text: 'Failed to delete skill' })
        }
    }

    // Helper to render dynamic icon
    const renderIcon = (iconName: string, className: string = "w-5 h-5") => {
        const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Code2
        return <IconComponent className={className} />
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
                            <Code2 className="w-8 h-8 text-primary" />
                            Skills Management
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage your technical skills and proficiency levels</p>
                    </div>
                </div>

                <Button
                    onClick={() => setShowForm(true)}
                    className="flex items-center space-x-2 shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Skill</span>
                </Button>
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

            {/* Skill Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#18181b]/90 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                    {editingSkill ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                                    {editingSkill ? 'Edit Skill' : 'Add New Skill'}
                                </h2>
                                <Button variant="ghost" size="sm" onClick={resetForm} className="hover:bg-white/5 rounded-full p-2 h-auto">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Skill Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. React, Python, Docker"
                                        className="bg-white/5 border-white/10 focus:border-primary/50"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <select
                                            id="category"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm focus:outline-none focus:border-primary/50 text-foreground"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.value} value={cat.value} className="bg-[#18181b]">
                                                    {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="icon">Icon Name (Lucide)</Label>
                                        <div className="relative">
                                            <Input
                                                id="icon"
                                                value={formData.icon_name}
                                                onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                                                placeholder="e.g. Code2"
                                                className="bg-white/5 border-white/10 focus:border-primary/50 pr-10"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                {renderIcon(formData.icon_name, "w-4 h-4")}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="proficiency">Proficiency ({formData.proficiency}%)</Label>
                                    </div>
                                    <input
                                        type="range"
                                        id="proficiency"
                                        min="0"
                                        max="100"
                                        value={formData.proficiency}
                                        onChange={(e) => setFormData({ ...formData, proficiency: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Beginner</span>
                                        <span>Intermediate</span>
                                        <span>Expert</span>
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
                                                {editingSkill ? 'Update Skill' : 'Create Skill'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                    const categorySkills = skills.filter(s => s.category === category.value)
                    if (categorySkills.length === 0) return null

                    const CategoryIcon = category.icon

                    return (
                        <motion.div
                            key={category.value}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col"
                        >
                            <div className={`p-4 border-b border-white/5 flex items-center space-x-3 ${category.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ')}`}>
                                <div className={`p-2 rounded-lg bg-white/10`}>
                                    <CategoryIcon className={`w-5 h-5 ${category.color.split(' ')[0]}`} />
                                </div>
                                <h3 className="font-semibold text-foreground">{category.label}</h3>
                                <span className="ml-auto text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
                                    {categorySkills.length}
                                </span>
                            </div>

                            <div className="p-4 space-y-3 flex-1">
                                {categorySkills.map((skill) => (
                                    <div
                                        key={skill.id}
                                        className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                                {renderIcon(skill.icon_name)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-foreground">{skill.name}</p>
                                                <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary/50 rounded-full"
                                                        style={{ width: `${skill.proficiency}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(skill)}
                                                className="h-8 w-8 p-0 hover:bg-white/10 hover:text-primary"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(skill)}
                                                className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {skills.length === 0 && !loading && (
                <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm col-span-full">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Code2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Skills Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">Add your technical skills to showcase your expertise.</p>
                    <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" />
                        <span>Add Your First Skill</span>
                    </Button>
                </div>
            )}
        </div>
    )
}
