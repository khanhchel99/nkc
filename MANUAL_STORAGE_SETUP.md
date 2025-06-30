# Manual Supabase Storage Setup Guide

## Current Status
✅ Environment variables are correctly configured  
✅ Supabase connection is working  
❌ Storage bucket needs to be created manually  
❌ Storage policies need to be configured  

## Manual Setup Steps

### 1. Create Storage Bucket
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `qbzhsczdswnpgbdvglnt`
3. Click on **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name**: `inspection-photos`
   - **Public bucket**: ✅ **Enable this**
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`
6. Click **"Create bucket"**

### 2. Configure Storage Policies
After creating the bucket, you need to set up RLS policies to allow uploads:

1. In your Supabase dashboard, go to **Storage**
2. Click on the `inspection-photos` bucket
3. Go to the **Configuration** tab
4. Click **"Add policy"** or **"New policy"**
5. Create an **INSERT policy**:
   ```sql
   -- Policy name: Enable insert for authenticated and anonymous users
   -- Target roles: authenticated, anon
   
   CREATE POLICY "Enable insert for all users" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'inspection-photos');
   ```
6. Create a **SELECT policy** (for reading/downloading):
   ```sql
   -- Policy name: Enable read for all users
   -- Target roles: authenticated, anon
   
   CREATE POLICY "Enable read for all users" ON storage.objects
   FOR SELECT USING (bucket_id = 'inspection-photos');
   ```
7. Create a **DELETE policy** (for cleanup when orders ship):
   ```sql
   -- Policy name: Enable delete for all users
   -- Target roles: authenticated, anon
   
   CREATE POLICY "Enable delete for all users" ON storage.objects
   FOR DELETE USING (bucket_id = 'inspection-photos');
   ```

### 3. Alternative: Quick Setup
If the above seems complex, you can try this simpler approach:

1. Create the bucket as described in step 1
2. In the bucket settings, disable RLS entirely:
   - Go to **Settings** → **Database**
   - Find the `storage.objects` table
   - Click **"Disable RLS"** (only for the inspection-photos bucket)

**Note**: Disabling RLS is less secure but simpler for development.

### 4. Test the Setup
After completing the manual setup, run this command to test:

```powershell
npx tsx scripts/test-supabase-storage.ts
```

You should see:
- ✅ Client initialized
- ✅ Storage access successful  
- ✅ inspection-photos bucket exists
- ✅ Upload test successful

### 5. Test in Your Application
1. Start your development server: `npm run dev`
2. Navigate to an order in your application
3. Click **"Inspection Photos"** on any order item
4. Select a photo category
5. Try uploading an image file
6. You should see the upload succeed and the image appear

## Common Issues

### Issue: "new row violates row-level security policy"
**Solution**: Configure the RLS policies as described in step 2, or disable RLS for development.

### Issue: "Bucket not found"
**Solution**: Make sure you created the bucket with exactly the name `inspection-photos`.

### Issue: "Authentication required"
**Solution**: Make sure the bucket is set to **Public** and policies allow `anon` role access.

## Next Steps After Setup
Once the upload system is working:
1. Test the approval workflow (approving/rejecting photos)
2. Test the shipping workflow (marking orders as shipped)
3. Verify that photos are automatically deleted when orders ship
4. Test the complete end-to-end workflow
