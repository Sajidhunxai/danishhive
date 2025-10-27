# Forum Backend Integration

This document describes the complete backend API integration for the forum feature, replacing Supabase direct database access with custom backend API endpoints.

## Overview

The forum feature has been completely migrated from using Supabase client-side queries to using custom backend APIs. This provides better security, validation, and control over forum operations.

## Backend API Endpoints

All forum endpoints are available at `/api/forum`:

### Categories

- **GET `/api/forum/categories`** - Get all active forum categories
  - No authentication required for reading
  - Returns: Array of category objects with `id`, `name`, `description`, `icon`, `postCount`, `isActive`

### Posts

- **GET `/api/forum/posts`** - Get all forum posts
  - Query parameters:
    - `categoryId` (optional) - Filter posts by category
    - `search` (optional) - Search in title and content
  - Returns: Array of posts with author and category details

- **GET `/api/forum/posts/:id`** - Get single post with all replies
  - Returns: Post object with nested replies and author details

- **POST `/api/forum/posts`** - Create new forum post
  - Authentication required (freelancer or admin)
  - Body: `{ categoryId, title, content }`
  - Returns: Created post object

- **PUT `/api/forum/posts/:id`** - Update forum post
  - Authentication required (author or admin)
  - Body: `{ title?, content?, isPinned?, isLocked? }`
  - Note: Only admins can modify `isPinned` and `isLocked`
  - Returns: Updated post object

- **DELETE `/api/forum/posts/:id`** - Delete forum post
  - Authentication required (author or admin)
  - Cascades to delete all replies
  - Returns: Success message

### Replies

- **POST `/api/forum/replies`** - Create reply to post
  - Authentication required (freelancer or admin)
  - Body: `{ postId, content, parentReplyId? }`
  - Returns: Created reply object

- **PUT `/api/forum/replies/:id`** - Update reply
  - Authentication required (author or admin)
  - Body: `{ content }`
  - Returns: Updated reply object

- **DELETE `/api/forum/replies/:id`** - Delete reply
  - Authentication required (author or admin)
  - Returns: Success message

## Frontend Implementation

### Pages Updated

1. **ForumNewPost.tsx** (`/src/pages/ForumNewPost.tsx`)
   - Uses `api.forum.getCategories()` to fetch categories
   - Uses `api.forum.createPost()` to create posts
   - Removed Supabase direct queries

2. **Forum.tsx** (`/src/pages/Forum.tsx`)
   - Uses `api.forum.getCategories()` for category list
   - Uses `api.forum.getPosts()` for recent activity
   - Displays proper camelCase properties from backend

3. **ForumCategory.tsx** (`/src/pages/ForumCategory.tsx`)
   - Uses `api.forum.getCategories()` to find category details
   - Uses `api.forum.getPosts({ categoryId })` to fetch category posts
   - Shows posts with author information from backend

4. **ForumPostDetail.tsx** (`/src/pages/ForumPostDetail.tsx`) - **NEW**
   - Complete post detail view with replies
   - Reply creation, editing, and deletion
   - Post deletion for authors/admins
   - Lock status indicator
   - Full CRUD operations through backend API

### Routes Added

Added to `App.tsx`:
```tsx
<Route path="/forum/post/:postId" element={<ForumPostDetail />} />
```

## Data Structure Changes

### Backend (Prisma/MySQL) to Frontend Mapping

Backend uses camelCase (Prisma convention):
```typescript
{
  id: string
  categoryId: string
  authorId: string
  title: string
  content: string
  replyCount: number
  lastReplyAt: Date
  lastReplyBy: string
  isPinned: boolean
  isLocked: boolean
  createdAt: Date
  updatedAt: Date
}
```

Frontend interfaces match backend structure:
```typescript
interface ForumPost {
  id: string;
  title: string;
  content: string;
  replyCount: number;
  lastReplyAt: string;
  lastReplyBy: string | null;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  authorId: string;
  categoryId: string;
  author?: {
    id: string;
    profile: {
      fullName: string;
      avatarUrl?: string;
    };
  };
  category?: {
    id: string;
    name: string;
  };
}
```

## Security Features

1. **Authentication Required**: All write operations require valid JWT token
2. **Role-Based Access**: Forum is only accessible to freelancers and admins
3. **Authorization Checks**: Users can only edit/delete their own content (except admins)
4. **Lock Status**: Locked posts cannot receive new replies (except from admins)
5. **Validation**: Backend validates all input data

## API Service

