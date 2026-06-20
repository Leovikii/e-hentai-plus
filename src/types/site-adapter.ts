export interface PageLink {
  url: string;
  thumb?: string;
}

export interface SiteAdapter {
  name: string;
  
  // Match the adapter against current URL or DOM
  match: (url: string, doc: Document) => boolean;

  // Initialize and get the initial page data
  init: (doc: Document) => Promise<{
    links: PageLink[];         // Image viewer URLs and thumbnails
    nextUrl: string | null;
    prevUrl: string | null;
    totalPage?: number;
  }>;

  // Given an image url/link, fetch the actual image URL
  resolveImage(url: string, ...args: any[]): Promise<{src: string, nl?: string} | null>;

  // Bump the priority of a currently loading/queued image
  bumpPriority?: (url: string) => void;

  // Fetch the next page and get its links
  fetchPage: (url: string) => Promise<{
    links: PageLink[];
    nextUrl: string | null;
    prevUrl?: string | null;
  }>;

  // UI helpers
  getContainer: () => HTMLElement | null; // Used for float control positioning
  hideOriginalElements?: () => void;      // Hide original page elements for scroll mode
  getNativeImages?: () => HTMLElement[];  // Get original native image elements for positioning
}
