import { getCreatorById } from '../../lib/db';
import { slugify } from '../../utils/creatorUrl';
export default async function handler(req, res) {
  const { id, slug } = req.query;
  const creator = await getCreatorById(id);
  if (!creator) {
    res.status(404).send('Not found');
    return;
  }
  const canonicalSlug = slugify(creator.username);
  if (slug !== canonicalSlug) {
    res.writeHead(301, { Location: `/c/${id}/${canonicalSlug}` });
    res.end();
    return;
  }
  // Render full HTML with meta, OG, JSON-LD, LCP, etc.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(renderCreatorHtml(creator));
}
