# Profile Photo Upload Implementation Plan

## **Quick Implementation Guide** ⚡

**Estimated Time: 4-6 hours total**

### **Phase 1: Storage Setup (30 minutes)**

1. **Create Storage Bucket Migration**
```sql
-- supabase/migrations/20250101_profiles_storage_setup.sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profiles' AND 
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.filename(name) LIKE auth.uid()::text || '-%')
);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');
```

### **Phase 2: Profile Page Integration (1 hour)**

2. **Update Profile.tsx**
```typescript
// Replace lines 81-91 in src/pages/Profile.tsx
import { AvatarSelector } from '@/components/profile/AvatarSelector';

// Add state for avatar
const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');

// Replace placeholder avatar with:
<AvatarSelector 
  currentAvatarUrl={avatarUrl}
  onAvatarChange={(url) => {
    setAvatarUrl(url);
    // Update database
    supabase.from('users').update({ avatar_url: url }).eq('id', user?.id);
  }}
/>
```

### **Phase 3: Optimization (2-4 hours)**

3. **Add Image Processing**
```typescript
// Create src/lib/services/profileImageService.ts
export const uploadProfileImage = async (file: File, userId: string) => {
  // Resize to 400x400 for profile, 100x100 for thumbnail
  const profileImage = await resizeImage(file, 400, 400);
  const thumbnail = await resizeImage(file, 100, 100);
  
  // Upload both versions
  // Return URLs
};
```

## **Key Benefits of This Approach**

### **✅ Leverages Existing Infrastructure**
- `AvatarSelector` component is production-ready
- `UserAvatar` component handles all display cases
- Database schema already supports `avatar_url`
- File upload patterns already established

### **✅ Minimal Code Changes Required**
- Only need to replace placeholder in Profile.tsx
- Storage bucket setup is straightforward
- No breaking changes to existing components

### **✅ Performance Optimized**
- Existing `UserAvatar` component includes loading states
- Fallback system already implemented
- Can add CDN caching easily

## **Potential Gotchas**

### **⚠️ Storage Policies**
- Ensure policies allow users to upload only their own avatars
- Test file size limits and MIME type restrictions

### **⚠️ Image Optimization**
- Consider implementing client-side resizing to reduce upload size
- Add progressive loading for better UX

### **⚠️ Cache Invalidation**
- Avatar URLs may need cache-busting parameters
- Consider using versioned filenames

## **Testing Checklist**

- [ ] Upload various image formats (JPEG, PNG, GIF)
- [ ] Test file size limits (should reject >2MB)
- [ ] Verify avatar appears in all locations (nav, discussions, etc.)
- [ ] Test fallback behavior when no avatar set
- [ ] Verify storage policies prevent unauthorized access
- [ ] Test on mobile devices for responsive behavior

## **Success Metrics**

- Users can upload profile photos in <30 seconds
- Images load quickly across the application
- No performance degradation in avatar-heavy pages
- Fallback system works seamlessly
- Storage costs remain reasonable

---

**Status**: Ready for Implementation
**Risk Level**: Low (leverages existing, tested components)
**User Impact**: High (significant UX improvement)
