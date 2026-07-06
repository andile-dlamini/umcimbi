// Ambient declarations for the MCP tool runtime (Deno function via process shim).
declare const process: {
  env: Record<string, string | undefined>;
};
