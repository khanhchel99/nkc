// Quick test to see if our upload function works with current setup
// Run this with: npx tsx scripts/test-upload-function.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testUploadFunction() {
  console.log('📤 Testing Upload Function...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Test 1: Check if bucket exists
  console.log('1. Checking bucket existence...');
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.log('❌ Cannot access storage:', listError.message);
    return;
  }

  const bucket = buckets?.find(b => b.name === 'inspection-photos');
  if (!bucket) {
    console.log('❌ inspection-photos bucket does not exist');
    console.log('📝 Please create it manually in your Supabase dashboard');
    console.log('   See MANUAL_STORAGE_SETUP.md for detailed instructions');
    return;
  }
  
  console.log('✅ inspection-photos bucket exists');

  // Test 2: Try to upload a small test file
  console.log('\n2. Testing file upload...');
  
  try {
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
      
      if (error.message.includes('row-level security')) {
        console.log('🔒 RLS policies are blocking uploads');
        console.log('📝 You need to configure storage policies or disable RLS');
        console.log('   See MANUAL_STORAGE_SETUP.md for instructions');
      } else if (error.message.includes('Bucket not found')) {
        console.log('🪣 Bucket configuration issue');
      }
    } else {
      console.log('✅ Upload successful!');
      console.log('📁 File path:', data.path);
      
      // Test 3: Get public URL
      console.log('\n3. Testing public URL generation...');
      const { data: { publicUrl } } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(testPath);
      
      console.log('🔗 Public URL:', publicUrl);
      
      // Test 4: Clean up
      console.log('\n4. Cleaning up test file...');
      const { error: deleteError } = await supabase.storage
        .from('inspection-photos')
        .remove([testPath]);
      
      if (deleteError) {
        console.log('⚠️ Cleanup failed:', deleteError.message);
      } else {
        console.log('✅ Cleanup successful');
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error);
  }

  console.log('\n🏁 Upload function test complete!');
}

testUploadFunction();
