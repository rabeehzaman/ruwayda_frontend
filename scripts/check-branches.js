const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rulbvjqhfyujbhwxdubx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bGJ2anFoZnl1amJod3hkdWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODM2MTcsImV4cCI6MjA3MTI1OTYxN30.7C02fq3bjsNdDHeGsZTwgwCWIR1qJ8I24CyP7xjVeYE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBranches() {
  console.log('Checking branch names...\n');

  const { data, error } = await supabase
    .from('branch')
    .select('location_name')
    .or('location_name.ilike.%frozen%,location_name.ilike.%nashad%,location_name.ilike.%nisam%,location_name.ilike.%maher%,location_name.ilike.%zarif%,location_name.ilike.%jtb%')
    .order('location_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found branches:');
  data.forEach((branch, i) => {
    console.log(`${i + 1}. "${branch.location_name}"`);
  });
}

checkBranches();
