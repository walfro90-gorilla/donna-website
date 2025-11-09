# Supabase Document Management Setup

This document provides setup instructions for the Supabase document management system.

## Prerequisites

1. A Supabase project with authentication enabled
2. Environment variables configured in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Database Setup

### 1. Run the RPC Functions SQL

Execute the SQL commands in `lib/supabase/rpc-functions.sql` in your Supabase SQL editor. This will:

- Create the `documents` table
- Set up Row Level Security (RLS) policies
- Create RPC functions for document management
- Set up storage policies

### 2. Create Storage Buckets

In your Supabase dashboard, go to Storage and create the following buckets:

#### Documents Bucket (Private)
- **Name**: `documents`
- **Public**: `false` (private bucket)
- **File size limit**: 50MB
- **Allowed MIME types**: `application/pdf,image/jpeg,image/jpg,image/png,image/webp`

#### Restaurant Images Bucket (Public)
- **Name**: `restaurant-images`
- **Public**: `true`
- **File size limit**: 10MB
- **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`

#### Menu Images Bucket (Public)
- **Name**: `menu-images`
- **Public**: `true`
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`

#### Profile Images Bucket (Public)
- **Name**: `profile-images`
- **Public**: `true`
- **File size limit**: 2MB
- **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`

### 3. Configure Storage Policies

The SQL script includes storage policies, but you can also configure them manually in the Supabase dashboard:

#### For Documents Bucket:
- Users can only access their own documents (organized by user ID folders)
- Full CRUD operations for authenticated users on their own files

#### For Public Buckets:
- Anyone can view files
- Authenticated users can upload files
- Users can only modify/delete their own files

## Usage

### Basic Document Upload

```typescript
import { documentService } from '@/lib/supabase/document-service';

// Upload a document
const result = await documentService.uploadDocument(
  file,
  'rfc', // document type
  {
    originalName: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date()
  }
);

if (result.success) {
  console.log('Document uploaded:', result.document);
} else {
  console.error('Upload failed:', result.error);
}
```

### Get User Documents

```typescript
// Get all documents for the current user
const result = await documentService.getUserDocuments();

// Get documents by type
const rfcDocs = await documentService.getUserDocuments('rfc');

// Get documents by validation status
const pendingDocs = await documentService.getUserDocuments(undefined, 'pending');
```

### Document Validation

```typescript
// Update document validation status
await documentService.updateDocumentValidation(
  documentId,
  'approved' // or 'rejected'
);

// Validate Mexican business document
const validationResult = await documentService.validateMexicanBusinessDocument(
  documentId,
  validationRules
);
```

### Check Document Completeness

```typescript
// Check if user has all required documents
const completeness = await documentService.checkDocumentCompleteness('restaurant');

if (completeness.success) {
  console.log('Is complete:', completeness.isComplete);
  console.log('Missing documents:', completeness.missingDocuments);
}
```

## File Organization

Documents are organized in storage with the following structure:

```
documents/
├── {user_id}/
│   ├── rfc_{timestamp}.pdf
│   ├── certificado_bancario_{timestamp}.pdf
│   ├── identificacion_{timestamp}.jpg
│   └── ...
```

This ensures:
- User isolation (users can only access their own files)
- Unique file names (timestamp prevents conflicts)
- Easy cleanup and management

## Security Features

1. **Row Level Security (RLS)**: Users can only access their own document records
2. **Storage Policies**: Users can only access files in their own folders
3. **Authentication Required**: All operations require authenticated users
4. **File Validation**: Server-side validation of file types and sizes
5. **Audit Trail**: All document operations are logged with timestamps

## Error Handling

The system includes comprehensive error handling:

- **Network Errors**: Automatic retry logic for temporary failures
- **Validation Errors**: Clear messages with actionable suggestions
- **Storage Errors**: Graceful fallbacks and cleanup procedures
- **Authentication Errors**: Proper user feedback and redirect handling

## Testing

To test the document management system:

1. Ensure you have a user authenticated in your app
2. Use the `DocumentManagementDemo` component to test upload/download functionality
3. Check the Supabase dashboard to verify files are being stored correctly
4. Test the RPC functions directly in the Supabase SQL editor if needed

## Troubleshooting

### Common Issues

1. **"Not authenticated" errors**
   - Ensure user is logged in
   - Check that Supabase client is properly configured
   - Verify environment variables are set

2. **Storage upload failures**
   - Check bucket permissions and policies
   - Verify file size and type restrictions
   - Ensure bucket exists and is properly configured

3. **RPC function errors**
   - Verify all SQL functions were created successfully
   - Check function permissions and security settings
   - Review Supabase logs for detailed error messages

4. **File access issues**
   - Verify storage policies are correctly configured
   - Check that file paths follow the expected structure
   - Ensure user has proper permissions

### Debug Mode

Enable debug logging by setting:

```typescript
// In your component or service
console.log('Document service debug:', {
  user: await supabase.auth.getUser(),
  documents: await documentService.getUserDocuments()
});
```

## Performance Considerations

1. **File Size Limits**: Keep files under 10MB for optimal performance
2. **Image Optimization**: Use WebP format when possible
3. **Batch Operations**: Avoid uploading multiple large files simultaneously
4. **Caching**: Public images are cached by Supabase CDN
5. **Cleanup**: Regularly clean up orphaned files using the cleanup functions

## Future Enhancements

Potential improvements to consider:

1. **Image Processing**: Automatic image compression and format conversion
2. **OCR Integration**: Extract text from documents for validation
3. **Virus Scanning**: Integrate with antivirus services
4. **Document Templates**: Provide templates for common document types
5. **Bulk Operations**: Support for bulk upload/download operations
6. **Advanced Validation**: ML-based document validation
7. **Workflow Management**: Advanced approval workflows with multiple reviewers