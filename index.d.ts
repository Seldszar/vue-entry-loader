export interface FormatOptions {
  template?: string;
  selector?: string;
}

export function format(entry: string, options?: FormatOptions): string;
