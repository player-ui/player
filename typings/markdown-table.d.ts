declare module 'markdown-table' {
  export default function table(
    rows: string[][],
    options?: {
      align?: string[] | string;
    }
  ): string;
}
