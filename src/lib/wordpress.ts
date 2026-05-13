import { cacheLife } from "next/cache";

import { stripHtml } from "@/lib/utils";

type WpRenderedField = {
  rendered: string;
  protected?: boolean;
};

type WpMediaSize = {
  source_url: string;
  width?: number;
  height?: number;
};

export type WpMedia = {
  id: number;
  source_url: string;
  alt_text: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, WpMediaSize>;
  };
};

export type WpAuthor = {
  id: number;
  name: string;
  slug: string;
  description: string;
  avatar_urls?: Record<string, string>;
};

export type WpCategory = {
  id: number;
  count: number;
  name: string;
  slug: string;
  description?: string;
  parent: number;
  link?: string;
};

export type WpPost = {
  id: number;
  slug: string;
  date: string;
  modified: string;
  link: string;
  title: WpRenderedField;
  excerpt: WpRenderedField;
  content: WpRenderedField;
  categories: number[];
  tags: number[];
  featured_media: number;
  comment_status?: "open" | "closed" | string;
  _embedded?: {
    author?: WpAuthor[];
    "wp:featuredmedia"?: WpMedia[];
  };
};

export type WpComment = {
  id: number;
  post: number;
  parent: number;
  author: number;
  author_name: string;
  author_email?: string;
  author_avatar_urls?: Record<string, string>;
  date: string;
  link: string;
  status?: string;
  content: WpRenderedField;
};

export type WpPage = {
  id: number;
  slug: string;
  date: string;
  modified: string;
  link: string;
  title: WpRenderedField;
  excerpt: WpRenderedField;
  content: WpRenderedField;
  _embedded?: {
    author?: WpAuthor[];
    "wp:featuredmedia"?: WpMedia[];
  };
};

type WpMenu = {
  id: number;
  name: string;
  slug: string;
};

type WpMenuItem = {
  id: number;
  title: WpRenderedField;
  url: string;
  type_label: string;
  object: string;
  object_id: number;
  parent: number;
  menu_order: number;
};

type WpRoot = {
  name: string;
  description: string;
  url: string;
  home: string;
};

export type SiteIdentity = {
  name: string;
  description: string;
  url: string;
  home: string;
};

export type NavigationItem = {
  label: string;
  href: string;
  kind: "menu" | "category" | "page" | "anchor";
  external?: boolean;
};

export type HomeSection = {
  slug: string;
  label: string;
  description: string;
  accent: string;
  category: WpCategory | null;
  posts: WpPost[];
  href: string;
};

export type HomeCategoryShowcase = {
  category: WpCategory;
  description: string;
  posts: WpPost[];
  href: string;
};

export type SiteChromeData = {
  site: SiteIdentity;
  categories: WpCategory[];
  pages: WpPage[];
  navigation: NavigationItem[];
};

export type HomePageData = {
  site: SiteIdentity;
  categories: WpCategory[];
  pages: WpPage[];
  authors: WpAuthor[];
  latestPosts: WpPost[];
  featuredPost: WpPost | null;
  editorialPosts: WpPost[];
  sections: HomeSection[];
  categoryShowcases: HomeCategoryShowcase[];
};

const WORDPRESS_API_BASE = (
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ??
  "https://admin.segun2idioma.com/wp-json"
).replace(/\/$/, "");

const WORDPRESS_API_USERNAME = process.env.WORDPRESS_API_USERNAME?.trim();
const WORDPRESS_API_PASSWORD = process.env.WORDPRESS_API_PASSWORD?.replace(
  /\s+/g,
  "",
);

const WORDPRESS_AUTH_HEADER =
  WORDPRESS_API_USERNAME && WORDPRESS_API_PASSWORD
    ? `Basic ${Buffer.from(
        `${WORDPRESS_API_USERNAME}:${WORDPRESS_API_PASSWORD}`,
      ).toString("base64")}`
    : null;

