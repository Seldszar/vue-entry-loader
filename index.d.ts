export interface FormatOptions {
  template?: string;
  selector?: string;
}

export function format(entry: string, options?: FormatOptions): string;

export class VueEntryPlugin {
  constructor(options: FormatOptions);
}
