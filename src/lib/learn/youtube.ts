/**
 * YouTube RSS feed parser for Serbia Latina channel.
 * Fetches videos from playlists or channel RSS — no API key needed.
 */
export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string; // hqdefault
  url: string;
  publishedAt: string;
}

const CHANNEL_ID = "UCTag1oXypTllNQgjcEpP2Ow";
const LEARNING_PLAYLIST = "PLwKs702l22eZMe7Wy_Mo79Rzs0jjA-lRW";
const NEWS_PLAYLIST = ""; // pendiente asignar

type Source = "learning" | "news" | "channel";

function getUrl(source: Source): string {
  switch (source) {
    case "learning":
      return `https://www.youtube.com/feeds/videos.xml?playlist_id=${LEARNING_PLAYLIST}`;
    case "news":
      return `https://www.youtube.com/feeds/videos.xml?playlist_id=${NEWS_PLAYLIST}`;
    case "channel":
      return `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
  }
}

export async function getPlaylistVideos(
  source: Source = "learning",
  limit = 6,
): Promise<YouTubeVideo[]> {
  try {
    const url = getUrl(source);
    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1h

    if (!res.ok) return [];

    const xml = await res.text();

    // Lightweight XML parsing with regex — avoids adding an XML parser dependency
    const entries = xml.split("<entry>").slice(1);

    return entries.slice(0, limit).map((entry) => {
      const id =
        entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "";
      const title =
        entry
          .match(/<title>([^<]+)<\/title>/)?.[1]
          ?.replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"') ?? "";
      const publishedAt =
        entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";

      const url = `https://www.youtube.com/shorts/${id}`;
      const thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      return { id, title, thumbnail, url, publishedAt };
    });
  } catch {
    return [];
  }
}
