import type { RailAdapter } from "@/lib/rail-types";

/** Placeholder: Delhivery logistics capabilities will be registered here. */
export const delhiveryRail: RailAdapter = {
  id: "delhivery",
  displayName: "Delhivery",
  description: "Delivery creation, tracking, and status updates.",
  tools: [],
};

export type { DeliveryRequest, DeliveryStatus } from "./types";
