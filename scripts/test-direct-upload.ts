// Direct upload test - assumes bucket exists
// Run this with: npx tsx scripts/test-direct-upload.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testDirectUpload() {
  console.log('📤 Testing Direct Upload to inspection-photos bucket...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Test upload directly
    console.log('1. Testing direct upload...');
    
    const testContent = 'This is a test file for inspection photos';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const timestamp = Date.now();
    const testPath = `test-order-123/item-1/${timestamp}-test.txt`;

    const { data, error } = await supabase.storage
      .from('inspection-photos')
      .upload(testPath, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.log('❌ Upload failed:', error.message);
      
      if (error.message.includes('Bucket not found')) {
        console.log('🪣 The bucket may not be fully created yet or there\'s a name mismatch');
        console.log('📝 Make sure the bucket is named exactly: inspection-photos');
      } else if (error.message.includes('row-level security')) {
        console.log('🔒 RLS policies are blocking uploads');
        console.log('📝 Run the SQL policies in your Supabase SQL Editor:');
        console.log('');
        console.log('CREATE POLICY "Enable insert for inspection photos" ON storage.objects');
        console.log('FOR INSERT WITH CHECK (bucket_id = \'inspection-photos\');');
        console.log('');
        console.log('CREATE POLICY "Enable read for inspection photos" ON storage.objects');
        console.log('FOR SELECT USING (bucket_id = \'inspection-photos\');');
        console.log('');
        console.log('CREATE POLICY "Enable delete for inspection photos" ON storage.objects');
        console.log('FOR DELETE USING (bucket_id = \'inspection-photos\');');
      } else if (error.message.includes('insufficient')) {
        console.log('🔑 Permission issue - make sure the bucket allows anonymous access');
      }
    } else {
      console.log('✅ Upload successful!');
      console.log('📁 File path:', data.path);
      
      // Test public URL
      console.log('\n2. Testing public URL generation...');
      const { data: { publicUrl } } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(testPath);
      
      console.log('🔗 Public URL:', publicUrl);
      
      // Test cleanup
      console.log('\n3. Testing cleanup...');
      const { error: deleteError } = await supabase.storage
        .from('inspection-photos')
        .remove([testPath]);
      
      if (deleteError) {
        console.log('⚠️ Cleanup failed:', deleteError.message);
      } else {
        console.log('✅ Cleanup successful');
      }
      
      console.log('\n🎉 All tests passed! Your upload system is working!');
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error);
  }
}

testDirectUpload();
