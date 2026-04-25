export function cleanImageUrl(url?: string | null): string {
  if (!url) {
    return "/assets/mockups/mockups.png";
  }

  return url
    .trim()
    .replace(/\?$/, "") 
    .replace(/([^:]\/)\/+/g, "$1"); 
}