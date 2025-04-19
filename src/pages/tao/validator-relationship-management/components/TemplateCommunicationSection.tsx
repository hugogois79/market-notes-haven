
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaoValidator } from "@/services/validators/types";
import { Plus, CopyIcon, Mail, MessageSquare, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'message' | 'document';
  subject?: string;
  content: string;
  tags: string[];
}

interface TemplateCommunicationSectionProps {
  validator: TaoValidator;
}

const TemplateCommunicationSection: React.FC<TemplateCommunicationSectionProps> = ({
  validator
}) => {
  // Mock communication templates
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([
    {
      id: '1',
      name: 'Welcome Email',
      type: 'email',
      subject: 'Welcome to the TAO Network!',
      content: `Dear {{validator.name}},

We're thrilled to welcome you to the TAO Network! As a validator, you play a critical role in maintaining the security and performance of our ecosystem.

Your current status is "{{validator.crm_stage}}" and we're looking forward to working with you as you progress through our onboarding process.

Best regards,
The TAO Network Team`,
      tags: ['onboarding', 'welcome']
    },
    {
      id: '2',
      name: 'Performance Update',
      type: 'email',
      subject: 'Your Monthly Performance Metrics',
      content: `Dear {{validator.name}},

Here's a summary of your performance metrics for the past month:

- Uptime: 98.7%
- Response Time: 42ms
- Stake: {{stake}} TAO
- Delegators: {{delegators}}

Keep up the good work!

Best regards,
The TAO Network Team`,
      tags: ['performance', 'monthly']
    },
    {
      id: '3',
      name: 'Follow-up Message',
      type: 'message',
      content: `Hi there! Just following up on our previous conversation about your validator setup. Have you had a chance to review the documentation I sent? Let me know if you have any questions.`,
      tags: ['follow-up']
    },
    {
      id: '4',
      name: 'Subnet Invitation',
      type: 'document',
      subject: 'Invitation to Join Subnet',
      content: `# Subnet Participation Invitation

## Dear {{validator.name}},

Based on your excellent performance and technical capabilities, we would like to invite you to participate in the following subnet:

- **Subnet Name**: {{subnet.name}}
- **Subnet ID**: {{subnet.id}}
- **Current Neurons**: {{subnet.neurons}}
- **Emission Rate**: {{subnet.emission}}

### Benefits of Participation:
- Increased rewards through higher emission rates
- Specialized focus aligned with your technical expertise
- Collaboration opportunities with complementary validators
- Enhanced visibility in the TAO ecosystem

Please review the attached technical specifications and let us know if you're interested in proceeding.

Best regards,
The TAO Network Team`,
      tags: ['subnet', 'invitation']
    }
  ]);
  
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState<CommunicationTemplate | null>(null);
  
  const handleSelectTemplate = (template: CommunicationTemplate) => {
    setSelectedTemplate(template);
    setIsEditMode(false);
  };
  
  const handleEditTemplate = () => {
    if (selectedTemplate) {
      setEditedTemplate({...selectedTemplate});
      setIsEditMode(true);
    }
  };
  
  const handleUpdateTemplate = () => {
    if (editedTemplate) {
      setTemplates(templates.map(t => 
        t.id === editedTemplate.id ? editedTemplate : t
      ));
      setSelectedTemplate(editedTemplate);
      setIsEditMode(false);
      toast.success("Template updated successfully");
    }
  };
  
  const handleCreateTemplate = () => {
    const newTemplate: CommunicationTemplate = {
      id: `template-${Date.now()}`,
      name: 'New Template',
      type: 'email',
      subject: '',
      content: '',
      tags: []
    };
    
    setTemplates([...templates, newTemplate]);
    setSelectedTemplate(newTemplate);
    setEditedTemplate(newTemplate);
    setIsEditMode(true);
  };
  
  const handleCopyTemplate = () => {
    if (selectedTemplate) {
      // Replace template variables with actual values
      let content = selectedTemplate.content
        .replace(/{{validator\.name}}/g, validator.name)
        .replace(/{{validator\.crm_stage}}/g, validator.crm_stage || 'N/A')
        .replace(/{{validator\.email}}/g, validator.email || 'N/A')
        .replace(/{{stake}}/g, '15,000')
        .replace(/{{delegators}}/g, '42')
        .replace(/{{subnet\.name}}/g, 'Machine Learning Subnet')
        .replace(/{{subnet\.id}}/g, '12')
        .replace(/{{subnet\.neurons}}/g, '256')
        .replace(/{{subnet\.emission}}/g, '0.25');
      
      navigator.clipboard.writeText(content);
      toast.success("Template content copied to clipboard");
    }
  };
  
  const handleSendEmail = () => {
    if (selectedTemplate && selectedTemplate.type === 'email') {
      toast.success(`Email would be sent to ${validator.email || 'validator'}`);
    }
  };
  
  const renderTemplateIcon = (type: CommunicationTemplate['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 mr-2" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 mr-2" />;
      case 'document':
        return <FileText className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Templates</CardTitle>
                <Button size="sm" variant="ghost" onClick={handleCreateTemplate}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Customizable communication templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate?.id === template.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-center">
                      {renderTemplateIcon(template.type)}
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {template.type === 'email' ? 'Email Template' :
                           template.type === 'message' ? 'Message Template' : 'Document Template'}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Content */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {isEditMode
                    ? 'Edit Template'
                    : selectedTemplate
                      ? selectedTemplate.name
                      : 'Template Content'}
                </CardTitle>
                <div className="flex space-x-2">
                  {selectedTemplate && !isEditMode && (
                    <>
                      <Button size="sm" variant="outline" onClick={handleEditTemplate}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCopyTemplate}>
                        <CopyIcon className="h-4 w-4 mr-2" /> Copy
                      </Button>
                      {selectedTemplate.type === 'email' && (
                        <Button size="sm" onClick={handleSendEmail}>
                          <Mail className="h-4 w-4 mr-2" /> Send
                        </Button>
                      )}
                    </>
                  )}
                  {isEditMode && (
                    <Button size="sm" onClick={handleUpdateTemplate}>
                      Save
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {isEditMode && editedTemplate ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input 
                      id="template-name" 
                      value={editedTemplate.name} 
                      onChange={(e) => setEditedTemplate({
                        ...editedTemplate,
                        name: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-type">Template Type</Label>
                    <Select
                      value={editedTemplate.type}
                      onValueChange={(value) => setEditedTemplate({
                        ...editedTemplate,
                        type: value as 'email' | 'message' | 'document',
                        subject: value === 'message' ? undefined : editedTemplate.subject
                      })}
                    >
                      <SelectTrigger id="template-type">
                        <SelectValue placeholder="Select template type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="message">Message</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(editedTemplate.type === 'email' || editedTemplate.type === 'document') && (
                    <div className="space-y-2">
                      <Label htmlFor="template-subject">Subject</Label>
                      <Input 
                        id="template-subject" 
                        value={editedTemplate.subject || ''} 
                        onChange={(e) => setEditedTemplate({
                          ...editedTemplate,
                          subject: e.target.value
                        })}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-content">Content</Label>
                    <Textarea 
                      id="template-content" 
                      rows={10}
                      value={editedTemplate.content} 
                      onChange={(e) => setEditedTemplate({
                        ...editedTemplate,
                        content: e.target.value
                      })}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-tags">Tags (comma separated)</Label>
                    <Input 
                      id="template-tags" 
                      value={editedTemplate.tags.join(', ')} 
                      onChange={(e) => setEditedTemplate({
                        ...editedTemplate,
                        tags: e.target.value.split(',').map(tag => tag.trim())
                      })}
                    />
                  </div>
                </div>
              ) : selectedTemplate ? (
                <div className="space-y-4">
                  {selectedTemplate.subject && (
                    <div>
                      <div className="text-sm font-medium">Subject:</div>
                      <div className="text-sm mt-1">{selectedTemplate.subject}</div>
                    </div>
                  )}
                  
                  <div className="border rounded-md p-4 bg-gray-50">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {selectedTemplate.content
                        .replace(/{{validator\.name}}/g, validator.name)
                        .replace(/{{validator\.crm_stage}}/g, validator.crm_stage || 'N/A')
                        .replace(/{{validator\.email}}/g, validator.email || 'N/A')
                        .replace(/{{stake}}/g, '15,000')
                        .replace(/{{delegators}}/g, '42')
                        .replace(/{{subnet\.name}}/g, 'Machine Learning Subnet')
                        .replace(/{{subnet\.id}}/g, '12')
                        .replace(/{{subnet\.neurons}}/g, '256')
                        .replace(/{{subnet\.emission}}/g, '0.25')}
                    </pre>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag, index) => (
                      <div key={index} className="bg-gray-100 text-xs px-2 py-1 rounded-full">
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Template Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a template from the list or create a new one
                  </p>
                  <Button variant="outline" onClick={handleCreateTemplate}>
                    <Plus className="h-4 w-4 mr-2" /> Create Template
                  </Button>
                </div>
              )}
            </CardContent>
            {selectedTemplate && !isEditMode && (
              <CardFooter className="border-t px-6 py-4">
                <div className="text-xs text-muted-foreground">
                  <p className="mb-1">Available variables:</p>
                  <code>{"{{validator.name}}"}</code>,{' '}
                  <code>{"{{validator.crm_stage}}"}</code>,{' '}
                  <code>{"{{validator.email}}"}</code>,{' '}
                  <code>{"{{stake}}"}</code>,{' '}
                  <code>{"{{delegators}}"}</code>,{' '}
                  <code>{"{{subnet.name}}"}</code>,{' '}
                  <code>{"{{subnet.id}}"}</code>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Template Workflows</CardTitle>
          <CardDescription>
            Automate communication sequences with validators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Onboarding Sequence</h3>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs">Active</div>
                <div className="text-sm text-muted-foreground">
                  4-step sequence • 14 days
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">1</div>
                <ArrowRight className="h-4 w-4 text-gray-300" />
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">2</div>
                <ArrowRight className="h-4 w-4 text-gray-300" />
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">3</div>
                <ArrowRight className="h-4 w-4 text-gray-300" />
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">4</div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Performance Review Sequence</h3>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-xs">Inactive</div>
                <div className="text-sm text-muted-foreground">
                  3-step sequence • 30 days
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">1</div>
                <ArrowRight className="h-4 w-4 text-gray-300" />
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">2</div>
                <ArrowRight className="h-4 w-4 text-gray-300" />
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">3</div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Create New Sequence
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateCommunicationSection;
