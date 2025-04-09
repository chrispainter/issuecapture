import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, StopCircle, RefreshCw, ImagePlus, Video } from 'lucide-react';

interface CameraCaptureProps {
  mode: 'photo' | 'video';
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ 
  mode, 
  onCapture, 
  onClose 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: mode === 'video'
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        
        setHasPermission(true);
        setErrorMessage(null);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setHasPermission(false);
        
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setErrorMessage('Camera access denied. Please enable camera permissions in your browser settings.');
        } else {
          setErrorMessage('Error accessing camera. Make sure your device has a camera and try again.');
        }
      }
    };
    
    startCamera();
    
    // Clean up
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, mode]);
  
  // Handle timer for video recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };
  
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
        }
      }, 'image/jpeg', 0.9);
    }
  };
  
  const startRecording = () => {
    if (videoRef.current && stream) {
      chunksRef.current = [];
      
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      
      try {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      } catch (e) {
        try {
          // Fallback for Safari
          mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/mp4' });
        } catch (e) {
          // Last fallback
          mediaRecorderRef.current = new MediaRecorder(stream);
        }
      }
      
      mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });
      
      mediaRecorderRef.current.addEventListener('stop', () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
        onCapture(file);
      });
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleCaptureClick = () => {
    if (mode === 'photo') {
      takePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };
  
  return (
    <div className="camera-container bg-black relative rounded-lg overflow-hidden">
      {hasPermission === false && (
        <div className="flex flex-col items-center justify-center p-6 text-center text-white bg-gray-900 h-[360px]">
          <div className="mb-4 text-red-500">
            <Camera size={48} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
          <p className="text-sm text-gray-300 mb-4">{errorMessage}</p>
          <Button onClick={onClose} variant="secondary">Close Camera</Button>
        </div>
      )}
      
      {hasPermission === true && (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-auto"
          />
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 flex justify-between items-center">
            <Button 
              variant="ghost" 
              className="text-white" 
              size="icon"
              onClick={toggleCamera}
              title="Toggle camera"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            
            <Button 
              variant={isRecording ? "destructive" : "default"}
              className={isRecording ? "animate-pulse" : ""}
              size="lg"
              onClick={handleCaptureClick}
            >
              {mode === 'photo' ? (
                <>
                  <ImagePlus className="h-5 w-5 mr-2" />
                  Take Photo
                </>
              ) : isRecording ? (
                <>
                  <StopCircle className="h-5 w-5 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Video className="h-5 w-5 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              className="text-white" 
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
          
          {isRecording && (
            <div className="absolute top-0 left-0 right-0 p-2 bg-black bg-opacity-50 flex justify-center">
              <div className="text-red-500 flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-sm font-medium">{formatTime(timer)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CameraCapture;