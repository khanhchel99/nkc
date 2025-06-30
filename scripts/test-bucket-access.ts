// Test script specifically for bucket existence and policies
// Run this with: npx tsx scripts/test-bucket-access.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

async function testBucketAccess() {
  console.log('🔍 Testing Bucket Access...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Test 1: List all buckets
    console.log('1. Listing all buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Error listing buckets:', listError.message);
      return;
    }

    console.log('📦 Available buckets:', buckets?.map(b => `${b.name} (${b.public ? 'public' : 'private'})`).join(', ') || 'none');
    
    const inspectionBucket = buckets?.find(b => b.name === 'inspection-photos');
    
    if (!inspectionBucket) {
      console.log('❌ inspection-photos bucket not found in API response');
      console.log('⏳ The bucket might still be propagating. Wait 30 seconds and try again.');
      return;
    }

    console.log('✅ inspection-photos bucket found');
    console.log(`   Public: ${inspectionBucket.public ? 'Yes' : 'No'}`);

    // Test 2: Try to upload a test file
    console.log('\n2. Testing upload permissions...');
    
    const testContent = `Test upload at ${new Date().toISOString()}`;
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const testPath = `test/rls-test-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('inspection-photos')
      .upload(testPath, testFile);

    if (uploadError) {
      console.log('❌ Upload failed:', uploadError.message);
      
      if (uploadError.message.includes('row-level security')) {
        console.log('🔒 RLS is blocking uploads');
        console.log('📝 Next steps:');
        console.log('   Option A: Disable RLS for the bucket (simple)');
        console.log('   Option B: Add RLS policies (secure)');
        console.log('   See the instructions I provided above');
      }
      return;
    }

    console.log('✅ Upload successful!');
    console.log('📁 Uploaded to:', uploadData.path);

    // Test 3: Get public URL
    console.log('\n3. Testing public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('inspection-photos')
      .getPublicUrl(testPath);
    
    console.log('🔗 Public URL:', publicUrl);

    // Test 4: Delete test file
    console.log('\n4. Testing delete permissions...');
    const { error: deleteError } = await supabase.storage
      .from('inspection-photos')
      .remove([testPath]);

    if (deleteError) {
      console.log('⚠️ Delete failed:', deleteError.message);
    } else {
      console.log('✅ Delete successful');
    }

    console.log('\n🎉 All tests passed! Upload system is ready!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBucketAccess();
