import type { CareAddress, LabCandidate, LabRecommendation } from "@/lib/types";
import { getDelhiveryMapsAdapter } from "./maps";

export async function standardizeCareAddress(rawAddress: string): Promise<CareAddress> { const adapter = getDelhiveryMapsAdapter(); const [standardized, validation, location] = await Promise.all([adapter.standardizeAddress(rawAddress), adapter.validateAddress(rawAddress), adapter.geocodeAddress(rawAddress)]); return { rawAddress, ...standardized, validation, location, source: adapter.source }; }
export async function rankSuitableLabs(address: CareAddress, labAddresses: string[]): Promise<LabRecommendation> {
  if (!address.location) throw new Error("Confirm a complete care address before comparing labs.");
  if (labAddresses.length !== 3 || labAddresses.some((lab) => !lab.trim())) throw new Error("Enter all three lab addresses before fetching verified labs.");
  const candidates: LabCandidate[] = await Promise.all(labAddresses.map(async (rawAddress, index) => ({ id: `lab-${index + 1}`, name: `Lab ${index + 1}`, address: await standardizeCareAddress(rawAddress) })));
  const verifiable = candidates.filter((candidate) => candidate.address.validation.quality === "ok" && candidate.address.location);
  const adapter = getDelhiveryMapsAdapter();
  const distances = await adapter.calculateDistances(address.location, verifiable.map((candidate) => ({ id: candidate.id, location: candidate.address.location! })));
  const byLab = new Map(distances.map((distance) => [distance.labId, distance.kilometers]));
  const ranked = verifiable.map((lab) => ({ ...lab, distanceKilometers: byLab.get(lab.id) ?? Infinity })).sort((a, b) => a.distanceKilometers - b.distanceKilometers);
  const unverified = candidates.filter((candidate) => !verifiable.some((verified) => verified.id === candidate.id));
  return { selected: ranked[0], ranked, unverified, source: adapter.source, rationale: ranked[0] ? `${ranked[0].name} has a complete verified address and is the nearest verified candidate. This is a logistical comparison only.` : "None of the supplied lab addresses were complete enough to verify and compare." };
}
