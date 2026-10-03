/** Shared contract for every external capability exposed to the future agent. */
export interface RailTool {
  id: string;
  name: string;
  description: string;
}

export interface RailAdapter {
  id: string;
  displayName: string;
  description: string;
  tools: readonly RailTool[];
}
