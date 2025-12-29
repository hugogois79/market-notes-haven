import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManageUserRequest {
  action: "create" | "reset_password" | "change_password" | "ensure_auth_account" | "check_auth_status";
  email?: string;
  password?: string;
  name?: string;
  assigned_project_ids?: string[];
  is_requester?: boolean;
  feature_permissions?: Record<string, boolean>;
  user_id?: string;
  new_password?: string;
  expense_user_id?: string;
}

Deno.serve(async (req) => {
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

    const { action, email, password, name, assigned_project_ids, is_requester, feature_permissions, user_id, new_password, expense_user_id } = await req.json() as ManageUserRequest;

    console.log("manage-user action:", action, "email:", email);

    // Check auth status for existing expense_users
    if (action === "check_auth_status") {
      if (!expense_user_id) {
        return new Response(
          JSON.stringify({ error: "expense_user_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the expense_user record
      const { data: expenseUser, error: fetchError } = await supabaseAdmin
        .from("expense_users")
        .select("user_id, email")
        .eq("id", expense_user_id)
        .single();

      if (fetchError || !expenseUser) {
        return new Response(
          JSON.stringify({ error: "Utilizador não encontrado", has_auth: false }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user_id exists and is valid in auth system
      if (expenseUser.user_id) {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
          expenseUser.user_id
        );

        if (!authError && authUser?.user) {
          return new Response(
            JSON.stringify({ has_auth: true, user_id: expenseUser.user_id }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ has_auth: false, user_id: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure auth account for existing expense_user
    if (action === "ensure_auth_account") {
      if (!expense_user_id || !email || !password) {
        return new Response(
          JSON.stringify({ error: "expense_user_id, email e password são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the expense_user record
      const { data: expenseUser, error: fetchError } = await supabaseAdmin
        .from("expense_users")
        .select("id, user_id, email, name")
        .eq("id", expense_user_id)
        .single();

      if (fetchError || !expenseUser) {
        return new Response(
          JSON.stringify({ error: "Utilizador não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if already has valid auth account
      if (expenseUser.user_id) {
        const { data: existingAuth } = await supabaseAdmin.auth.admin.getUserById(
          expenseUser.user_id
        );
        if (existingAuth?.user) {
          return new Response(
            JSON.stringify({ 
              message: "Utilizador já tem conta de autenticação",
              user_id: expenseUser.user_id 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Check if email is already registered in auth
      const { data: existingByEmail } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = existingByEmail?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      let authUserId: string;

      if (existingAuthUser) {
        // User exists in auth but not linked - just link them
        authUserId = existingAuthUser.id;
        console.log("Found existing auth user, linking:", authUserId);
      } else {
        // Create new auth user
        const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: { name: expenseUser.name },
        });

        if (createAuthError) {
          console.error("Error creating auth user:", createAuthError);
          return new Response(
            JSON.stringify({ error: "Erro ao criar conta de autenticação: " + createAuthError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        authUserId = newAuthUser.user.id;
        console.log("Created new auth user:", authUserId);
      }

      // Update expense_user with auth user_id and email
      const { error: updateError } = await supabaseAdmin
        .from("expense_users")
        .update({ 
          user_id: authUserId,
          email: email 
        })
        .eq("id", expense_user_id);

      if (updateError) {
        console.error("Error updating expense_user:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar utilizador: " + updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Conta de autenticação criada com sucesso",
          user_id: authUserId 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user action
    if (action === "create") {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email e password são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user already exists in auth
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
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
        user_metadata: { name: name },
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
          JSON.stringify({ error: "Utilizador não encontrado no sistema de autenticação. Crie primeiro uma conta de acesso." }),
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
