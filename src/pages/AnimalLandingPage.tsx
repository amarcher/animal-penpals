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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #faf5ef;
          color: #3a3226;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .landing { max-width: 640px; width: 100%; padding: 2rem 1.5rem; text-align: center; }
        .landing__back { display: inline-block; margin-bottom: 1.5rem; color: #8b7d6b; text-decoration: none; font-size: 0.9rem; }
        .landing__back:hover { text-decoration: underline; }
        .landing__emoji { font-size: 5rem; line-height: 1; margin-bottom: 1rem; }
        .landing__name { font-size: 2rem; font-weight: 700; margin-bottom: 0.25rem; color: ${animal.color}; }
        .landing__species { font-size: 1rem; color: #8b7d6b; margin-bottom: 1.5rem; }
        .landing__greeting {
          font-size: 1.15rem; line-height: 1.6; background: white; border-radius: 16px;
          padding: 1.5rem; margin-bottom: 1.5rem; border: 2px solid ${animal.color}33; font-style: italic;
        }
        .landing__traits { list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-bottom: 2rem; }
        .landing__trait {
          background: ${animal.color}1a; color: ${animal.color}; border: 1px solid ${animal.color}44;
          border-radius: 999px; padding: 0.4rem 1rem; font-size: 0.9rem; font-weight: 500;
        }
        .landing__cta {
          display: inline-block; background: ${animal.color}; color: white; text-decoration: none;
          font-size: 1.2rem; font-weight: 600; padding: 1rem 2.5rem; border-radius: 999px;
          transition: transform 0.15s, box-shadow 0.15s; box-shadow: 0 4px 12px ${animal.color}44;
        }
        .landing__cta:hover { transform: translateY(-2px); box-shadow: 0 6px 20px ${animal.color}55; }
        .landing__about { margin-top: 2.5rem; font-size: 0.95rem; line-height: 1.6; color: #6b5e4f; }
        .landing__about p { margin-bottom: 0.75rem; }
        .landing__about a { color: ${animal.color}; }
      ` }} />
    </head>
  );
}

function AnimalLandingBody({ animal }: Props) {
  const firstName = animal.name.split(' ')[0];

  return (
    <body>
      <main className="landing">
        <a href="/" className="landing__back">&larr; All Animal Penpals</a>
        <div className="landing__emoji">{animal.emoji}</div>
        <h1 className="landing__name">{animal.name}</h1>
        <p className="landing__species">{animal.species}</p>

        <blockquote className="landing__greeting">
          &ldquo;{animal.greeting}&rdquo;
        </blockquote>

        <ul className="landing__traits">
          {animal.traits.map(trait => (
            <li key={trait} className="landing__trait">{trait}</li>
          ))}
        </ul>

        <a href={`/compose/${animal.id}`} className="landing__cta">
          Write to {firstName}
        </a>

        <div className="landing__about">
          <p>
            {animal.name} is {animal.personality}. Write a letter and {firstName} will
            write back in character, with the reply read aloud word by word so kids can
            follow along.
          </p>
          <p>
            A voice writing coach named Scribbles can help kids who get stuck composing
            their letter.
          </p>
          <p><a href="/">Meet all 12 animal penpals &rarr;</a></p>
        </div>
      </main>
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
