import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Upload, X, FileArchive, FileImage, File as FilePdf, FileText as FileTextIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  files: File[];
  setFiles: (files: File[]) => void;
  maxFiles: number;
  maxSize: number; // in bytes
  acceptedTypes: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  files,
  setFiles,
  maxFiles,
  maxSize,
  acceptedTypes
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Helper function to get file size display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Helper to get the file icon based on type
  const getFileIcon = (file: File) => {
    const type = file.type;
    
    if (type.includes('pdf')) {
      return <FilePdf className="h-5 w-5 text-[#FF5630]" />;
    } else if (type.includes('image')) {
      return <FileImage className="h-5 w-5 text-[#0052CC]" />;
    } else if (type.includes('zip') || type.includes('compressed')) {
      return <FileArchive className="h-5 w-5 text-[#FF5630]" />;
    } else {
      return <FileTextIcon className="h-5 w-5 text-neutral-500" />;
    }
  };
  
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
        description: `You can only upload up to ${maxFiles} files.`,
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
    
    // Add files
    setFiles([...files, ...selectedFiles]);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      
      // Check if adding these files would exceed the max
      if (droppedFiles.length + files.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `You can only upload up to ${maxFiles} files.`,
          variant: "destructive"
        });
        return;
      }
      
      // Check file sizes
      const oversizedFiles = droppedFiles.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        toast({
          title: "File too large",
          description: `Some files exceed the maximum size of ${formatFileSize(maxSize)}.`,
          variant: "destructive"
        });
        return;
      }
      
      // Add files
      setFiles([...files, ...droppedFiles]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleRemove = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  
  return (
    <div className="form-field">
      <Label className="block text-sm font-medium mb-2">File Attachments</Label>
      
      <div 
        className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="space-y-2">
          <div className="mx-auto flex justify-center">
            <FileText className="h-8 w-8 text-neutral-400" />
          </div>
          <div className="text-sm text-neutral-500">
            <p>Drag and drop files here, or</p>
            <Button 
              type="button" 
              variant="link"
              onClick={handleClick}
              className="mt-1 p-0 h-auto text-[#0052CC]"
            >
              browse
            </Button>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept={acceptedTypes}
              multiple
              onChange={handleFileChange}
            />
          </div>
          <p className="text-xs text-neutral-400">
            Supports: PDF, TXT, LOG, CSV, ZIP (Max 50MB each)
          </p>
        </div>
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-neutral-100 rounded-lg">
              <div className="flex items-center">
                {getFileIcon(file)}
                <div className="ml-3">
                  <div className="text-sm">
                    {file.name} <span className="text-neutral-500 text-xs">({formatFileSize(file.size)})</span>
                  </div>
                </div>
              </div>
              <Button 
                type="button" 
                variant="ghost"
                size="icon"
                className="text-neutral-500 hover:text-[#FF5630]"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