const HOME_SECTION_BLUEPRINT = [
  {
    slug: "noticias",
    label: "Noticias",
    description: "Actualidad, análisis y contexto publicado en WordPress.",
    accent: "Actualidad",
  },
  {
    slug: "comunidad",
    label: "Comunidad",
    description: "Autores, voces y piezas que conectan la comunidad.",
    accent: "Red",
  },
  {
    slug: "eventos",
    label: "Eventos",
    description: "Encuentros, agenda y actividades del ecosistema Serbia Latina.",
    accent: "Agenda",
  },
  {
    slug: "trabajos",
    label: "Trabajos",
    description: "Oportunidades, anuncios y publicaciones laborales.",
    accent: "Trabajo",
  },
  {
    slug: "tienda",
    label: "Tienda",
    description: "Productos, recursos y publicaciones monetizables.",
    accent: "Shop",
  },
] as const;

const HOME_CATEGORY_SHOWCASE_LIMIT = 4;

export const hasWordPressCredentials = Boolean(WORDPRESS_AUTH_HEADER);

function buildWordPressUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${WORDPRESS_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

async function wpFetch<T>(
  path: string,
  options: {
    auth?: boolean;
    fallback?: T;
    method?: string;
    body?: unknown;
    cache?: RequestCache;
  } = {},
): Promise<T> {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    if (!WORDPRESS_AUTH_HEADER) {
      if ("fallback" in options) {
        return options.fallback as T;
      }

      throw new Error("Missing WordPress credentials.");
    }

    headers.set("Authorization", WORDPRESS_AUTH_HEADER);
  }

  const response = await fetch(buildWordPressUrl(path), {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache,
    headers,
    method: options.method ?? "GET",
  });

  if (!response.ok) {
    if ("fallback" in options) {
      return options.fallback as T;
    }

    throw new Error(
      `WordPress request failed for ${path} with status ${response.status}.`,
    );
  }

  return response.json() as Promise<T>;
}

function getFallbackSiteIdentity(): SiteIdentity {
  return {
    name: "Serbia Latina",
    description: "Portal dinámico conectado a WordPress.",
    url: "https://admin.segun2idioma.com",
    home: "https://admin.segun2idioma.com",
  };
}

function uniqueNavigation(items: NavigationItem[]): NavigationItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.label}|${item.href}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildFallbackNavigation(
  categories: WpCategory[],
  pages: WpPage[],
): NavigationItem[] {
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));

  const sectionItems = HOME_SECTION_BLUEPRINT.map((section) => {
    const category = categoryMap.get(section.slug);
    const isJobsSection = section.slug === "trabajos";
    const isStoreSection = section.slug === "tienda";

    return {
      label: section.label,
      href: isJobsSection
        ? "/trabajos"
        : isStoreSection
          ? "/tienda"
          : category
            ? `/categorias/${category.slug}`
            : `/#${section.slug}`,
      kind: isJobsSection || isStoreSection ? "anchor" : category ? "category" : "anchor",
    } as NavigationItem;
  });

  const pageItems = pages.slice(0, 3).map((page) => ({
    label: stripHtml(page.title.rendered),
    href: `/paginas/${page.slug}`,
    kind: "page" as const,
  }));

  return uniqueNavigation([
    {
      label: "Inicio",
      href: "/",
      kind: "anchor",
    },
    ...sectionItems,
    ...pageItems,
  ]);
}

