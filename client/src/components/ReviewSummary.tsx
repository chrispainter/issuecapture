import React from 'react';
import { IssueFormData } from '@shared/schema';

interface ReviewSummaryProps {
  formData: IssueFormData;
  photos: File[];
  video: File | null;
  audio: { file: File; duration: string } | null;
  files: File[];
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  formData,
  photos,
  video,
  audio,
  files
}) => {
  // Helper to format severity and frequency as human-readable text
  const getProductCategoryDisplay = (value: string): string => {
    const map: Record<string, string> = {
      pegasus: 'Pegasus',
      pegasusX: 'Pegasus X',
      mercury: 'Mercury',
      titanium: 'Titanium',
      antalya: 'Antalya'
    };
    return map[value] || value;
  };

  const getSeverityDisplay = (value: string): string => {
    const map: Record<string, string> = {
      blocker: 'Blocker - Prevents function',
      critical: 'Critical - Major function affected',
      major: 'Major - System performance affected',
      minor: 'Minor - Non-essential function affected',
      trivial: 'Trivial - Cosmetic issue'
    };
    return map[value] || value;
  };
  
  const getFrequencyDisplay = (value: string, customDescription?: string | null): string => {
    const map: Record<string, string> = {
      always: 'Always (100% of the time)',
      often: 'Often (approximately 75% of the time)',
      sometimes: 'Sometimes (approximately 50% of the time)',
      rarely: 'Rarely (approximately 25% of the time)',
      once: 'Once (unable to reproduce consistently)',
      custom: customDescription ? `Custom: ${customDescription}` : 'Custom frequency'
    };
    return map[value] || value;
  };
  
  // Removed OS and Browser display functions as they are no longer needed
  
  // Helper to format file sizes
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <div className="bg-neutral-100 p-4 rounded-md">
      <h3 className="text-lg font-medium mb-4">Review Your Issue Report</h3>
      
      {/* Issue Summary */}
      <div className="mb-5 border-b border-neutral-200 pb-4">
        <h4 className="text-sm font-semibold text-neutral-500 uppercase mb-2">Issue Details</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-neutral-500">Title</div>
            <div className="font-medium">{formData.title}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">Platform</div>
            <div className="font-medium">{formData.platform}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">Product Category</div>
            <div className="font-medium">{getProductCategoryDisplay(formData.productCategory)}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">Severity</div>
            <div className="font-medium">{getSeverityDisplay(formData.severity)}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm text-neutral-500">Description</div>
            <div>{formData.description}</div>
          </div>
        </div>
      </div>
      
      {/* Reproducibility */}
      <div className="mb-5 border-b border-neutral-200 pb-4">
        <h4 className="text-sm font-semibold text-neutral-500 uppercase mb-2">Reproducibility</h4>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-neutral-500">Frequency</div>
            <div className="font-medium">{getFrequencyDisplay(formData.frequency, formData.customFrequencyDescription)}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">Reproducible</div>
            <div className="font-medium">{formData.reproducible}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">Steps to Reproduce</div>
            <div className="whitespace-pre-line">{formData.reproductionSteps}</div>
          </div>
          {formData.expectedBehavior && (
            <div>
              <div className="text-sm text-neutral-500">Expected Behavior</div>
              <div>{formData.expectedBehavior}</div>
            </div>
          )}
          <div>
            <div className="text-sm text-neutral-500">Actual Behavior</div>
            <div>{formData.actualBehavior}</div>
          </div>
        </div>
      </div>
      
      {/* Environment */}
      <div className="mb-5 border-b border-neutral-200 pb-4">
        <h4 className="text-sm font-semibold text-neutral-500 uppercase mb-2">Environment</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-neutral-500">Hardware Version</div>
            <div className="font-medium">{formData.softwareVersion}</div>
          </div>
          {formData.osVersion && (
            <div>
              <div className="text-sm text-neutral-500">CNHOS Version</div>
              <div className="font-medium">{formData.osVersion}</div>
            </div>
          )}
          {formData.additionalEnvironment && (
            <div className="md:col-span-2">
              <div className="text-sm text-neutral-500">Additional Environment Info</div>
              <div>{formData.additionalEnvironment}</div>
            </div>
          )}
          <div>
            <div className="text-sm text-neutral-500">Reported By</div>
            <div className="font-medium">{formData.reportedBy}</div>
          </div>
        </div>
      </div>
      
      {/* Attachments Summary */}
      <div>
        <h4 className="text-sm font-semibold text-neutral-500 uppercase mb-2">Attachments</h4>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-neutral-500">Photos:</span>{' '}
            <span>{photos.length > 0 ? `${photos.length} attached` : 'None'}</span>
          </div>
          <div>
            <span className="text-sm text-neutral-500">Video:</span>{' '}
            <span>{video ? '1 attached' : 'None'}</span>
          </div>
          <div>
            <span className="text-sm text-neutral-500">Voice Notes:</span>{' '}
            <span>{audio ? `1 attached (${audio.duration})` : 'None'}</span>
          </div>
          <div>
            <span className="text-sm text-neutral-500">Files:</span>{' '}
            <span>
              {files.length > 0
                ? files.map((file, index) => (
                    <span key={index}>
                      {file.name} ({formatFileSize(file.size)})
                      {index < files.length - 1 ? ', ' : ''}
                    </span>
                  ))
                : 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
