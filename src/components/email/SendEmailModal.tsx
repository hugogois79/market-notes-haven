import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Mail, Send, CheckCircle, AlertCircle, Loader2, Paperclip } from "lucide-react";
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

type ModalState = 'form' | 'sending' | 'success' | 'error';

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
  const { sendEmail, isSending, reset } = useSendDocumentEmail();
  
  const [modalState, setModalState] = useState<ModalState>('form');
  const [entityName, setEntityName] = useState(document.entityName || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendResult, setSendResult] = useState<SendEmailResponse | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setModalState('form');
      setEntityName(document.entityName || '');
      setSubject(generateDefaultSubject(document));
      setMessage(generateDefaultMessage());
      setSendResult(null);
      reset();
    }
  }, [open, document]);

  const handleSend = async () => {
    if (!entityName.trim()) {
      return;
    }

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

  const renderForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="entityName">Destinatário (nome da entidade)</Label>
        <Input
          id="entityName"
          value={entityName}
          onChange={(e) => setEntityName(e.target.value)}
          placeholder="Nome da empresa ou entidade"
        />
        <p className="text-xs text-muted-foreground">
          O email será descoberto automaticamente via Google Contacts ou OCR do documento.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Assunto</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Assunto do email"
        />
      </div>

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

      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-sm">
        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground truncate">
          Anexo: {document.fileName}
        </span>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button onClick={handleSend} disabled={!entityName.trim()}>
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
        <p className="font-medium">A processar...</p>
        <p className="text-sm text-muted-foreground">
          A descobrir contacto e enviar email...
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
                Fonte: {sendResult.source === 'google_contacts' ? 'Google Contacts' : 
                        sendResult.source === 'document_ocr' ? 'OCR do documento' : 'Manual'}
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Documento por Email
          </DialogTitle>
        </DialogHeader>
        
        {modalState === 'form' && renderForm()}
        {modalState === 'sending' && renderSending()}
        {modalState === 'success' && renderSuccess()}
        {modalState === 'error' && renderError()}
      </DialogContent>
    </Dialog>
  );
}
