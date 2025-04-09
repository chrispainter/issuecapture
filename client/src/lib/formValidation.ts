import { z } from 'zod';

// Validator for file types
export const validateFileType = (file: File, acceptedTypes: string[]): boolean => {
  return acceptedTypes.some(type => {
    if (type.startsWith('.')) {
      // Extension validation
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    } else if (type.includes('*')) {
      // Mimetype group (e.g., "image/*")
      const [group] = type.split('/');
      return file.type.startsWith(`${group}/`);
    } else {
      // Exact mimetype match
      return file.type === type;
    }
  });
};

// Helper to parse accepted types string into array
export const parseAcceptedTypes = (acceptedTypes: string): string[] => {
  return acceptedTypes.split(',').map(type => type.trim());
};

// Schema for media upload validation
export const mediaUploadSchema = z.object({
  files: z.array(
    z.instanceof(File)
      .refine(file => file.size <= 100 * 1024 * 1024, {
        message: 'File size must be less than 100MB',
      })
  )
    .max(10, { message: 'You can only upload up to 10 files' })
});

// Schema for audio recording validation
export const audioRecordingSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 50 * 1024 * 1024, {
      message: 'Audio file size must be less than 50MB',
    })
    .refine(file => file.type.startsWith('audio/'), {
      message: 'File must be an audio file',
    }),
  duration: z.string()
});

// Helper for formatting file sizes
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};
