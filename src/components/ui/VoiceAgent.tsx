import type { MicError, VoiceStatus } from '../../hooks/usePenpalConversation.ts';
import './VoiceAgent.css';

interface VoiceAgentProps {
  status: VoiceStatus;
  isSpeaking: boolean;
  onToggle: () => void;
  micError: MicError;
  onDismissError: () => void;
}

function SparkleIcon() {
  // 4-pointed star / AI sparkle
  return (
    <svg className="voice-agent__sparkle-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M12 1C12.5 8 16 11.5 23 12C16 12.5 12.5 16 12 23C11.5 16 8 12.5 1 12C8 11.5 11.5 8 12 1Z" />
    </svg>
  );
}

const MIC_ERROR_MESSAGES: Record<NonNullable<MicError>, string> = {
  timeout:
    'Microphone not responding. Try quitting audio apps, then restart your browser.',
  'not-allowed':
    'Microphone access denied. Please allow microphone access in your browser settings and try again.',
  device:
    "Couldn't access your microphone. Please check that a microphone is connected.",
  'no-input':
    'No audio input detected. Your microphone may be muted or the wrong device is selected.',
};

export function VoiceAgent({ status, isSpeaking, onToggle, micError, onDismissError }: VoiceAgentProps) {
  const orbClass = [
    'voice-agent__orb',
    status === 'connecting' && 'voice-agent__orb--connecting',
    status === 'connected' && !isSpeaking && 'voice-agent__orb--listening',
    status === 'connected' && isSpeaking && 'voice-agent__orb--speaking',
  ].filter(Boolean).join(' ');

  const containerClass = [
    'voice-agent__orb-container',
    isSpeaking && 'voice-agent__orb-container--speaking',
  ].filter(Boolean).join(' ');

  return (
    <div className="voice-agent">
      <div className={containerClass}>
        <button className={orbClass} aria-label="Talk to Scribbles" onClick={onToggle} type="button">
          <SparkleIcon />
        </button>
        <div className="voice-agent__wave" />
        <div className="voice-agent__wave" />
        <div className="voice-agent__wave" />
      </div>
      {micError && (
        <button
          className="voice-agent__error"
          onClick={onDismissError}
          type="button"
          aria-label="Dismiss microphone error"
        >
          {MIC_ERROR_MESSAGES[micError]}
        </button>
      )}
    </div>
  );
}