function mapWordPressMenuItem(
  item: WpMenuItem,
  categories: WpCategory[],
  pages: WpPage[],
): NavigationItem {
  const page = pages.find((entry) => entry.id === item.object_id);
  const category = categories.find((entry) => entry.id === item.object_id);
  const wpDomain = new URL(getFallbackSiteIdentity().url).host;
  const isWordPressUrl = item.url.includes(wpDomain);

  if (page) {
    return {
      label: stripHtml(item.title.rendered),
      href: `/paginas/${page.slug}`,
      kind: "menu",
    };
  }

  if (category) {
    const isJobsCategory = category.slug === "trabajos";

    return {
      label: stripHtml(item.title.rendered),
      href: isJobsCategory ? "/trabajos" : `/categorias/${category.slug}`,
      kind: "menu",
    };
  }

  if (isWordPressUrl) {
    const url = new URL(item.url);

    if (url.pathname === "/") {
      return {
        label: stripHtml(item.title.rendered),
        href: "/",
        kind: "menu",
      };
    }
  }

  return {
    label: stripHtml(item.title.rendered),
    href: item.url,
    kind: "menu",
    external: /^https?:\/\//.test(item.url),
  };
}

function extractFirstImageFromHtml(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

export function getFeaturedMedia(entity: WpPost | WpPage | null): WpMedia | null {
  const featuredMedia = entity?._embedded?.["wp:featuredmedia"]?.[0];

  if (featuredMedia) {
    return featuredMedia;
  }

  const fallbackImage = extractFirstImageFromHtml(entity?.content?.rendered) ?? extractFirstImageFromHtml(entity?.excerpt?.rendered);

  return fallbackImage
    ? {
        id: 0,
        source_url: fallbackImage,
        alt_text: stripHtml(entity?.title.rendered),
      }
    : null;
}

export function getPrimaryAuthor(entity: WpPost | WpPage | null): WpAuthor | null {
  return entity?._embedded?.author?.[0] ?? null;
}

export function getPrimaryCategory(
  post: WpPost,
  categories: WpCategory[],
): WpCategory | null {
  return categories.find((category) => post.categories.includes(category.id)) ?? null;
}

export async function getSiteIdentity(): Promise<SiteIdentity> {
  "use cache";

  cacheLife("hours");

  const root = await wpFetch<WpRoot>("/", {
    fallback: getFallbackSiteIdentity(),
  });

  return {
    name: root.name || "Serbia Latina",
    description: root.description || "Portal dinámico conectado a WordPress.",
    url: root.url || getFallbackSiteIdentity().url,
    home: root.home || getFallbackSiteIdentity().home,
  };
}

export async function getAllCategories(): Promise<WpCategory[]> {
  "use cache";

  cacheLife("minutes");

  const categories = await wpFetch<WpCategory[]>(
    "/wp/v2/categories?per_page=100&orderby=count&order=desc",
    { fallback: [] },
  );

  return categories.sort((left, right) => right.count - left.count);
}

export async function getAllPages(): Promise<WpPage[]> {
  "use cache";

  cacheLife("hours");

  return wpFetch<WpPage[]>(
    "/wp/v2/pages?per_page=50&orderby=menu_order&order=asc&_embed=1",
    { fallback: [] },
  );
}

export async function getAllAuthors(): Promise<WpAuthor[]> {
  "use cache";

  cacheLife("minutes");

  return wpFetch<WpAuthor[]>(
    "/wp/v2/users?per_page=50&orderby=name&order=asc",
    { fallback: [] },
  );
}

export async function getLatestPosts(limit = 6): Promise<WpPost[]> {
  "use cache";

  cacheLife("minutes");

  return wpFetch<WpPost[]>(
    `/wp/v2/posts?per_page=${limit}&orderby=date&order=desc&_embed=1`,
    { fallback: [] },
  );
}

export async function getCategoryBySlug(slug: string): Promise<WpCategory | null> {
  "use cache";

  cacheLife("hours");

  const categories = await wpFetch<WpCategory[]>(
    `/wp/v2/categories?slug=${encodeURIComponent(slug)}`,
    { fallback: [] },
  );

  return categories[0] ?? null;
}

export async function getPostsByCategoryId(
  categoryId: number,
  limit = 6,
): Promise<WpPost[]> {
  "use cache";

  cacheLife("minutes");

  return wpFetch<WpPost[]>(
    `/wp/v2/posts?categories=${categoryId}&per_page=${limit}&orderby=date&order=desc&_embed=1`,
    { fallback: [] },
  );
}

export async function getPostBySlug(slug: string): Promise<WpPost | null> {
  "use cache";

  cacheLife("minutes");

  const posts = await wpFetch<WpPost[]>(
    `/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1`,
    { fallback: [] },
  );

  return posts[0] ?? null;
}

export async function getRelatedPosts(
  categoryIds: number[],
  excludePostId: number,
  limit = 3,
): Promise<WpPost[]> {
  "use cache";

  cacheLife("minutes");

  if (!categoryIds.length) {
    return [];
  }

  const posts = await wpFetch<WpPost[]>(
    `/wp/v2/posts?categories=${categoryIds[0]}&per_page=${limit + 1}&orderby=date&order=desc&_embed=1`,
    { fallback: [] },
  );

  return posts.filter((post) => post.id !== excludePostId).slice(0, limit);
}

export function areCommentsOpen(post: Pick<WpPost, "comment_status">): boolean {
  return post.comment_status !== "closed";
}

export async function getPostComments(postId: number): Promise<WpComment[]> {
  return wpFetch<WpComment[]>(
    `/wp/v2/comments?post=${postId}&per_page=100&orderby=date&order=asc`,
    { fallback: [], cache: "no-store" },
  );
}

export async function getCommentById(commentId: number): Promise<WpComment | null> {
  return wpFetch<WpComment | null>(`/wp/v2/comments/${commentId}?context=edit`, {
    auth: true,
    fallback: null,
    cache: "no-store",
  });
}

export async function createWordPressComment(input: {
  postId: number;
  parentId?: number;
  authorId: number;
  authorName: string;
  authorEmail: string;
  content: string;
}): Promise<WpComment> {
  return wpFetch<WpComment>("/wp/v2/comments", {
    auth: true,
    method: "POST",
    cache: "no-store",
    body: {
      post: input.postId,
      parent: input.parentId ?? 0,
      author: input.authorId,
      author_name: input.authorName,
      author_email: input.authorEmail,
      content: input.content,
    },
  });
}

export async function getCommentsByAuthor(authorId: number): Promise<WpComment[]> {
  return wpFetch<WpComment[]>(
    `/wp/v2/comments?author=${authorId}&per_page=100&orderby=date&order=desc&context=edit`,
    { auth: true, fallback: [], cache: "no-store" },
  );
}

export async function getRepliesToComments(parentIds: number[]): Promise<WpComment[]> {
  if (!parentIds.length) {
    return [];
  }

  const replies = await Promise.all(
    parentIds.map((parentId) =>
      wpFetch<WpComment[]>(
        `/wp/v2/comments?parent=${parentId}&per_page=100&orderby=date&order=desc&context=edit`,
        { auth: true, fallback: [], cache: "no-store" },
      ),
    ),
  );

  return replies.flat().sort((left, right) => Date.parse(right.date) - Date.parse(left.date));
}

export async function getPostsByIds(postIds: number[]): Promise<Array<Pick<WpPost, "id" | "slug" | "title">>> {
  if (!postIds.length) {
    return [];
  }

  return wpFetch<Array<Pick<WpPost, "id" | "slug" | "title">>>(
    `/wp/v2/posts?include=${postIds.join(",")}&per_page=${postIds.length}&_fields=id,slug,title`,
    { fallback: [], cache: "no-store" },
  );
}

export function getCommentExcerpt(comment: WpComment, maxLength = 140): string {
  const text = stripHtml(comment.content.rendered);
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

export async function getPageBySlug(slug: string): Promise<WpPage | null> {
  "use cache";

  cacheLife("hours");

  const pages = await wpFetch<WpPage[]>(
    `/wp/v2/pages?slug=${encodeURIComponent(slug)}&_embed=1`,
    { fallback: [] },
  );

  return pages[0] ?? null;
}

export async function getSiteChromeData(): Promise<SiteChromeData> {
  "use cache";

  cacheLife("hours");

  const [site, categories, pages] = await Promise.all([
    getSiteIdentity(),
    getAllCategories(),
    getAllPages(),
  ]);

  const menus = await wpFetch<WpMenu[]>("/wp/v2/menus?per_page=20", {
    auth: true,
    fallback: [],
  });

  if (!menus.length) {
    return {
      site,
      categories,
      pages,
      navigation: buildFallbackNavigation(categories, pages),
    };
  }

  const menuItems = await wpFetch<WpMenuItem[]>(
    `/wp/v2/menu-items?menus=${menus[0].id}&per_page=100`,
    {
      auth: true,
      fallback: [],
    },
  );

  const navigation =
    menuItems.length > 0
      ? uniqueNavigation(
          menuItems
            .filter((item) => item.parent === 0)
            .sort((left, right) => left.menu_order - right.menu_order)
            .map((item) => mapWordPressMenuItem(item, categories, pages)),
        )
      : buildFallbackNavigation(categories, pages);

  return {
    site,
    categories,
    pages,
    navigation,
  };
}

export async function getHomePageData(): Promise<HomePageData> {
  "use cache";

  cacheLife("minutes");

  const [site, categories, pages, authors, latestPosts] = await Promise.all([
    getSiteIdentity(),
    getAllCategories(),
    getAllPages(),
    getAllAuthors(),
    getLatestPosts(12),
  ]);

  const categoryMap = new Map(categories.map((category) => [category.slug, category]));
  const showcaseCategories = categories
    .filter((category) => category.count > 0 && category.slug !== "sin-categoria")
    .slice(0, HOME_CATEGORY_SHOWCASE_LIMIT);

  const [sections, categoryShowcases] = await Promise.all([
    Promise.all(
      HOME_SECTION_BLUEPRINT.map(async (section) => {
        const category = categoryMap.get(section.slug) ?? null;
        const posts = category ? await getPostsByCategoryId(category.id, 3) : [];

        return {
          ...section,
          category,
          posts,
          href: category ? `/categorias/${category.slug}` : `/#${section.slug}`,
        };
      }),
    ),
    Promise.all(
      showcaseCategories.map(async (category) => {
        const posts = await getPostsByCategoryId(category.id, 6);

        return {
          category,
          description:
            category.description?.trim() ||
            `Cobertura dinámica para ${category.name} conectada directamente a WordPress.`,
          posts,
          href: `/categorias/${category.slug}`,
        };
      }),
    ),
  ]);

  return {
    site,
    categories,
    pages,
    authors,
    latestPosts,
    featuredPost: latestPosts[0] ?? null,
    editorialPosts: latestPosts.slice(1, 4),
    sections,
    categoryShowcases: categoryShowcases.filter((showcase) => showcase.posts.length > 0),
  };
}

export async function getAllPostSlugs(): Promise<string[]> {
  "use cache";

  cacheLife("days");

  const posts = await wpFetch<Array<Pick<WpPost, "slug">>>(
    "/wp/v2/posts?per_page=100&_fields=slug",
    { fallback: [] },
  );

  return posts.map((post) => post.slug);
}

export async function getAllPageSlugs(): Promise<string[]> {
  "use cache";

  cacheLife("days");

  const pages = await wpFetch<Array<Pick<WpPage, "slug">>>(
    "/wp/v2/pages?per_page=100&_fields=slug",
    { fallback: [] },
  );

  return pages.map((page) => page.slug);
}

export async function getAllCategorySlugs(): Promise<string[]> {
  "use cache";

  cacheLife("days");

  const categories = await wpFetch<Array<Pick<WpCategory, "slug">>>(
    "/wp/v2/categories?per_page=100&_fields=slug",
    { fallback: [] },
  );

  return categories.map((category) => category.slug);
}
