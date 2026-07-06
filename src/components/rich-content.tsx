function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeFirstMatchingImageFigure(html: string, imageSrc?: string): string {
  if (!imageSrc) {
    return html;
  }

  const escapedSrc = escapeRegExp(imageSrc);
  const figurePattern = new RegExp(
    `<figure[^>]*>\\s*<img[^>]+src=["']${escapedSrc}["'][\\s\\S]*?<\\/figure>`,
    "i",
  );
  const imagePattern = new RegExp(
    `<img[^>]+src=["']${escapedSrc}["'][^>]*>`,
    "i",
  );

  if (figurePattern.test(html)) {
    return html.replace(figurePattern, "");
  }

  return html.replace(imagePattern, "");
}

export function RichContent({
  html,
  featuredImageSrc,
}: {
  html: string;
  featuredImageSrc?: string;
}) {
  const preparedHtml = removeFirstMatchingImageFigure(html, featuredImageSrc);

  return <div className="rich-copy" dangerouslySetInnerHTML={{ __html: preparedHtml }} />;
}
