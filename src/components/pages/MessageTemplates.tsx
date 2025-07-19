import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  MessageSquare,
  Eye,
  Calendar,
  User,
  Send,
  TestTube,
  Activity
} from 'lucide-react'
import { blink } from '../../blink/client'
import { toast } from 'react-hot-toast'

interface MessageTemplate {
  id: string
  name: string
  content: string
  isActive: string
  variables: string[]
  createdAt: string
  updatedAt: string
  usageCount: number
}

export function MessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null)
  const [testingTemplate, setTestingTemplate] = useState<MessageTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: ''
  })
  const [testVariables, setTestVariables] = useState<Record<string, string>>({})

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const user = await blink.auth.me()
      const templatesData = await blink.db.messageTemplates.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      setTemplates(templatesData.map(template => ({
        ...template,
        variables: template.variables ? JSON.parse(template.variables) : [],
        usageCount: 0
      })))
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const extractVariables = (content: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g
    const matches = []
    let match
    while ((match = regex.exec(content)) !== null) {
      matches.push(match[1].trim())
    }
    return [...new Set(matches)]
  }

  const processTemplate = (content: string, variables: Record<string, string>): string => {
    let processed = content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g')
      processed = processed.replace(regex, value || `[${key}]`)
    })
    return processed
  }

  const addTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const user = await blink.auth.me()
      const variables = extractVariables(newTemplate.content)
      
      await blink.db.messageTemplates.create({
        userId: user.id,
        name: newTemplate.name.trim(),
        content: newTemplate.content.trim(),
        variables: JSON.stringify(variables),
        isActive: "1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      setNewTemplate({ name: '', content: '' })
      setShowAddDialog(false)
      loadTemplates()
      toast.success('Template added successfully')
    } catch (error) {
      console.error('Error adding template:', error)
      toast.error('Failed to add template')
    }
  }

  const updateTemplate = async () => {
    if (!editingTemplate) return

    try {
      const variables = extractVariables(editingTemplate.content)
      
      await blink.db.messageTemplates.update(editingTemplate.id, {
        name: editingTemplate.name.trim(),
        content: editingTemplate.content.trim(),
        variables: JSON.stringify(variables),
        updatedAt: new Date().toISOString()
      })

      setEditingTemplate(null)
      loadTemplates()
      toast.success('Template updated successfully')
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Failed to update template')
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await blink.db.messageTemplates.delete(templateId)
      loadTemplates()
      toast.success('Template deleted successfully')
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const toggleTemplateStatus = async (templateId: string, currentStatus: string) => {
    try {
      await blink.db.messageTemplates.update(templateId, {
        isActive: Number(currentStatus) > 0 ? "0" : "1",
        updatedAt: new Date().toISOString()
      })
      loadTemplates()
      toast.success('Template status updated')
    } catch (error) {
      console.error('Error toggling template status:', error)
      toast.error('Failed to update template status')
    }
  }

  const duplicateTemplate = async (template: MessageTemplate) => {
    try {
      const user = await blink.auth.me()
      await blink.db.messageTemplates.create({
        userId: user.id,
        name: `${template.name} (Copy)`,
        content: template.content,
        variables: JSON.stringify(template.variables),
        isActive: "1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      loadTemplates()
      toast.success('Template duplicated successfully')
    } catch (error) {
      console.error('Error duplicating template:', error)
      toast.error('Failed to duplicate template')
    }
  }

  const testTemplate = (template: MessageTemplate) => {
    setTestingTemplate(template)
    const initialVariables: Record<string, string> = {}
    template.variables.forEach(variable => {
      initialVariables[variable] = getSampleValue(variable)
    })
    setTestVariables(initialVariables)
  }

  const getSampleValue = (variable: string): string => {
    const lowerVar = variable.toLowerCase()
    if (lowerVar.includes('name')) return 'John Doe'
    if (lowerVar.includes('date')) return new Date().toLocaleDateString()
    if (lowerVar.includes('time')) return new Date().toLocaleTimeString()
    if (lowerVar.includes('group')) return 'Sample Group'
    if (lowerVar.includes('url')) return 'https://example.com'
    if (lowerVar.includes('phone')) return '+1234567890'
    if (lowerVar.includes('email')) return 'user@example.com'
    if (lowerVar.includes('company')) return 'Sample Company'
    if (lowerVar.includes('product')) return 'Sample Product'
    return `Sample ${variable}`
  }

  const sendTestMessage = async () => {
    if (!testingTemplate) return

    try {
      const processedMessage = processTemplate(testingTemplate.content, testVariables)
      
      await blink.db.activityLogs.create({
        userId: (await blink.auth.me()).id,
        action: 'test_message',
        target: 'test_group',
        status: 'success',
        message: processedMessage,
        templateId: testingTemplate.id,
        createdAt: new Date().toISOString()
      })

      toast.success('Test message sent successfully!')
      setTestingTemplate(null)
    } catch (error) {
      console.error('Error sending test message:', error)
      toast.error('Failed to send test message')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            Create and manage message templates for automation
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mx-4">
            <DialogHeader>
              <DialogTitle>Add New Template</DialogTitle>
              <DialogDescription>
                Create a new message template with variables
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="Enter template name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateContent">Message Content</Label>
                <Textarea
                  id="templateContent"
                  placeholder="Enter your message template. Use {{variable}} for dynamic content."
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  Use variables like {{name}}, {{date}}, {{group}} for dynamic content
                </p>
              </div>
              {newTemplate.content && (
                <div className="space-y-2">
                  <Label>Variables Found</Label>
                  <div className="flex flex-wrap gap-2">
                    {extractVariables(newTemplate.content).map((variable, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={addTemplate} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                Add Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{templates.length}</p>
                <p className="text-xs sm:text-sm text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {templates.filter(t => Number(t.isActive) > 0).length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {templates.reduce((sum, t) => sum + (t.variables?.length || 0), 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Variables</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {templates.reduce((sum, t) => sum + t.usageCount, 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Uses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-500 mb-4">Create your first message template to get started</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col bg-white border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg line-clamp-2 text-gray-900">{template.name}</CardTitle>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge 
                      variant={Number(template.isActive) > 0 ? "default" : "secondary"} 
                      className={`text-xs ${Number(template.isActive) > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {Number(template.isActive) > 0 ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={Number(template.isActive) > 0}
                      onCheckedChange={() => toggleTemplateStatus(template.id, template.isActive)}
                      className="scale-75 sm:scale-100"
                    />
                  </div>
                </div>
                <CardDescription className="text-xs sm:text-sm text-gray-500">
                  Created {new Date(template.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-0">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-3">
                    {template.content}
                  </p>
                  {template.variables.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((variable, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-gray-300 text-gray-600">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                            +{template.variables.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 gap-2">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testTemplate(template)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <TestTube className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateTemplate(template)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {template.usageCount} uses
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl mx-4">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template information and content
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editTemplateName">Template Name</Label>
                <Input
                  id="editTemplateName"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTemplateContent">Message Content</Label>
                <Textarea
                  id="editTemplateContent"
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate(prev => 
                    prev ? { ...prev, content: e.target.value } : null
                  )}
                  rows={6}
                  className="resize-none"
                />
              </div>
              {editingTemplate.content && (
                <div className="space-y-2">
                  <Label>Variables Found</Label>
                  <div className="flex flex-wrap gap-2">
                    {extractVariables(editingTemplate.content).map((variable, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setEditingTemplate(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={updateTemplate} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl mx-4">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how your template will look with sample data
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Original Template</Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="text-sm whitespace-pre-wrap text-gray-700">{previewTemplate.content}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preview with Sample Data</Label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm whitespace-pre-wrap text-gray-800">
                    {processTemplate(previewTemplate.content, 
                      previewTemplate.variables.reduce((acc, variable) => {
                        acc[variable] = getSampleValue(variable)
                        return acc
                      }, {} as Record<string, string>)
                    )}
                  </p>
                </div>
              </div>
              {previewTemplate.variables.length > 0 && (
                <div className="space-y-2">
                  <Label>Variables Used</Label>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.variables.map((variable, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {variable} → {getSampleValue(variable)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setPreviewTemplate(null)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Template Dialog */}
      <Dialog open={!!testingTemplate} onOpenChange={() => setTestingTemplate(null)}>
        <DialogContent className="max-w-2xl mx-4">
          <DialogHeader>
            <DialogTitle>Test Template</DialogTitle>
            <DialogDescription>
              Test your template with custom variable values
            </DialogDescription>
          </DialogHeader>
          {testingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template: {testingTemplate.name}</Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="text-sm whitespace-pre-wrap text-gray-700">{testingTemplate.content}</p>
                </div>
              </div>
              
              {testingTemplate.variables.length > 0 && (
                <div className="space-y-3">
                  <Label>Variable Values</Label>
                  {testingTemplate.variables.map((variable) => (
                    <div key={variable} className="space-y-1">
                      <Label htmlFor={`var-${variable}`} className="text-sm">{variable}</Label>
                      <Input
                        id={`var-${variable}`}
                        value={testVariables[variable] || ''}
                        onChange={(e) => setTestVariables(prev => ({
                          ...prev,
                          [variable]: e.target.value
                        }))}
                        placeholder={`Enter value for ${variable}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm whitespace-pre-wrap text-gray-800">
                    {processTemplate(testingTemplate.content, testVariables)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setTestingTemplate(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={sendTestMessage} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Send Test Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}