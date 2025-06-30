# Supabase Storage Setup Guide

## Current Issue
The inspection photo upload feature is failing because the Supabase anonymous key is not properly configured.

## Current Configuration Status
- ✅ Supabase URL: `https://qbzhsczdswnpgbdvglnt.supabase.co`
- ❌ Supabase Anon Key: Still set to placeholder `YOUR_SUPABASE_ANON_KEY_HERE`

## Steps to Fix

### 1. Get Your Supabase Anonymous Key
1. Go to [supabase.com](https://supabase.com) and sign in
2. Navigate to your project: `qbzhsczdswnpgbdvglnt`
3. Go to **Settings** → **API**
4. Copy the **anon/public** key (not the service_role key)

### 2. Update Your .env File
Replace the placeholder in your `.env` file:

```bash
# Current (WRONG):
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"

# Should be (example format):
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiemhzY3pkc3ducGdiZHZnbG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2Mjk4Mjg0NzcsImV4cCI6MTk0NTQwNDQ3N30...."
```

### 3. Set Up Storage Bucket
1. In your Supabase dashboard, go to **Storage**
2. Create a new bucket called `inspection-photos`
3. Make sure it's set to **Public** (so photos can be accessed via URL)
4. Set up RLS (Row Level Security) policies if needed

### 4. Restart Your Development Server
After updating the `.env` file:

```powershell
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

## Testing the Upload Feature
Once the keys are properly configured:

1. Go to an order in your application
2. Click "Inspection Photos" on any order item
3. Select a photo category
4. Try uploading an image file
5. The upload should now work without errors

## Storage Structure
Images will be stored in Supabase Storage with this structure:
```
inspection-photos/
  └── {orderId}/
      └── item-{itemId}/
          └── {timestamp}-{category}.{ext}
```

## Cleanup Process
When an order is marked as "shipped":
- All inspection photos for that order are automatically deleted from Supabase Storage
- This helps manage storage costs and keep only relevant data

## Troubleshooting
If uploads still fail after setting the correct key:
1. Check the browser console for detailed error messages
2. Verify the storage bucket exists and is public
3. Check your Supabase project's storage quotas
4. Ensure the anon key has proper permissions for storage operations
