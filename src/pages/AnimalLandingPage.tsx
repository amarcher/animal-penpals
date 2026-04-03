import type { Animal } from '../types/app.ts';

const BASE_URL = 'https://animalpenpals.tech';

interface Props {
  animal: Animal;
}

function AnimalLandingHead({ animal }: Props) {
  const title = `Write to ${animal.name} | Animal Penpals`;
  const firstName = animal.name.split(' ')[0];
  const description = `${animal.name} is ${animal.personality}. Write a free pen pal letter and get an AI-powered reply read aloud in ${firstName}'s own voice.`;
  const keywords = `${animal.name.toLowerCase()}, ${animal.species.toLowerCase()} pen pal, write letter to ${animal.species.toLowerCase()}, kids writing, animal pen pal, letter writing for kids`;
  const url = `${BASE_URL}/animals/${animal.id}`;

  return (
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>

      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Animal Penpals" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Animal Penpals" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />

      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      <meta name="theme-color" content={animal.color} />

      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0897728874858477" crossOrigin="anonymous" />
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-HVZKSLGSF0" />
      <script dangerouslySetInnerHTML={{ __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-HVZKSLGSF0');
      ` }} />

      {/* Instant redirect to the compose view for real users */}
      <meta httpEquiv="refresh" content={`0;url=/compose/${animal.id}`} />
      <script dangerouslySetInnerHTML={{ __html: `window.location.replace('/compose/${animal.id}');` }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        url,
        description,
        isPartOf: {
          '@type': 'WebApplication',
          name: 'Animal Penpals',
          url: BASE_URL,
          applicationCategory: 'EducationalApplication',
        },
        about: {
          '@type': 'Thing',
          name: animal.name,
          description: `${animal.species} — ${animal.personality}`,
        },
      }) }} />

      <style dangerouslySetInnerHTML={{ __html: `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #faf5ef; color: #3a3226; text-align: center; padding: 2rem; }
        a { color: ${animal.color}; }
      ` }} />
    </head>
  );
}

function AnimalLandingBody({ animal }: Props) {
  return (
    <body>
      {/* Minimal body for crawlers / noscript fallback — users get redirected instantly */}
      <noscript>
        <h1>Write to {animal.name}</h1>
        <p>{animal.name} is {animal.personality}.</p>
        <p>{animal.greeting}</p>
        <p><a href={`/compose/${animal.id}`}>Write to {animal.name} &rarr;</a></p>
        <p><a href="/">Meet all 12 animal penpals</a></p>
      </noscript>
    </body>
  );
}

export function AnimalLandingPage({ animal }: Props) {
  return (
    <html lang="en">
      <AnimalLandingHead animal={animal} />
      <AnimalLandingBody animal={animal} />
    </html>
  );
}
