// Test script to verify Supabase Storage configuration
// Run this with: npx tsx scripts/test-supabase-storage.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testSupabaseStorage() {
  console.log('🔍 Testing Supabase Storage Configuration...\n');

  try {
    // 1. Test client initialization
    console.log('1. Testing client initialization...');
    console.log('   Supabase URL:', SUPABASE_URL);
    console.log('   Anon Key set:', !!SUPABASE_ANON_KEY);
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.log('   ❌ Environment variables not configured');
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('   ✅ Client initialized');

    // 2. Test bucket access
    console.log('\n2. Testing bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('   ❌ Error accessing buckets:', bucketsError.message);
      return;
    }

    console.log('   Available buckets:', buckets?.map(b => b.name).join(', ') || 'none');
    
    const inspectionBucket = buckets?.find(b => b.name === 'inspection-photos');
    if (inspectionBucket) {
      console.log('   ✅ inspection-photos bucket exists');
    } else {
      console.log('   ❌ inspection-photos bucket not found');
      console.log('   📝 You need to create the "inspection-photos" bucket in Supabase Dashboard');
    }

    // 3. Test file operations (if bucket exists)
    if (inspectionBucket) {
      console.log('\n3. Testing file operations...');
      
      // Create a test file
      const testFile = new Blob(['test content'], { type: 'text/plain' });
      const testPath = 'test-connection.txt';
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('inspection-photos')
        .upload(testPath, testFile);

      if (uploadError) {
        console.log('   ❌ Upload test failed:', uploadError.message);
      } else {
        console.log('   ✅ Upload test successful');
        
        // Test public URL generation
        const { data: { publicUrl } } = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(testPath);
        
        console.log('   ✅ Public URL generated:', publicUrl);
        
        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from('inspection-photos')
          .remove([testPath]);
        
        if (deleteError) {
          console.log('   ⚠️  Cleanup failed:', deleteError.message);
        } else {
          console.log('   ✅ Cleanup successful');
        }
      }
    }

    console.log('\n🎉 Supabase Storage test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testSupabaseStorage();
