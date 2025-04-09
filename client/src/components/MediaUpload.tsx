import React, { useState, useRef } from 'react';
import { Camera, Video, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import CameraCapture from './CameraCapture';

interface MediaUploadProps {
  type: 'photo' | 'video';
  files: File[];
  setFiles: (files: File[]) => void;
  maxFiles: number;
  maxSize: number; // in bytes
  acceptedTypes: string;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  type,
  files,
  setFiles,
  maxFiles,
  maxSize,
  acceptedTypes
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [previews, setPreviews] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  
  // Helper function to get file size display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Create preview URLs when files change
  React.useEffect(() => {
    // Clean up previous preview URLs
    previews.forEach(url => URL.revokeObjectURL(url));
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    
    // Clean up on unmount
    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);
  
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Check if adding these files would exceed the max
    if (selectedFiles.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload up to ${maxFiles} ${type}${maxFiles > 1 ? 's' : ''}.`,
        variant: "destructive"
      });
      return;
    }
    
    // Check file sizes
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Some files exceed the maximum size of ${formatFileSize(maxSize)}.`,
        variant: "destructive"
      });
      return;
    }
    
    // Process files based on type
    if (type === 'photo') {
      setFiles([...files, ...selectedFiles]);
    } else if (type === 'video' && selectedFiles.length > 0) {
      // For video, we only want one file, so replace any existing
      setFiles([selectedFiles[0]]);
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleRemove = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  
  const handleCaptureFile = (file: File) => {
    // Check file size
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `The file exceeds the maximum size of ${formatFileSize(maxSize)}.`,
        variant: "destructive"
      });
      return;
    }
    
    // For photos, add to existing files
    if (type === 'photo') {
      // Check if adding this file would exceed the max
      if (1 + files.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `You can only upload up to ${maxFiles} photos.`,
          variant: "destructive"
        });
        return;
      }
      setFiles([...files, file]);
    } 
    // For video, replace any existing file
    else {
      setFiles([file]);
    }
    
    // Close the camera
    setShowCamera(false);
  };
  
  return (
    <div className="form-field">
      <Label className="block text-sm font-medium mb-2">
        {type === 'photo' ? 'Photos' : 'Video Capture'}
      </Label>
      
      <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex justify-center">
            {type === 'photo' ? (
              <Camera className="h-8 w-8 text-neutral-400" />
            ) : (
              <Video className="h-8 w-8 text-neutral-400" />
            )}
          </div>
          <div className="text-sm text-neutral-500">
            <p>Drag and drop {type === 'photo' ? 'image' : 'video'} files here, or</p>
            <div className="inline-flex items-center gap-1">
              <Button 
                type="button" 
                variant="link"
                onClick={handleClick}
                className="p-0 h-auto text-[#0052CC]"
              >
                browse
              </Button>
              <span className="text-neutral-500">or</span>
              <Button
                type="button"
                variant="link"
                onClick={() => setShowCamera(true)}
                className="p-0 h-auto text-[#0052CC]"
              >
                use camera
              </Button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept={acceptedTypes}
              multiple={type === 'photo'}
              onChange={handleFileChange}
            />
          </div>
          <p className="text-xs text-neutral-400">
            {type === 'photo'
              ? 'Supports: JPG, PNG, GIF (Max 10MB each)'
              : 'Supports: MP4, WebM, MOV (Max 100MB)'}
          </p>
        </div>
      </div>

      {/* Preview section */}
      {type === 'photo' && previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group border rounded-lg overflow-hidden bg-neutral-100">
              <img 
                src={preview} 
                alt={`Preview ${index + 1}`} 
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button 
                  type="button" 
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {type === 'video' && previews.length > 0 && (
        <div className="mt-4">
          <div className="relative rounded-lg overflow-hidden bg-neutral-100">
            <video 
              src={previews[0]} 
              controls
              className="w-full h-auto max-h-64"
            />
            <div className="absolute top-2 right-2">
              <Button 
                type="button" 
                variant="destructive"
                size="icon"
                className="h-8 w-8 bg-black bg-opacity-50 hover:bg-opacity-75"
                onClick={() => handleRemove(0)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg overflow-hidden w-full max-w-2xl">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">
                {type === 'photo' ? 'Take a Photo' : 'Record Video'}
              </h3>
            </div>
            
            <CameraCapture 
              mode={type}
              onCapture={handleCaptureFile}
              onClose={() => setShowCamera(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
