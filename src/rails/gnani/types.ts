export interface VoiceCallRequest {
  recipientId: string;
  purpose: string;
}

export type VoiceCallStatus = "queued" | "connected" | "completed" | "failed";
