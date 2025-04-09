import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mic, Play, Pause, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  audio: { file: File; duration: string } | null;
  setAudio: (audio: { file: File; duration: string } | null) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ audio, setAudio }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        
        // Create a File object
        const audioFile = new File([audioBlob], 'voice-note.webm', {
          type: 'audio/webm',
          lastModified: Date.now()
        });
        
        // Update state
        setAudioUrl(url);
        setAudio({ file: audioFile, duration: formatTime(recordingTime) });
        
        // Clean up the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record audio.",
        variant: "destructive"
      });
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  // Toggle recording state
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Toggle audio playback
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle playback events
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
    
    return () => {
      // Clean up audio URL on unmount
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  // Delete audio recording
  const deleteAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudio(null);
    setIsPlaying(false);
  };
  
  return (
    <div className="form-field">
      <Label className="block text-sm font-medium mb-2">Voice Note</Label>
      <div className="border rounded-lg p-4">
        {!audio ? (
          <div className="flex items-center">
            <Button 
              type="button" 
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                isRecording ? 'bg-[#FF5630] hover:bg-[#FF5630]/90' : 'bg-[#0052CC] hover:bg-[#0747A6]'
              }`}
              onClick={toggleRecording}
            >
              <Mic className="h-5 w-5" />
            </Button>
            <div className="ml-4">
              <div className="text-sm font-medium text-textPrimary">
                {isRecording ? 'Recording...' : 'Click to record audio'}
              </div>
              <div className="text-xs text-neutral-500">
                {formatTime(recordingTime)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-neutral-100 rounded-lg">
            <div className="flex items-center">
              <Button 
                type="button" 
                className="h-8 w-8 rounded-full bg-[#0052CC] hover:bg-[#0747A6]"
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="ml-3">
                <div className="text-sm">Voice Note <span className="text-neutral-500 text-xs">({audio.duration})</span></div>
              </div>
            </div>
            <Button 
              type="button" 
              variant="ghost"
              size="icon"
              className="text-neutral-500 hover:text-[#FF5630]"
              onClick={deleteAudio}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Hidden audio element for playback */}
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} className="hidden" />
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
