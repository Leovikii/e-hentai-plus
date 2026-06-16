export interface SiteAdapter {
  name: string;
  
  // Match the adapter against current URL or DOM
  match: (url: string, doc: Document) => boolean;

  // Initialize and get the initial page data
  init: (doc: Document) => Promise<{
    links: string[];         // Image viewer URLs or direct image URLs
    nextUrl: string | null;
    prevUrl: string | null;
    totalPage?: number;
  }>;

  // Given an image url/link, fetch the actual image URL
  resolveImage: (url: string, nlToken?: string) => Promise<{ src: string, nl?: string } | null>;

  // Fetch the next page and get its links
  fetchPage: (url: string) => Promise<{
    links: string[];
    nextUrl: string | null;
    prevUrl?: string | null;
  }>;

  // UI helpers
  getContainer: () => HTMLElement | null; // Used for float control positioning
  hideOriginalElements?: () => void;      // Hide original page elements for scroll mode
  getNativeImages?: () => HTMLElement[];  // Get original native image elements for positioning
}
