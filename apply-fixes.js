const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function executeSQLChunks() {
  console.log('Applying Phase 4 database fixes...\n');
  
  const sqlChunks = [
    {
      name: 'parse_sar_currency function',
      sql: `
CREATE OR REPLACE FUNCTION parse_sar_currency(currency_text TEXT)
RETURNS NUMERIC AS $$
BEGIN
    RETURN CAST(
        REGEXP_REPLACE(
            REGEXP_REPLACE(COALESCE(currency_text, '0'), 'SAR\\s*', '', 'g'),
            ',', '', 'g'
        ) AS NUMERIC
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
      `
    },
    // More chunks will be added via MCP tools or manual SQL editor
  ];
  
  for (const chunk of sqlChunks) {
    try {
      console.log(`Executing: ${chunk.name}...`);
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: chunk.sql });
      
      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
      } else {
        console.log(`  ✅ Success`);
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
  }
}

executeSQLChunks().catch(console.error);
