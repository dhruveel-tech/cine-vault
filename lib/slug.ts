export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function movieSlug(title: string, releaseYear?: number) {
  const suffix = releaseYear ? `-${releaseYear}` : "";
  return slugify(`${title}${suffix}`);
}
