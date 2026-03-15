export function generateTitle(firstMessage: string): string {
  const title = firstMessage.slice(0, 50).trim();
  return title.length < firstMessage.trim().length ? `${title}...` : title;
}
