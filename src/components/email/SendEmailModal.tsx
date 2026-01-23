import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Mail, Send, CheckCircle, AlertCircle, Loader2, Paperclip, RefreshCw } from "lucide-react";
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
  vendorName?: string;
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

type ModalState = 'form' | 'discovering' | 'sending' | 'success' | 'error';

const generateDefaultSubject = (doc: DocumentData): string => {
  const dateStr = doc.date 
    ? format(new Date(doc.date), 'dd/MM/yyyy', { locale: pt }) 
    : format(new Date(), 'dd/MM/yyyy', { locale: pt });
  
  if (doc.invoiceNumber) {
    return `Fatura #${doc.invoiceNumber} - ${dateStr}`;
  }
  
  const name = doc.vendorName || doc.entityName;
  if (name) {
    return `Documento - ${name} - ${dateStr}`;
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
  
  const [modalState, setModalState] = useState<ModalState>('form');
  const [entityName, setEntityName] = useState(document.vendorName || document.entityName || '');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSource, setEmailSource] = useState<string>('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendResult, setSendResult] = useState<SendEmailResponse | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setModalState('form');
      setEntityName(document.vendorName || document.entityName || '');
      setRecipientEmail('');
      setEmailSource('');
      setIsDiscovering(false);
      setSubject(generateDefaultSubject(document));
      setMessage(generateDefaultMessage());
      setSendResult(null);
      reset();
    }
  }, [open, document]);

  const handleDiscoverEmail = async () => {
    if (!entityName.trim()) return;

    setIsDiscovering(true);

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
        setRecipientEmail(result.email);
        setEmailSource(result.source || 'manual');
      } else {
        setEmailSource('not_found');
      }
    } catch (err) {
      console.error('Error discovering email:', err);
      setEmailSource('error');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSend = async () => {
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
    setModalState('form');
    setSendResult(null);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'google_contacts': return 'Google Contacts';
      case 'document_ocr': return 'OCR do documento';
      case 'not_found': return 'Não encontrado';
      case 'error': return 'Erro na procura';
      default: return '';
    }
  };

  const renderForm = () => (
    <div className="space-y-4">
      {/* Recipient Name */}
      <div className="space-y-2">
        <Label htmlFor="entityName">Destinatário (nome da entidade)</Label>
        <Input
          id="entityName"
          value={entityName}
          onChange={(e) => setEntityName(e.target.value)}
          placeholder="Nome da empresa ou entidade"
        />
      </div>

      {/* Email with Discover Button */}
      <div className="space-y-2">
        <Label htmlFor="recipientEmail">Email do destinatário</Label>
        <div className="flex gap-2">
          <Input
            id="recipientEmail"
            type="email"
            value={recipientEmail}
            onChange={(e) => {
              setRecipientEmail(e.target.value);
              setEmailSource('manual');
            }}
            placeholder="email@exemplo.com"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDiscoverEmail}
            disabled={!entityName.trim() || isDiscovering}
            title="Procurar email automaticamente"
          >
            {isDiscovering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        {emailSource && emailSource !== 'manual' && (
          <p className={`text-xs ${emailSource === 'not_found' || emailSource === 'error' ? 'text-amber-600' : 'text-muted-foreground'}`}>
            {emailSource === 'not_found' || emailSource === 'error' ? (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getSourceLabel(emailSource)}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-primary" />
                Encontrado via {getSourceLabel(emailSource)}
              </span>
            )}
          </p>
        )}
        {!emailSource && (
          <p className="text-xs text-muted-foreground">
            Clique no ícone para procurar o email automaticamente via Google Contacts ou OCR.
          </p>
        )}
      </div>

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
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button onClick={handleSend} disabled={!recipientEmail.trim()}>
          <Send className="h-4 w-4 mr-2" />
          Enviar Email
        </Button>
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
      <DialogContent className="w-[min(92vw,750px)] max-w-[min(92vw,750px)] sm:max-w-none overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Documento por Email
          </DialogTitle>
        </DialogHeader>
        
        {modalState === 'form' && renderForm()}
        {modalState === 'discovering' && renderSending()}
        {modalState === 'sending' && renderSending()}
        {modalState === 'success' && renderSuccess()}
        {modalState === 'error' && renderError()}
      </DialogContent>
    </Dialog>
  );
}
