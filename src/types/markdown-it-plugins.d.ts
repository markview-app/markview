// Type declarations for markdown-it plugins without official @types packages

declare module 'markdown-it-sub' {
  import type MarkdownIt from 'markdown-it';
  const markdownItSub: MarkdownIt.PluginSimple;
  export = markdownItSub;
}

declare module 'markdown-it-sup' {
  import type MarkdownIt from 'markdown-it';
  const markdownItSup: MarkdownIt.PluginSimple;
  export = markdownItSup;
}

declare module 'markdown-it-footnote' {
  import type MarkdownIt from 'markdown-it';
  const markdownItFootnote: MarkdownIt.PluginSimple;
  export = markdownItFootnote;
}

declare module 'markdown-it-abbr' {
  import type MarkdownIt from 'markdown-it';
  const markdownItAbbr: MarkdownIt.PluginSimple;
  export = markdownItAbbr;
}

declare module 'markdown-it-ins' {
  import type MarkdownIt from 'markdown-it';
  const markdownItIns: MarkdownIt.PluginSimple;
  export = markdownItIns;
}

declare module 'markdown-it-mark' {
  import type MarkdownIt from 'markdown-it';
  const markdownItMark: MarkdownIt.PluginSimple;
  export = markdownItMark;
}

declare module 'markdown-it-deflist' {
  import type MarkdownIt from 'markdown-it';
  const markdownItDeflist: MarkdownIt.PluginSimple;
  export = markdownItDeflist;
}

declare module 'markdown-it-container' {
  import type MarkdownIt from 'markdown-it';

  interface ContainerOptions {
    validate?: (params: string) => boolean | RegExpMatchArray | null;
    render?: (tokens: any[], idx: number, options?: any, env?: any, self?: any) => string;
    marker?: string;
  }

  const markdownItContainer: MarkdownIt.PluginWithOptions<ContainerOptions>;
  export = markdownItContainer;
}
