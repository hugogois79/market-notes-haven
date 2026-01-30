import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPERMEMORY_API_KEY = Deno.env.get('SUPERMEMORY_API_KEY');
const SUPERMEMORY_API_URL = 'https://api.supermemory.ai/v3/documents';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NotePayload {
  noteId: string;
  title: string;
  category: string;
  content: string;
  tags?: string[];
  summary?: string;
  attachments?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPERMEMORY_API_KEY) {
      throw new Error('SUPERMEMORY_API_KEY not configured');
    }

    const { noteId, title, category, content, tags, summary, attachments }: NotePayload = await req.json();

    if (!title || !content) {
      throw new Error('Title and content are required');
    }

    // Format content for Supermemory as structured Markdown
    let formattedContent = `# ${title}\n\n`;
    formattedContent += `**Category:** ${category || 'General'}\n`;
    
    if (tags?.length) {
      formattedContent += `**Tags:** ${tags.join(', ')}\n`;
    }
    
    if (summary) {
      formattedContent += `\n## Summary\n${summary}\n`;
    }
    
    formattedContent += `\n## Content\n${content}\n`;
    
    if (attachments?.length) {
      formattedContent += `\n## Attachments\n`;
      attachments.forEach(url => {
        formattedContent += `- ${url}\n`;
      });
    }

    // Prepare container tag from category (kebab-case)
    const containerTag = category
      ? category.replace(/\s+/g, '-').toLowerCase()
      : 'general';

    console.log(`Sending note "${title}" to Supermemory with containerTag: ${containerTag}`);

    // Send to Supermemory API
    const response = await fetch(SUPERMEMORY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPERMEMORY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: formattedContent,
        containerTag,
        metadata: {
          noteId,
          title,
          tags: tags || [],
          hasAttachments: (attachments?.length || 0) > 0,
          source: 'gvvc-one',
          createdAt: new Date().toISOString()
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Supermemory API error:', data);
      throw new Error(data.message || data.error || 'Failed to send to Supermemory');
    }

    console.log('Successfully sent to Supermemory:', data);

    return new Response(
      JSON.stringify({ success: true, ...data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-to-supermemory:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
