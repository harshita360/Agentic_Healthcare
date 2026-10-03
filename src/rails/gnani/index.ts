import type { RailAdapter } from "@/lib/rail-types";

/** Placeholder: Gnani voice capabilities will be registered here. */
export const gnaniRail: RailAdapter = {
  id: "gnani",
  displayName: "Gnani",
  description: "Voice interaction and call coordination.",
  tools: [],
};

export type { VoiceCallRequest, VoiceCallStatus } from "./types";
