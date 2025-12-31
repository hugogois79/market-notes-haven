import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting workflow files indexing...');

    // Get all workflow files that need indexing (new or updated since last index)
    const { data: files, error: filesError } = await supabase
      .from('workflow_files')
      .select('id, file_name, status, category, notes, priority, created_at, updated_at');

    if (filesError) {
      console.error('Error fetching workflow files:', filesError);
      throw filesError;
    }

    console.log(`Found ${files?.length || 0} workflow files to process`);

    let indexed = 0;
    let skipped = 0;
    let errors = 0;

    for (const file of files || []) {
      try {
        // Check if file already indexed and up to date
        const { data: existingIndex } = await supabase
          .from('workflow_file_index')
          .select('indexed_at')
          .eq('file_id', file.id)
          .single();

        // Skip if already indexed and file hasn't been updated
        if (existingIndex && new Date(existingIndex.indexed_at) >= new Date(file.updated_at)) {
          skipped++;
          continue;
        }

        // Build search text from file metadata
        const searchParts = [
          file.file_name || '',
          file.status || '',
          file.category || '',
          file.notes || '',
          file.priority || '',
        ].filter(Boolean);

        const searchText = searchParts.join(' ').toLowerCase().trim();

        if (!searchText) {
          skipped++;
          continue;
        }

        // Upsert the index entry
        const { error: upsertError } = await supabase
          .from('workflow_file_index')
          .upsert({
            file_id: file.id,
            search_text: searchText,
            indexed_at: new Date().toISOString(),
          }, {
            onConflict: 'file_id',
          });

        if (upsertError) {
          console.error(`Error indexing file ${file.id}:`, upsertError);
          errors++;
        } else {
          indexed++;
        }
      } catch (err) {
        console.error(`Error processing file ${file.id}:`, err);
        errors++;
      }
    }

    // Clean up orphaned index entries (files that were deleted)
    const { error: cleanupError } = await supabase
      .from('workflow_file_index')
      .delete()
      .not('file_id', 'in', `(${(files || []).map(f => `'${f.id}'`).join(',')})`);

    if (cleanupError && files && files.length > 0) {
      console.warn('Cleanup warning:', cleanupError);
    }

    const result = {
      success: true,
      indexed,
      skipped,
      errors,
      total: files?.length || 0,
      timestamp: new Date().toISOString(),
    };

    console.log('Indexing completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in index-workflow-files function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
