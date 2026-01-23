import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Mail, Send, CheckCircle, AlertCircle, Loader2, Paperclip, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSendDocumentEmail, SendEmailResponse } from "@/hooks/useSendDocumentEmail";

interface DocumentData {
  id: string;
  fileName: string;
  fileUrl: string;
  entityName?: string;
  invoiceNumber?: string;
  date?: string;
  amount?: number;
}

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentData;
  onSuccess?: () => void;
}

interface DiscoveryResult {
  found: boolean;
  email?: string;
  name?: string;
  source?: 'google_contacts' | 'document_ocr' | 'manual';
}

type ModalState = 'search' | 'discovering' | 'found' | 'not_found' | 'sending' | 'success' | 'error';

const generateDefaultSubject = (doc: DocumentData): string => {
  const dateStr = doc.date 
    ? format(new Date(doc.date), 'dd/MM/yyyy', { locale: pt }) 
    : format(new Date(), 'dd/MM/yyyy', { locale: pt });
  
  if (doc.invoiceNumber) {
    return `Fatura #${doc.invoiceNumber} - ${dateStr}`;
  }
  
  if (doc.entityName) {
    return `Documento - ${doc.entityName} - ${dateStr}`;
  }
  
  return `Documento - ${dateStr}`;
};

const generateDefaultMessage = (): string => {
  return `Exmo(a) Sr(a),

Segue em anexo o documento solicitado.

Com os melhores cumprimentos,`;
};

