const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rulbvjqhfyujbhwxdubx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bGJ2anFoZnl1amJod3hkdWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODM2MTcsImV4cCI6MjA3MTI1OTYxN30.7C02fq3bjsNdDHeGsZTwgwCWIR1qJ8I24CyP7xjVeYE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllBranches() {
  console.log('Fetching all branches...\n');

  const { data, error } = await supabase
    .from('branch')
    .select('location_id, location_name')
    .order('location_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total branches: ${data.length}\n`);

  // Filter out warehouse locations
  const businessBranches = data.filter(branch => {
    const name = branch.location_name?.toLowerCase() || '';
    return !name.includes(' wh') && !name.includes('van');
  });

  console.log(`Business branches (excluding WH and Van): ${businessBranches.length}\n`);

  businessBranches.forEach((branch, i) => {
    console.log(`${i + 1}. "${branch.location_name}"`);
  });
}

getAllBranches();
