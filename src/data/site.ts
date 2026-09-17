export const site = {
  title: 'G-Laber Podcast',
  domain: 'https://g-laber.com',
  claim: 'Jeden Donnerstag die geballte Prise „ach, alles halb so wild“.',
  /** Zeile über dem Wortbild — wie auf dem Cover */
  supertitle: 'Der Podcast mit',
  description:
    'Jana Jansen (Comedian, Rheinländerin) und Roger G. (Comedian, Rostocker) haben einen Podcast. Hier sind alle Landratten und Kanalmäuse richtig. Jeden Donnerstag die geballte Prise „ach, alles halb so wild“.',
  email: 'hallo@g-laber.com',
  feedUrl: 'https://anchor.fm/s/1160ba830/podcast/rss',
  platforms: {
    apple: 'https://podcasts.apple.com/de/podcast/g-laber-podcast/id6791220216',
    spotify: 'https://open.spotify.com/show/033Pnbk0HOhbeO0fyBfsCs',
  },
  /** Reihenfolge und Farbzuordnung wie auf dem Cover: Jana orange, Roger pink. */
  hosts: [
    {
      id: 'jana',
      name: 'Jana Jansen',
      role: 'Comedian · Rheinland',
      tone: 'orange' as const,
      bio: 'Stand-up-Comedian mit rheinischer Frohnatur und Berliner Bühnenalltag. Bringt die Pointen — und Roger regelmäßig aus dem Konzept.',
      image: '/img/jana.webp',
      links: [
        { label: 'Instagram', url: 'https://www.instagram.com/janajansen_/' },
        { label: 'Tickets', url: 'https://www.janajansen.de/items' },
      ],
    },
    {
      id: 'roger',
      name: 'Roger G.',
      role: 'Comedian · Rostock',
      tone: 'pink' as const,
      bio: 'Norddeutsche Schnauze, Mütze auf, Moin im Herzen. Comedian, Creator und der Beweis, dass man über alles reden kann — Hauptsache halb so wild.',
      image: '/img/roger.webp',
      links: [
        { label: 'Instagram', url: 'https://www.instagram.com/roger__g__/' },
        { label: 'Merch-Shop', url: 'https://g-maltes.de' },
      ],
    },
  ],
  production: { label: 'Platte Comedy', url: 'https://www.instagram.com/platte.comedy/' },

  /**
   * Anbieter- und Verantwortlichen-Angaben für Impressum und Datenschutz.
   * Identisch mit dem Shop g-maltes.de — dieselbe Person, dieselbe Firma.
   * Anschrift aus dem dortigen Impressum (§ 5 DDG ist dafür die maßgebliche
   * Quelle; die Datenschutzseite des Shops nennt abweichend „Platz d.
   * Freundschaft 11-13“ — das ist dort zu klären).
   */
  legal: {
    company: 'Roger G',
    owner: 'Gregor Kurtz',
    street: 'Friedrichshöhe 3',
    postalCode: '18059',
    city: 'Rostock',
    country: 'Deutschland',
    /** Stand der Rechtstexte, wird auf den Seiten ausgewiesen */
    updated: '17. September 2026',
  },
};

/** Host per id holen — die Reihenfolge im Array ist gestalterisch, nicht stabil. */
export const host = (id: 'jana' | 'roger') => site.hosts.find((h) => h.id === id)!;
