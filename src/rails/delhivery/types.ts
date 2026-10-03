export interface DeliveryRequest {
  pickupAddress: string;
  deliveryAddress: string;
  itemDescription: string;
}

export type DeliveryStatus = "created" | "picked_up" | "in_transit" | "delivered" | "failed";
