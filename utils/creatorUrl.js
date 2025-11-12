export function slugify(username) {
  return username.replace(/\./g, '-');
}

export function toCreatorUrl({ id, username }) {
  return `/c/${id}/${slugify(username)}`;
}
