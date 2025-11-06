const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rjgdlodnuiopxpfrtgfp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqZ2Rsb2RudWlvcHhwZnJ0Z2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMzMTc3MywiZXhwIjoyMDc3OTA3NzczfQ.Nmfn8v1QFlQWH-ZYEFfA0ZWn7GTNYX1T_EgFuRZV73A';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'admin123',
      email_confirm: true
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Auth user created:', authData.user.id);

    // Update user_branch_permissions with the correct user_id
    const { error: updateError } = await supabase
      .from('user_branch_permissions')
      .update({ user_id: authData.user.id })
      .eq('user_email', 'admin@test.com');

    if (updateError) {
      console.error('Update error:', updateError);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
