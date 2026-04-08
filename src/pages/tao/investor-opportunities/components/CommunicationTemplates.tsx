
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Copy, 
  Mail, 
  MessageSquare, 
  FileText,
  Send,
  Download
} from "lucide-react";
import { SubnetProject } from "../types";
import { toast } from "sonner";

interface CommunicationTemplatesProps {
  project: SubnetProject;
}

interface Template {
  id: string;
  name: string;
  type: "email" | "presentation" | "memo";
  subject?: string;
  content: string;
}

const CommunicationTemplates: React.FC<CommunicationTemplatesProps> = ({
  project
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customizedContent, setCustomizedContent] = useState("");
  const [customizedSubject, setCustomizedSubject] = useState("");
  
  // Mock templates
  const templates: Template[] = [
    {
      id: "1",
      name: "Investment Interest",
      type: "email",
      subject: `Investment Interest in ${project.name}`,
      content: `Dear ${project.leadValidators[0]?.name || "Team"},

I hope this message finds you well. I'm writing to express our interest in the ${project.name} project.

Based on our initial assessment, we believe that the project aligns well with our investment criteria, particularly in the areas of ${project.technicalAreas.join(", ")}.

We would appreciate the opportunity to learn more about your development roadmap, technical architecture, and funding requirements. 

Could we schedule a call in the coming week to discuss potential investment opportunities?

Looking forward to your response.

Best regards,
[Your Name]
[Your Organization]`
    },
    {
      id: "2",
      name: "Due Diligence Request",
      type: "email",
      subject: `Due Diligence Request for ${project.name}`,
      content: `Dear ${project.leadValidators[0]?.name || "Team"},

Following our initial discussions about the ${project.name} project, we are ready to proceed to the next stage of our investment evaluation process.

To facilitate our due diligence review, we would appreciate it if you could provide the following information:

1. Detailed technical architecture documentation
2. Development roadmap and milestone timeline
3. Current validator network configuration
4. Financial projections and token distribution model
5. Team background and technical expertise overview

Please let me know if you have any questions about our due diligence process or requirements.

Thank you for your assistance.

Best regards,
[Your Name]
[Your Organization]`
    },
    {
      id: "3",
      name: "Project Presentation",
      type: "presentation",
      content: `# ${project.name} Investment Opportunity

## Project Overview
- **Stage**: ${project.stage}
- **Funding Target**: $${project.fundingTarget.toLocaleString()}
- **Technical Focus**: ${project.technicalAreas.join(", ")}

## Investment Highlights
- Strong team with proven expertise
- Addressing growing market demand
- Innovative technical approach
- Projected ROI: ${project.roi.projected}x over ${project.roi.timeframeMonths} months

## Risk Assessment
- Technical Risk: ${project.riskAssessment.technical}/10
- Market Risk: ${project.riskAssessment.market}/10
- Team Risk: ${project.riskAssessment.team}/10
- Regulatory Risk: ${project.riskAssessment.regulatory}/10
- Overall Risk: ${project.riskAssessment.overall}/10

## Investment Recommendation
Based on our analysis, this project presents a compelling investment opportunity that aligns with our investment strategy.

## Next Steps
- Complete technical due diligence
- Finalize investment terms
- Execute investment agreement
- Initiate post-investment monitoring

[Contact information and disclaimer]`
    },
    {
      id: "4",
      name: "Investment Memo",
      type: "memo",
      content: `# INVESTMENT MEMORANDUM
## ${project.name}

### Executive Summary
This memo presents an analysis of the investment opportunity in ${project.name}, a ${project.stage}-stage subnet project focused on ${project.technicalAreas.join(", ")}.

### Project Analysis
${project.name} is being developed by a team of experienced validators with expertise in the relevant technical domains. The project aims to address growing demand for distributed computing infrastructure in the specified areas.

### Market Opportunity
The target market for this project is expanding rapidly, with projected growth of 30% annually over the next five years. The project's technical approach positions it well to capture market share.

### Financial Projections
- **Total Funding Required**: $${project.fundingTarget.toLocaleString()}
- **Current Funding**: $${project.currentFunding.toLocaleString()}
- **Projected ROI**: ${project.roi.projected}x over ${project.roi.timeframeMonths} months

### Risk Analysis
- **Technical Risk**: ${project.riskAssessment.technical}/10 - ${project.riskAssessment.technical <= 3 ? "Low" : project.riskAssessment.technical <= 6 ? "Medium" : "High"}
- **Market Risk**: ${project.riskAssessment.market}/10 - ${project.riskAssessment.market <= 3 ? "Low" : project.riskAssessment.market <= 6 ? "Medium" : "High"}
- **Team Risk**: ${project.riskAssessment.team}/10 - ${project.riskAssessment.team <= 3 ? "Low" : project.riskAssessment.team <= 6 ? "Medium" : "High"}
- **Regulatory Risk**: ${project.riskAssessment.regulatory}/10 - ${project.riskAssessment.regulatory <= 3 ? "Low" : project.riskAssessment.regulatory <= 6 ? "Medium" : "High"}
- **Overall Risk**: ${project.riskAssessment.overall}/10 - ${project.riskAssessment.overall <= 3 ? "Low" : project.riskAssessment.overall <= 6 ? "Medium" : "High"}

### Investment Recommendation
We recommend an investment of $[AMOUNT] in ${project.name}, representing [X]% of the total funding requirement. This investment aligns with our strategic focus on ${project.technicalAreas.join(", ")} and offers an attractive risk-reward profile.

### Next Steps
1. Complete technical due diligence
2. Finalize investment terms
3. Execute investment agreement
4. Initiate post-investment monitoring

Prepared by: [YOUR NAME]
Date: ${new Date().toLocaleDateString()}`
    }
  ];

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    
    // Populate with default content
    setCustomizedContent(template.content);
    if (template.subject) {
      setCustomizedSubject(template.subject);
    }
  };

  const handleCopyTemplate = () => {
    if (selectedTemplate) {
      navigator.clipboard.writeText(customizedContent);
      toast.success("Template copied to clipboard");
    }
  };

  const handleSendEmail = () => {
    if (selectedTemplate && selectedTemplate.type === "email") {
      toast.success("Email would be sent to project team");
    }
  };

  const handleDownload = () => {
    if (selectedTemplate && (selectedTemplate.type === "presentation" || selectedTemplate.type === "memo")) {
      const fileName = `${project.name.replace(/\s+/g, '-').toLowerCase()}-${selectedTemplate.type}`;
      const blob = new Blob([customizedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${selectedTemplate.type === "presentation" ? "Presentation" : "Memo"} downloaded`);
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "presentation": return <FileText className="h-4 w-4" />;
      case "memo": return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Templates List */}
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Communication Templates</CardTitle>
            <CardDescription>
              Select a template to communicate about this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate?.id === template.id ? "secondary" : "outline"}
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-center">
                    {getTemplateIcon(template.type)}
                    <div className="ml-2 text-left">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.type === "email" ? "Email Template" :
                         template.type === "presentation" ? "Presentation Template" :
                         "Investment Memo"}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Template Editor */}
      <div className="md:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {selectedTemplate ? 
                 selectedTemplate.name : 
                 "Template Editor"}
              </CardTitle>
              {selectedTemplate && (
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={handleCopyTemplate}>
                    <Copy className="h-4 w-4 mr-2" /> Copy
                  </Button>
                  {selectedTemplate.type === "email" ? (
                    <Button size="sm" onClick={handleSendEmail}>
                      <Send className="h-4 w-4 mr-2" /> Send
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                  )}
                </div>
              )}
            </div>
            <CardDescription>
              {selectedTemplate?.type === "email" ? "Email Template" :
               selectedTemplate?.type === "presentation" ? "Presentation Template" :
               selectedTemplate?.type === "memo" ? "Investment Memo" :
               "Select a template from the list"}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1">
            {selectedTemplate ? (
              <div className="space-y-4">
                {selectedTemplate.type === "email" && (
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={customizedSubject}
                      onChange={(e) => setCustomizedSubject(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={customizedContent}
                    onChange={(e) => setCustomizedContent(e.target.value)}
                    className="font-mono text-sm mt-1"
                    rows={15}
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>
                    You can customize this template with project-specific information.
                    Use the buttons above to copy or {selectedTemplate.type === "email" ? "send" : "download"} the template.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Template Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a template from the list to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunicationTemplates;