The API client (`/src/services/api.ts`) provides these methods:

```typescript
api.forum = {
  getCategories: () => Promise<ForumCategory[]>
  getPosts: (filters?) => Promise<ForumPost[]>
  getPostById: (id) => Promise<ForumPost>
  createPost: (data) => Promise<ForumPost>
  updatePost: (id, data) => Promise<ForumPost>
  deletePost: (id) => Promise<void>
  createReply: (data) => Promise<ForumReply>
  updateReply: (id, content) => Promise<ForumReply>
  deleteReply: (id) => Promise<void>
}
```

## Database Schema

The backend uses MySQL with Prisma ORM:

### ForumCategory
```sql
- id (UUID, Primary Key)
- name (String)
- description (Text)
- icon (String)
- postCount (Int, default: 0)
- isActive (Boolean, default: true)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### ForumPost
```sql
- id (UUID, Primary Key)
- categoryId (UUID, Foreign Key)
- authorId (UUID, Foreign Key)
- title (String)
- content (Text)
- replyCount (Int, default: 0)
- lastReplyAt (DateTime)
- lastReplyBy (UUID, nullable)
- isPinned (Boolean, default: false)
- isLocked (Boolean, default: false)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### ForumReply
```sql
- id (UUID, Primary Key)
- postId (UUID, Foreign Key)
- authorId (UUID, Foreign Key)
- content (Text)
- parentReplyId (UUID, nullable, Foreign Key)
- createdAt (DateTime)
- updatedAt (DateTime)
```

## Testing the Integration

### Prerequisites
1. Backend server running on `http://localhost:5001` (or configured `VITE_BACKEND_URL`)
2. MySQL database configured with Prisma migrations applied
3. Valid user authentication (freelancer or admin role)

### Test Steps

1. **View Forum Categories**
   - Navigate to `/forum`
   - Should see list of active categories
   - Should see recent posts in sidebar

2. **Create New Post**
   - Click "Nyt Indlæg" button
   - Select category, enter title and content
   - Submit form
   - Should redirect to new post detail page

3. **View Post Details**
   - Click on any post
   - Should see full post content
   - Should see all replies
   - Should see reply form at bottom

4. **Reply to Post**
   - Enter reply content
   - Click "Send Svar"
   - Reply should appear in the list

5. **Edit/Delete Content**
   - Click three-dot menu on your own posts/replies
   - Edit or delete as needed
   - Changes should reflect immediately

## Error Handling

All API calls include proper error handling:
- Network errors display generic error messages
- Server errors show specific error messages when available
- Authentication errors redirect to login page
- Loading states prevent duplicate submissions

## Future Enhancements

Possible improvements:
1. Real-time updates using WebSockets
2. Post reactions (likes, emoji reactions)
3. User mentions with @username
4. Rich text editor for post content
5. File attachments
6. Post search and filtering
7. User reputation/badges
8. Moderation tools for admins
9. Email notifications for replies
10. Post bookmarking

## Migration Notes

### Breaking Changes
- All Supabase queries have been removed
- Database field names changed from snake_case to camelCase
- User profile structure changed (nested `author.profile` instead of flat structure)

### Backwards Compatibility
None - this is a complete replacement of the forum data layer.

## Support

For issues or questions about the forum backend integration:
1. Check backend logs at `/Users/apple/Desktop/sajid/danishhive/backend/`
2. Verify Prisma schema matches database
3. Ensure all migrations are applied
4. Check API authentication tokens are valid
5. Review browser console for frontend errors

## Files Modified

### Frontend
- `/src/pages/Forum.tsx` - Main forum page
- `/src/pages/ForumCategory.tsx` - Category view page
- `/src/pages/ForumNewPost.tsx` - Create post page
- `/src/pages/ForumPostDetail.tsx` - **NEW** Post detail page
- `/src/App.tsx` - Added new route

### Backend (Already Implemented)
- `/backend/src/controllers/forum.controller.ts` - Forum logic
- `/backend/src/routes/forum.routes.ts` - API routes
- `/backend/prisma/schema.prisma` - Database schema
- `/backend/src/services/api.ts` - API client methods

## Summary

The forum feature is now fully integrated with the custom backend API, providing:
- ✅ Secure authentication and authorization
- ✅ Complete CRUD operations for posts and replies
- ✅ Role-based access control
- ✅ Proper error handling
- ✅ Clean separation of concerns
- ✅ Type-safe API client
- ✅ No direct database access from frontend



