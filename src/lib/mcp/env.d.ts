// Ambient declarations for the MCP tool runtime (bundled to a Deno function; `process` is a Deno shim).
declare global {
  const process: {
    env: Record<string, string | undefined>;
  };
}
export {};
