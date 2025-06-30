// Comprehensive diagnostic script for the inspection photo upload system
// Run this with: npx tsx scripts/diagnose-upload-system.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

// Manual environment variable access since tsx doesn't load Next.js env
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function diagnoseUploadSystem() {
  console.log('🔍 Diagnosing Inspection Photo Upload System...\n');

  // 1. Check environment variables
  console.log('1. Environment Variables:');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL || 'NOT SET'}`);
  
  if (!SUPABASE_ANON_KEY) {
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY: NOT SET ❌');
  } else if (SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY: PLACEHOLDER VALUE ❌');
    console.log('   📝 Action needed: Replace with real Supabase anonymous key');
  } else {
    console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY.substring(0, 20)}... ✅`);
  }

  // 2. Test Supabase connection (only if keys are set)
  if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE') {
    console.log('\n2. Testing Supabase Connection:');
    
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // Test auth (basic connection test) - Skip auth test, go directly to storage
      console.log('   ✅ Basic connection initialized');

      // Test storage access directly
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      if (storageError) {
        console.log('   ❌ Storage access failed:', storageError.message);
        return;
      }
      console.log('   ✅ Storage access successful');

      // Check for inspection-photos bucket
      const inspectionBucket = buckets?.find(b => b.name === 'inspection-photos');
      if (inspectionBucket) {
        console.log('   ✅ inspection-photos bucket exists');
        
        // Test upload permissions
        const testFile = new Blob(['test'], { type: 'text/plain' });
        const testPath = `test/${Date.now()}.txt`;
        
        const { error: uploadError } = await supabase.storage
          .from('inspection-photos')
          .upload(testPath, testFile);
        
        if (uploadError) {
          console.log('   ❌ Upload test failed:', uploadError.message);
          if (uploadError.message.includes('row-level security')) {
            console.log('   📝 Action needed: Configure storage policies to allow uploads');
          }
        } else {
          console.log('   ✅ Upload permissions working');
          
          // Clean up test file
          await supabase.storage.from('inspection-photos').remove([testPath]);
        }
      } else {
        console.log('   ❌ inspection-photos bucket not found');
        console.log('   📝 Action needed: Create "inspection-photos" bucket in Supabase dashboard');
      }

    } catch (error) {
      console.log('   ❌ Supabase test failed:', error);
    }
  } else {
    console.log('\n2. Skipping Supabase tests (environment not configured)');
  }

  // 3. Check database schema
  console.log('\n3. Database Schema Check:');
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Check if InspectionPhoto table exists
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'InspectionPhoto'
    `;
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('   ✅ InspectionPhoto table exists');
      
      // Check table structure
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'InspectionPhoto'
        ORDER BY ordinal_position
      `;
      
      console.log('   📋 Table columns:', columns);
    } else {
      console.log('   ❌ InspectionPhoto table not found');
      console.log('   📝 Action needed: Run database migrations');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('   ❌ Database check failed:', error);
  }

  // 4. Summary and next steps
  console.log('\n4. Summary and Next Steps:');
  
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    console.log('   🔑 Primary issue: Supabase anonymous key not configured');
    console.log('   📝 Next steps:');
    console.log('      1. Go to your Supabase dashboard');
    console.log('      2. Navigate to Settings → API');
    console.log('      3. Copy the "anon public" key');
    console.log('      4. Update NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file');
    console.log('      5. Restart your development server');
  } else {
    console.log('   ✅ Environment configuration looks good');
    console.log('   📝 If uploads still fail, check:');
    console.log('      1. Supabase storage bucket exists and is public');
    console.log('      2. Storage policies allow anonymous uploads');
    console.log('      3. Network connectivity to Supabase');
  }

  console.log('\n🏁 Diagnosis complete!');
}

diagnoseUploadSystem().catch(console.error);
