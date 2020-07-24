export interface FormatOptions {
  template?: string;
  selector?: string;
}

export function format(entry: string, options?: FormatOptions): string;

export interface VueEntryPluginOptions extends FormatOptions {
  test: string | RegExp | Array<string | RegExp>;
}

export class VueEntryPlugin {
  constructor(options?: VueEntryPluginOptions);
}
