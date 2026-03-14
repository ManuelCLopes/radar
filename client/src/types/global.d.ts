interface Window { IS_E2E?: boolean; }

declare module "@vercel/analytics/react" {
  export function Analytics(props: Record<string, never>): JSX.Element | null;
}
