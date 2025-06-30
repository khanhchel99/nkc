// Script to create the required Supabase storage bucket
// Run this with: npx tsx scripts/setup-storage-bucket.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function setupStorageBucket() {
  console.log('🪣 Setting up Supabase Storage Bucket...\n');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Supabase environment variables not configured');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Error accessing storage:', listError.message);
      return;
    }

    const inspectionBucket = buckets?.find(b => b.name === 'inspection-photos');
    
    if (inspectionBucket) {
      console.log('✅ inspection-photos bucket already exists');
    } else {
      console.log('📝 Creating inspection-photos bucket...');
      
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('inspection-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 10485760, // 10MB
      });

      if (error) {
        console.log('❌ Failed to create bucket:', error.message);
        
        if (error.message.includes('insufficient')) {
          console.log('🔑 You might need to use a service role key for bucket creation');
          console.log('📝 Alternative: Create the bucket manually in your Supabase dashboard:');
          console.log('   1. Go to Storage in your Supabase dashboard');
          console.log('   2. Click "New bucket"');
          console.log('   3. Name: inspection-photos');
          console.log('   4. Make it Public');
          console.log('   5. Set file size limit to 10MB');
        }
      } else {
        console.log('✅ Successfully created inspection-photos bucket');
      }
    }

    // Test upload permissions
    console.log('\n🧪 Testing upload permissions...');
    
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const testPath = `test/connection-test-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('inspection-photos')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      
      if (uploadError.message.includes('row-level security')) {
        console.log('🔒 RLS policies might be blocking uploads');
        console.log('📝 You may need to configure storage policies in Supabase dashboard');
      } else if (uploadError.message.includes('Bucket not found')) {
        console.log('🪣 Bucket creation may have failed - try creating it manually');
      }
    } else {
      console.log('✅ Upload test successful');
      
      // Test public URL
      const { data: { publicUrl } } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(testPath);
      
      console.log('🔗 Public URL:', publicUrl);
      
      // Clean up test file
      await supabase.storage.from('inspection-photos').remove([testPath]);
      console.log('🧹 Test file cleaned up');
    }

    console.log('\n🎉 Storage setup complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupStorageBucket();
