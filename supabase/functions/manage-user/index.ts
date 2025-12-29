import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManageUserRequest {
  action: "create" | "reset_password" | "change_password";
  email?: string;
  password?: string;
  name?: string;
  assigned_project_ids?: string[];
  is_requester?: boolean;
  feature_permissions?: Record<string, boolean>;
  user_id?: string;
  new_password?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { action, email, password, name, assigned_project_ids, is_requester, feature_permissions, user_id, new_password } = await req.json() as ManageUserRequest;

    if (action === "create") {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email e password são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user already exists in auth
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);
      
      if (existingUser) {
        // Check if expense_user record exists
        const { data: existingExpenseUser } = await supabaseAdmin
          .from("expense_users")
          .select()
          .eq("user_id", existingUser.id)
          .single();
        
        if (existingExpenseUser) {
          return new Response(
            JSON.stringify({ error: "Este utilizador já está registado no sistema" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // User exists in auth but not in expense_users - create expense_user record
        const { data: expenseUser, error: expenseError } = await supabaseAdmin
          .from("expense_users")
          .insert({
            user_id: existingUser.id,
            name: name || email,
            email,
            assigned_project_ids: assigned_project_ids || [],
            is_active: true,
            is_requester: is_requester || false,
            feature_permissions: feature_permissions || null,
          })
          .select()
          .single();

        if (expenseError) {
          console.error("Error creating expense user for existing auth user:", expenseError);
          return new Response(
            JSON.stringify({ error: expenseError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ user: expenseUser, auth_user_id: existingUser.id, linked_existing: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
        const errorMessage = authError.message.includes("already been registered") 
          ? "Este email já está registado no sistema"
          : authError.message;
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create expense_user record
      const { data: expenseUser, error: expenseError } = await supabaseAdmin
        .from("expense_users")
        .insert({
          user_id: authUser.user.id,
          name: name || email,
          email,
          assigned_project_ids: assigned_project_ids || [],
          is_active: true,
          is_requester: is_requester || false,
          feature_permissions: feature_permissions || null,
        })
        .select()
        .single();

      if (expenseError) {
        console.error("Error creating expense user:", expenseError);
        // Rollback auth user if expense_user creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return new Response(
          JSON.stringify({ error: expenseError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ user: expenseUser, auth_user_id: authUser.user.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset_password") {
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
      });

      if (error) {
        console.error("Error sending reset password:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Email de reset enviado com sucesso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "change_password") {
      if (!user_id || !new_password) {
        return new Response(
          JSON.stringify({ error: "User ID e nova password são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Attempting to change password for user_id:", user_id);

      // First verify the user exists
      const { data: userCheck, error: checkError } = await supabaseAdmin.auth.admin.getUserById(user_id);
      
      if (checkError || !userCheck?.user) {
        console.error("User not found in auth system:", user_id, checkError);
        return new Response(
          JSON.stringify({ error: "Utilizador não encontrado no sistema de autenticação" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        password: new_password,
      });

      if (error) {
        console.error("Error changing password:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Password alterada com sucesso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in manage-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
