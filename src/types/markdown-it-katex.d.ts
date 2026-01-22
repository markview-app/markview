// Type declarations for @iktakahiro/markdown-it-katex
// Updated fork that supports markdown-it v14

declare module '@iktakahiro/markdown-it-katex' {
  import type MarkdownIt from 'markdown-it';

  interface KatexOptions {
    throwOnError?: boolean;
    errorColor?: string;
    [key: string]: any;
  }

  const markdownItKatex: MarkdownIt.PluginWithOptions<KatexOptions>;
  export = markdownItKatex;
}