export default function SendEmailModal({
  open,
  onOpenChange,
  document,
  onSuccess,
}: SendEmailModalProps) {
  const { sendEmail, reset } = useSendDocumentEmail();
  
  const [modalState, setModalState] = useState<ModalState>('search');
  const [entityName, setEntityName] = useState(document.entityName || '');
  const [discoveredEmail, setDiscoveredEmail] = useState('');
  const [discoveredName, setDiscoveredName] = useState('');
  const [emailSource, setEmailSource] = useState<string>('');
  const [manualEmail, setManualEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendResult, setSendResult] = useState<SendEmailResponse | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setModalState('search');
      setEntityName(document.entityName || '');
      setDiscoveredEmail('');
      setDiscoveredName('');
      setEmailSource('');
      setManualEmail('');
      setSubject(generateDefaultSubject(document));
      setMessage(generateDefaultMessage());
      setSendResult(null);
      reset();
    }
  }, [open, document]);

  const handleDiscoverEmail = async () => {
    if (!entityName.trim()) return;

    setModalState('discovering');

    try {
      const response = await fetch('https://n8n.gvvcapital.com/webhook/contact-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityName: entityName.trim(),
          fileUrl: document.fileUrl,
          fileName: document.fileName,
        })
      });

      if (!response.ok) {
        throw new Error('Erro na comunicação');
      }

      const result: DiscoveryResult = await response.json();

      if (result.found && result.email) {
        setDiscoveredEmail(result.email);
        setDiscoveredName(result.name || entityName);
        setEmailSource(result.source || 'manual');
        setModalState('found');
      } else {
        setModalState('not_found');
      }
    } catch (err) {
      console.error('Error discovering email:', err);
      setModalState('not_found');
    }
  };

  const handleSend = async () => {
    const recipientEmail = modalState === 'found' ? discoveredEmail : manualEmail;
    
    if (!recipientEmail.trim()) return;

    setModalState('sending');

    const result = await sendEmail({
      entityName: entityName.trim(),
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      subject: subject.trim() || generateDefaultSubject(document),
      message: message.trim(),
      metadata: {
        documentId: document.id,
        invoiceNumber: document.invoiceNumber,
        date: document.date,
        amount: document.amount,
      },
    });

    setSendResult(result);

    if (result.success) {
      setModalState('success');
      onSuccess?.();
    } else {
      setModalState('error');
    }
  };

  const handleRetry = () => {
    setModalState('search');
    setSendResult(null);
    setDiscoveredEmail('');
    setManualEmail('');
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'google_contacts': return 'Google Contacts';
      case 'document_ocr': return 'OCR do documento';
      default: return 'Manual';
    }
  };

  const renderSearch = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="entityName">Destinatário (nome da entidade)</Label>
        <Input
          id="entityName"
          value={entityName}
          onChange={(e) => setEntityName(e.target.value)}
          placeholder="Nome da empresa ou entidade"
          onKeyDown={(e) => e.key === 'Enter' && handleDiscoverEmail()}
        />
        <p className="text-xs text-muted-foreground">
          O email será descoberto automaticamente via Google Contacts ou OCR do documento.
        </p>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-sm overflow-hidden min-w-0">
        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground truncate min-w-0">
          Anexo: {document.fileName}
        </span>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button onClick={handleDiscoverEmail} disabled={!entityName.trim()}>
          <Search className="h-4 w-4 mr-2" />
          Procurar Email
        </Button>
      </div>
    </div>
  );

  const renderDiscovering = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <p className="font-medium">A procurar contacto...</p>
        <p className="text-sm text-muted-foreground">
          A pesquisar email para "{entityName}"
        </p>
      </div>
    </div>
  );

  const renderEmailForm = (isManual: boolean) => (
    <div className="space-y-4">
      {/* Email Status */}
      {isManual ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Email não encontrado para "{entityName}"
              </p>
              <div className="space-y-1">
                <Label htmlFor="manualEmail" className="text-xs text-amber-700 dark:text-amber-300">
                  Inserir email manualmente
                </Label>
                <Input
                  id="manualEmail"
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="bg-white dark:bg-background"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-primary/5 border border-primary/20 p-3 rounded-md">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{discoveredEmail}</p>
              {discoveredName && discoveredName !== entityName && (
                <p className="text-sm text-muted-foreground truncate">{discoveredName}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Fonte: {getSourceLabel(emailSource)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">Assunto</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Assunto do email"
        />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message">Mensagem</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensagem do email"
          rows={5}
        />
      </div>

      {/* Attachment */}
      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-sm overflow-hidden min-w-0">
        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground truncate min-w-0">
          Anexo: {document.fileName}
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={handleRetry} size="sm">
          ← Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isManual ? !manualEmail.trim() : false}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Email
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSending = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <p className="font-medium">A enviar email...</p>
        <p className="text-sm text-muted-foreground">
          Por favor aguarde...
        </p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="rounded-full bg-primary/10 p-3">
        <CheckCircle className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center space-y-3">
        <p className="font-medium text-lg">Email Enviado!</p>
        {sendResult?.recipientEmail && (
          <div className="space-y-1 text-sm">
            <p className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {sendResult.recipientEmail}
            </p>
            {sendResult.recipientName && (
              <p className="text-muted-foreground">
                {sendResult.recipientName}
              </p>
            )}
            {sendResult.source && (
              <p className="text-xs text-muted-foreground">
                Fonte: {getSourceLabel(sendResult.source)}
              </p>
            )}
          </div>
        )}
      </div>
      <Button onClick={handleClose} className="mt-4">
        Fechar
      </Button>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center space-y-2">
        <p className="font-medium text-lg">Falha no Envio</p>
        <p className="text-sm text-muted-foreground">
          {sendResult?.error || sendResult?.message || 'Não foi possível enviar o email. Tente novamente.'}
        </p>
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button onClick={handleRetry}>
          Tentar Novamente
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,500px)] max-w-[min(92vw,500px)] sm:max-w-none overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Documento por Email
          </DialogTitle>
        </DialogHeader>
        
        {modalState === 'search' && renderSearch()}
        {modalState === 'discovering' && renderDiscovering()}
        {modalState === 'found' && renderEmailForm(false)}
        {modalState === 'not_found' && renderEmailForm(true)}
        {modalState === 'sending' && renderSending()}
        {modalState === 'success' && renderSuccess()}
        {modalState === 'error' && renderError()}
      </DialogContent>
    </Dialog>
  );
}
