// Add TypeScript definitions for the Web Speech API and MediaRecorder
interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
  MediaRecorder: typeof MediaRecorder;
}