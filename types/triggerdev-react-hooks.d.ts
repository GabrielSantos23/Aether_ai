declare module "@trigger.dev/react-hooks" {
  // Temporary module declaration until upstream types are fixed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyExport: any;
  export default anyExport;
  // Named exports (common ones)
  // Provide a minimal generic signature so callers can supply type arguments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function useRealtimeTaskTrigger<TTask = any>(
    taskId: string,
    options: {
      accessToken: string;
      baseURL?: string;
    }
  ): any;
}
