# Club Photo Creation Fix - Test Plan

## Issues Fixed

### 1. Permission Validation Issue
- **Problem**: `validateClubLeadPermission` was being called during creation mode when club doesn't exist yet
- **Solution**: Added check for `clubId === 'temp'` to bypass permission validation during creation

### 2. Storage RLS Policy Issue  
- **Problem**: Storage policy required club to exist and user to be lead, but during creation we use 'temp' clubId
- **Solution**: Use profiles bucket temporarily during creation, then move photos to club-photos bucket after club creation

## Implementation Changes

### ClubPhotoService.ts
1. **uploadClubPhoto()**: Added conditional logic for creation vs management mode
2. **uploadClubPhotoForCreation()**: New method that uploads to profiles bucket temporarily
3. **movePhotosToClubFolder()**: New method that moves photos from profiles to club-photos bucket
4. **extractPathFromUrl()**: Updated to handle different buckets

### clubs.ts API
1. **createBookClubWithPhoto()**: Updated to call movePhotosToClubFolder after club creation
2. Added error handling to not fail club creation if photo moving fails

## Test Flow

### Creation Mode Test
1. User uploads photo during club creation
2. Photo gets uploaded to `profiles/club-temp/{userId}-{timestamp}/` folder
3. Club gets created successfully
4. Photos get moved from profiles bucket to `club-photos/{clubId}/` folder
5. Database gets updated with final photo URLs

### Management Mode Test
1. User uploads photo in club settings
2. Permission validation runs (user must be club lead)
3. Photo gets uploaded directly to `club-photos/{clubId}/` folder
4. Database gets updated immediately

## Expected Results

### Before Fix
- ❌ Creation mode: "Only club leads can manage club photos" error
- ❌ Creation mode: Storage RLS policy violation
- ❌ Photos not visible after club creation

### After Fix
- ✅ Creation mode: No permission errors
- ✅ Creation mode: Photos upload successfully to temp storage
- ✅ Creation mode: Photos move to final location after club creation
- ✅ Management mode: Still requires club lead permissions
- ✅ Photos visible in club after creation

## Testing Steps

1. **Test Creation Mode**:
   - Create new club as privileged/privileged_plus user
   - Upload photo during creation
   - Verify no "Only club leads can manage" error
   - Verify club creates successfully
   - Verify photo is visible in created club

2. **Test Management Mode**:
   - Go to existing club settings
   - Try to upload photo as non-lead (should fail)
   - Try to upload photo as club lead (should succeed)

3. **Test Error Handling**:
   - Test with invalid file types
   - Test with oversized files
   - Test network failures during upload
