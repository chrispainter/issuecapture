import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, StopCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Debug flag to log actions
const DEBUG = true;

interface SpeechToTextProps {
  onTranscriptReceived: (transcript: string) => void;
  placeholder: string;
  fieldId: string;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ 
  onTranscriptReceived,
  placeholder,
  fieldId
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [hasError, setHasError] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Initialize speech recognition once on component mount
  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && 
        !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }
    
    if (DEBUG) console.log(`[SpeechToText] Initializing for field: ${fieldId}`);
    
    // Initialize the speech recognition instance
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    // Set a specific name for this recognition instance in the DOM
    recognitionRef.current.name = fieldId;
    
    // Configure recognition
    recognitionRef.current.continuous = false; // Changed to false to prevent overlapping recognitions
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US'; // Set language explicitly
    
    // Event handlers
    recognitionRef.current.onresult = (event: any) => {
      // First confirm this event is for this specific instance
      // This helps prevent cross-talk between instances
      if (recognitionRef.current && recognitionRef.current.name === fieldId) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        const transcriptText = finalTranscript || interimTranscript;
        setTranscript(transcriptText);
        
        if (transcriptText.trim() !== '') {
          if (DEBUG) console.log(`[SpeechToText] Field: ${fieldId}, Transcript: "${transcriptText}"`);
          if (DEBUG) console.log(`[SpeechToText] Sending transcript to ${fieldId}`);
          
          // Use a timeout to make sure React has time to process state updates
          setTimeout(() => {
            onTranscriptReceived(transcriptText);
          }, 0);
        }
      } else {
        if (DEBUG) console.log(`[SpeechToText] Ignoring result for ${recognitionRef.current?.name || 'unknown'} - expected ${fieldId}`);
      }
    };
    
    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use dictation",
          variant: "destructive",
        });
        setHasError(true);
      } else if (event.error === 'aborted') {
        // This can happen when the user has denied permission in the past
        // or when there are other issues with the microphone
        setHasError(true);
      }
      
      setIsListening(false);
    };
    
    recognitionRef.current.onend = () => {
      if (isListening && !hasError) {
        // Only try to restart if we're supposed to be listening and no errors
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error('Error restarting speech recognition', e);
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          if (DEBUG) console.log(`[SpeechToText] Cleaning up recognition for field: ${fieldId}`);
          recognitionRef.current.abort(); // More forceful than stop
          recognitionRef.current.stop();
          recognitionRef.current = null; // Clear the reference
        } catch (e) {
          // Ignore errors during cleanup
          console.log(`[SpeechToText] Cleanup error for field: ${fieldId}`, e);
        }
      }
    };
  }, [fieldId]); // Include fieldId in dependencies to ensure proper initialization and cleanup
  
  // Handle changes to isListening state
  useEffect(() => {
    if (isListening && recognitionRef.current) {
      try {
        if (DEBUG) console.log(`[SpeechToText] Starting recognition for field: ${fieldId}`);
        recognitionRef.current.start();
      } catch (e) {
        console.error(`[SpeechToText] Error starting speech recognition for field: ${fieldId}`, e);
        setIsListening(false);
        
        // Show an error toast if we couldn't start
        toast({
          title: "Speech recognition error",
          description: "Couldn't start the dictation. Please try again.",
          variant: "destructive",
        });
      }
    } else if (!isListening && recognitionRef.current) {
      try {
        if (DEBUG) console.log(`[SpeechToText] Stopping recognition for field: ${fieldId}`);
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
        console.log(`[SpeechToText] Error stopping speech recognition for field: ${fieldId}`, e);
      }
    }

    // Reset error state when we start listening again
    if (isListening) {
      setHasError(false);
    }
  }, [isListening, toast, fieldId]);
  
  const toggleListening = () => {
    // Check if user has already denied permission
    if (hasError) {
      toast({
        title: "Microphone permission required",
        description: "Please allow microphone access in your browser settings and try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (DEBUG) console.log(`[SpeechToText] Toggle listening for field: ${fieldId}, current state: ${isListening ? "listening" : "not listening"}`);
    
    // Toggle the listening state, the effect will handle the rest
    setIsListening(prev => !prev);
  };
  
  // Component for unsupported browsers
  if (!isSupported) {
    return (
      <Button 
        type="button" 
        variant="outline"
        size="sm" 
        className="h-6 text-xs py-0 px-2 text-neutral-400" 
        disabled
        title="Speech recognition is not supported in your browser"
      >
        <MicOff className="h-3 w-3 mr-1" />
        Unavailable
      </Button>
    );
  }
  
  // Error state
  if (hasError) {
    return (
      <Button 
        type="button" 
        variant="outline"
        size="sm" 
        className="h-6 text-xs py-0 px-2 text-red-500 border-red-200" 
        onClick={() => {
          setHasError(false);
          toast({
            title: "Retry microphone access",
            description: "Please allow microphone access when prompted",
          });
        }}
        title="Microphone access needed. Click to retry."
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        Retry
      </Button>
    );
  }
  
  // Normal state - either listening or not
  return (
    <div className="flex items-center">
      <Button 
        type="button" 
        variant="outline" 
        onClick={toggleListening}
        size="sm"
        className={`h-6 text-xs py-0 px-2 ${isListening ? "text-red-500 border-red-500 hover:text-red-600 hover:border-red-600" : ""}`}
        aria-label={isListening ? "Stop speech recognition" : "Start speech recognition"}
        title={isListening ? "Click to stop dictation" : `Click to start dictating ${placeholder.toLowerCase()}`}
      >
        {isListening ? (
          <>
            <StopCircle className="h-3 w-3 mr-1" />
            Stop
          </>
        ) : (
          <>
            <Mic className="h-3 w-3 mr-1" />
            Dictate
          </>
        )}
      </Button>
      
      {isListening && (
        <div className="ml-2 text-xs font-medium text-red-500 animate-pulse">
          Recording...
        </div>
      )}
    </div>
  );
};

export default SpeechToText;