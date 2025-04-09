import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import StepperProgress from './StepperProgress';
import MediaUpload from './MediaUpload';
import AudioRecorder from './AudioRecorder';
import FileUpload from './FileUpload';
import ReviewSummary from './ReviewSummary';
import SpeechToText from './SpeechToText';
import { issueFormSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Form schema with validation
const formSchema = issueFormSchema;

// Define step titles
const stepTitles = [
  'Issue Details',
  'Reproducibility',
  'Environment',
  'Media & Attachments',
  'Review & Submit'
];

const IssueForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Media state
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [audio, setAudio] = useState<{ file: File; duration: string } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  
  // Form setup with default values
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      platform: '',
      productCategory: '',
      severity: '',
      frequency: '',
      customFrequencyDescription: '',
      reproducible: '',
      reproductionSteps: '',
      expectedBehavior: '',
      actualBehavior: '',
      softwareVersion: '',
      osVersion: '',
      additionalEnvironment: '',
      reportedBy: '',
      acceptTerms: false
    },
    mode: 'onChange' // Changed from onBlur to onChange for better speech-to-text support
  });
  
  const errors = form.formState.errors;
  
  // Step navigation functions
  const goToNextStep = async () => {
    // For each step, validate specific fields
    let isValid = false;
    
    if (currentStep === 1) {
      // Check if custom frequency description is required
      if (form.watch('frequency') === 'custom') {
        const customFrequencyValue = form.watch('customFrequencyDescription');
        if (!customFrequencyValue || customFrequencyValue.trim() === '') {
          form.setError('customFrequencyDescription', {
            type: 'required',
            message: 'Please provide a description of the custom frequency'
          });
          isValid = false;
        } else {
          isValid = await form.trigger(['title', 'description', 'platform', 'productCategory', 'severity']);
        }
      } else {
        isValid = await form.trigger(['title', 'description', 'platform', 'productCategory', 'severity']);
      }
    } else if (currentStep === 2) {
      isValid = await form.trigger(['reproducible', 'reproductionSteps', 'actualBehavior']);
    } else if (currentStep === 3) {
      isValid = await form.trigger(['softwareVersion', 'osVersion', 'reportedBy']);
    } else if (currentStep === 4) {
      isValid = true; // Media is optional
    } else if (currentStep === 5) {
      isValid = await form.trigger(['acceptTerms']);
      if (isValid) {
        handleSubmit();
        return;
      }
    }
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and fill all required fields.",
        variant: "destructive"
      });
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Save draft function
  const saveDraft = () => {
    // In a real app, we would save to localStorage or to the server
    localStorage.setItem('issueFormDraft', JSON.stringify(form.getValues()));
    toast({
      title: "Draft Saved",
      description: "Your form draft has been saved successfully.",
      variant: "default"
    });
  };
  
  // Form submission handler
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare form data
      const formData = new FormData();
      
      // Add issue data as JSON
      formData.append('issueData', JSON.stringify(form.getValues()));
      
      // Add all media files
      photos.forEach(photo => {
        formData.append('files', photo);
      });
      
      if (video) {
        formData.append('files', video);
      }
      
      if (audio?.file) {
        formData.append('files', audio.file);
      }
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Send the data
      const response = await fetch('/api/issues', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Navigate to success page
      navigate(`/success/${result.ticketId}`);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit issue report",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="issue-title">Issue Title <span className="text-[#FF5630]">*</span></Label>
                <SpeechToText 
                  onTranscriptReceived={(transcript) => form.setValue('title', transcript, { shouldValidate: true })}
                  placeholder="Title"
                  fieldId="issue-title"
                />
              </div>
              <Input
                id="issue-title"
                placeholder="Brief description of the issue"
                {...form.register('title')}
                className={errors.title ? "border-[#FF5630]" : ""}
              />
              {errors.title && (
                <p className="text-sm text-[#FF5630]">{errors.title.message?.toString()}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="issue-description">Detailed Description <span className="text-[#FF5630]">*</span></Label>
                <SpeechToText 
                  onTranscriptReceived={(transcript) => form.setValue('description', transcript, { shouldValidate: true })}
                  placeholder="Description"
                  fieldId="issue-description"
                />
              </div>
              <Textarea
                id="issue-description"
                placeholder="Provide a comprehensive description of the issue"
                rows={4}
                {...form.register('description')}
                className={errors.description ? "border-[#FF5630]" : ""}
              />
              {errors.description && (
                <p className="text-sm text-[#FF5630]">{errors.description.message?.toString()}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="platform">Platform <span className="text-[#FF5630]">*</span></Label>
                <SpeechToText 
                  onTranscriptReceived={(transcript) => form.setValue('platform', transcript, { shouldValidate: true })}
                  placeholder="Platform"
                  fieldId="platform"
                />
              </div>
              <Input
                id="platform"
                placeholder="Enter platform name"
                {...form.register('platform')}
                className={errors.platform ? "border-[#FF5630]" : ""}
              />
              {errors.platform && (
                <p className="text-sm text-[#FF5630]">{errors.platform.message?.toString()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-category">Product Category <span className="text-[#FF5630]">*</span></Label>
              <Select 
                onValueChange={(value) => form.setValue('productCategory', value)} 
                value={form.watch('productCategory')}
              >
                <SelectTrigger className={errors.productCategory ? "border-[#FF5630]" : ""}>
                  <SelectValue placeholder="Select product category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pegasus">Pegasus</SelectItem>
                  <SelectItem value="pegasusX">Pegasus X</SelectItem>
                  <SelectItem value="mercury">Mercury</SelectItem>
                  <SelectItem value="titanium">Titanium</SelectItem>
                  <SelectItem value="antalya">Antalya</SelectItem>
                </SelectContent>
              </Select>
              {errors.productCategory && (
                <p className="text-sm text-[#FF5630]">{errors.productCategory.message?.toString()}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="issue-severity">Severity <span className="text-[#FF5630]">*</span></Label>
              <Select 
                onValueChange={(value) => form.setValue('severity', value)} 
                value={form.watch('severity')}
              >
                <SelectTrigger className={errors.severity ? "border-[#FF5630]" : ""}>
                  <SelectValue placeholder="Select severity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocker">Blocker - Prevents function</SelectItem>
                  <SelectItem value="critical">Critical - Major function affected</SelectItem>
                  <SelectItem value="major">Major - System performance affected</SelectItem>
                  <SelectItem value="minor">Minor - Non-essential function affected</SelectItem>
                  <SelectItem value="trivial">Trivial - Cosmetic issue</SelectItem>
                </SelectContent>
              </Select>
              {errors.severity && (
                <p className="text-sm text-[#FF5630]">{errors.severity.message?.toString()}</p>
              )}
            </div>

          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="issue-frequency">Frequency <span className="text-[#FF5630]">*</span></Label>
              <Select 
                onValueChange={(value) => form.setValue('frequency', value)} 
                value={form.watch('frequency')}
              >
                <SelectTrigger className={errors.frequency ? "border-[#FF5630]" : ""}>
                  <SelectValue placeholder="Select occurrence frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Always (100% of the time)</SelectItem>
                  <SelectItem value="often">Often (approximately 75% of the time)</SelectItem>
                  <SelectItem value="sometimes">Sometimes (approximately 50% of the time)</SelectItem>
                  <SelectItem value="rarely">Rarely (approximately 25% of the time)</SelectItem>
                  <SelectItem value="once">Once (unable to reproduce consistently)</SelectItem>
                  <SelectItem value="custom">Custom (specify below)</SelectItem>
                </SelectContent>
              </Select>
              {errors.frequency && (
                <p className="text-sm text-[#FF5630]">{errors.frequency.message?.toString()}</p>
              )}
            </div>
            
            {form.watch('frequency') === 'custom' && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="custom-frequency">Custom Frequency Description <span className="text-[#FF5630]">*</span></Label>
                  <SpeechToText 
                    onTranscriptReceived={(transcript) => form.setValue('customFrequencyDescription', transcript, { shouldValidate: true })}
                    placeholder="Frequency Description"
                    fieldId="custom-frequency"
                  />
                </div>
                <Textarea
                  id="custom-frequency"
                  placeholder="Please describe the frequency pattern of this issue"
                  rows={2}
                  {...form.register('customFrequencyDescription')}
                  className={errors.customFrequencyDescription ? "border-[#FF5630]" : ""}
                />
                {errors.customFrequencyDescription && (
                  <p className="text-sm text-[#FF5630]">{errors.customFrequencyDescription.message?.toString()}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Is the issue reproducible? <span className="text-[#FF5630]">*</span></Label>
              <RadioGroup 
                onValueChange={(value) => form.setValue('reproducible', value)} 
                value={form.watch('reproducible')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="r-yes" />
                  <Label htmlFor="r-yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="r-no" />
                  <Label htmlFor="r-no" className="font-normal">No</Label>
                </div>
              </RadioGroup>
              {errors.reproducible && (
                <p className="text-sm text-[#FF5630]">{errors.reproducible.message?.toString()}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="reproduction-steps">Steps to Reproduce <span className="text-[#FF5630]">*</span></Label>
                <SpeechToText 
                  onTranscriptReceived={(transcript) => form.setValue('reproductionSteps', transcript, { shouldValidate: true })}
                  placeholder="Steps"
                  fieldId="reproduction-steps"
                />
              </div>
              <Textarea
                id="reproduction-steps"
                placeholder="1. First step&#13;2. Second step&#13;3. Third step"
                rows={5}
                {...form.register('reproductionSteps')}
                className={errors.reproductionSteps ? "border-[#FF5630]" : ""}
              />
              <p className="text-sm text-neutral-500">Please provide detailed steps that someone else could follow to reproduce the issue.</p>
              {errors.reproductionSteps && (
                <p className="text-sm text-[#FF5630]">{errors.reproductionSteps.message?.toString()}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="expected-behavior">Expected Behavior</Label>
                <SpeechToText 
                  onTranscriptReceived={(transcript) => {
                    console.log("[IssueForm] Setting expectedBehavior to:", transcript);
                    form.setValue('expectedBehavior', transcript, { shouldValidate: true });
                  }}
                  placeholder="Expected Behavior"
                  fieldId="expected-behavior"
                />
              </div>
              <Textarea
                id="expected-behavior"
                placeholder="Describe what should happen when following the steps above"
                rows={3}
                value={form.watch('expectedBehavior') || ''}
                onChange={(e) => form.setValue('expectedBehavior', e.target.value, { shouldValidate: true })}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="actual-behavior">Actual Behavior <span className="text-[#FF5630]">*</span></Label>
                <SpeechToText 
                  onTranscriptReceived={(transcript) => {
                    console.log("[IssueForm] Setting actualBehavior to:", transcript);
                    form.setValue('actualBehavior', transcript, { shouldValidate: true });
                  }}
                  placeholder="Actual Behavior"
                  fieldId="actual-behavior"
                />
              </div>
              <Textarea
                id="actual-behavior"
                placeholder="Describe what actually happens when following the steps above"
                rows={3}
                className={errors.actualBehavior ? "border-[#FF5630]" : ""}
                value={form.watch('actualBehavior') || ''}
                onChange={(e) => form.setValue('actualBehavior', e.target.value, { shouldValidate: true })}
              />
              {errors.actualBehavior && (
                <p className="text-sm text-[#FF5630]">{errors.actualBehavior.message?.toString()}</p>
              )}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="software-version">Hardware Version <span className="text-[#FF5630]">*</span></Label>
                <SpeechToText 
                  onTranscriptReceived={(transcript) => {
                    console.log("[IssueForm] Setting softwareVersion to:", transcript);
                    form.setValue('softwareVersion', transcript, { shouldValidate: true });
                  }}
                  placeholder="Hardware Version"
                  fieldId="software-version"
                />
              </div>
              <Input
                id="software-version"
                placeholder="e.g., 2.4.1"
                className={errors.softwareVersion ? "border-[#FF5630]" : ""}
                value={form.watch('softwareVersion') || ''}
                onChange={(e) => form.setValue('softwareVersion', e.target.value, { shouldValidate: true })}
              />
              {errors.softwareVersion && (
                <p className="text-sm text-[#FF5630]">{errors.softwareVersion.message?.toString()}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="os-version">CNHOS Version</Label>
                <SpeechToText 
                  onTranscriptReceived={(transcript) => {
                    console.log("[IssueForm] Setting osVersion to:", transcript);
                    form.setValue('osVersion', transcript, { shouldValidate: true });
                  }}
                  placeholder="CNHOS Version"
                  fieldId="os-version"
                />
              </div>
              <Input
                id="os-version"
                placeholder="e.g., 10.15.7"
                value={form.watch('osVersion') || ''}
                onChange={(e) => form.setValue('osVersion', e.target.value, { shouldValidate: true })}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="additional-environment">Additional Environment Information</Label>
                <SpeechToText 
                  onTranscriptReceived={(transcript) => {
                    console.log("[IssueForm] Setting additionalEnvironment to:", transcript);
                    form.setValue('additionalEnvironment', transcript, { shouldValidate: true });
                  }}
                  placeholder="Environment Info"
                  fieldId="additional-environment"
                />
              </div>
              <Textarea
                id="additional-environment"
                placeholder="Any other relevant environment details (hardware, network configuration, etc.)"
                rows={3}
                value={form.watch('additionalEnvironment') || ''}
                onChange={(e) => form.setValue('additionalEnvironment', e.target.value, { shouldValidate: true })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="reported-by">Reported By <span className="text-[#FF5630]">*</span></Label>
                <SpeechToText 
                  onTranscriptReceived={(transcript) => {
                    console.log("[IssueForm] Setting reportedBy to:", transcript);
                    form.setValue('reportedBy', transcript, { shouldValidate: true });
                  }}
                  placeholder="Reported By"
                  fieldId="reported-by"
                />
              </div>
              <Input
                id="reported-by"
                placeholder="Enter your name or email"
                className={errors.reportedBy ? "border-[#FF5630]" : ""}
                value={form.watch('reportedBy') || ''}
                onChange={(e) => form.setValue('reportedBy', e.target.value, { shouldValidate: true })}
              />
              {errors.reportedBy && (
                <p className="text-sm text-[#FF5630]">{errors.reportedBy.message?.toString()}</p>
              )}
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <MediaUpload 
              type="photo"
              files={photos}
              setFiles={setPhotos}
              maxFiles={10}
              maxSize={10 * 1024 * 1024} // 10MB
              acceptedTypes="image/*"
            />
            
            <MediaUpload 
              type="video"
              files={video ? [video] : []}
              setFiles={(files) => setVideo(files.length > 0 ? files[0] : null)}
              maxFiles={1}
              maxSize={100 * 1024 * 1024} // 100MB
              acceptedTypes="video/*"
            />
            
            <AudioRecorder 
              audio={audio}
              setAudio={setAudio}
            />
            
            <FileUpload 
              files={files}
              setFiles={setFiles}
              maxFiles={5}
              maxSize={50 * 1024 * 1024} // 50MB
              acceptedTypes=".pdf,.txt,.log,.csv,.zip"
            />
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <ReviewSummary 
              formData={form.getValues()}
              photos={photos}
              video={video}
              audio={audio}
              files={files}
            />
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5 mt-1">
                  <Checkbox
                    id="terms"
                    checked={form.watch('acceptTerms')}
                    onCheckedChange={(checked) => {
                      form.setValue('acceptTerms', checked === true);
                    }}
                  />
                </div>
                <Label 
                  htmlFor="terms" 
                  className="ml-2 text-sm text-neutral-500"
                >
                  I confirm that all information provided is accurate to the best of my knowledge
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-[#FF5630]">{errors.acceptTerms.message?.toString()}</p>
              )}
              
              <div className="bg-neutral-100 p-4 rounded-md text-sm text-neutral-500">
                <p><strong>Note:</strong> Submitting this form will create a Jira ticket automatically. You'll receive a confirmation email with the ticket ID for tracking purposes.</p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      <StepperProgress 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        stepTitles={stepTitles}
      />
      
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5 md:p-6">
        {renderStep()}
        
        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 1 || isSubmitting}
          >
            Back
          </Button>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={isSubmitting}
            >
              Save Draft
            </Button>
            <Button
              onClick={goToNextStep}
              disabled={isSubmitting}
              className="bg-[#0052CC] hover:bg-[#0747A6]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : currentStep === totalSteps ? 'Submit' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default IssueForm;
