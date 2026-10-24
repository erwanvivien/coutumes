import slugifyLib from 'slugify';

/** Lowercase, hyphenated, accent-stripped: "Boutique Lyon Part-Dieu" -> "boutique-lyon-part-dieu". */
export const slugify = (value: string): string => {
  const slug = slugifyLib(value, { lower: true, strict: true, trim: true });
  return slug === '' ? 'boutique' : slug;
};
