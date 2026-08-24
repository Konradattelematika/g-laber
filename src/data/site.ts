export const site = {
  title: 'G-Laber Podcast',
  domain: 'https://g-laber.com',
  claim: 'Jeden Donnerstag die geballte Prise „ach, alles halb so wild“.',
  description:
    'Roger G. (Comedian, Rostocker) und Jana Jansen (Comedian, Rheinländerin) haben einen Podcast. Hier sind alle Landratten und Kanalmäuse richtig. Jeden Donnerstag die geballte Prise „ach, alles halb so wild“.',
  email: 'hallo@g-laber.com',
  feedUrl: 'https://api.riverside.com/hosting/cJlDQPNZ.rss',
  platforms: {
    apple: 'https://podcasts.apple.com/de/podcast/g-laber-podcast/id6791220216',
    // TODO: direkten open.spotify.com/show/…-Link eintragen, sobald bekannt.
    spotify: 'https://creators.spotify.com/pod/profile/jana-jansen28/',
  },
  hosts: [
    {
      name: 'Roger G.',
      role: 'Comedian · Rostock',
      bio: 'Norddeutsche Schnauze, Mütze auf, Moin im Herzen. Comedian, Creator und der Beweis, dass man über alles reden kann — Hauptsache halb so wild.',
      image: '/img/roger.webp',
      links: [
        { label: 'Instagram', url: 'https://www.instagram.com/roger__g__/' },
        { label: 'Merch-Shop', url: 'https://g-maltes.de' },
      ],
    },
    {
      name: 'Jana Jansen',
      role: 'Comedian · Rheinland',
      bio: 'Stand-up-Comedian mit rheinischer Frohnatur und Berliner Bühnenalltag. Bringt die Pointen — und Roger regelmäßig aus dem Konzept.',
      image: '/img/jana.webp',
      links: [{ label: 'Instagram', url: 'https://www.instagram.com/janajansen_/' }],
    },
  ],
  production: { label: 'Platte Comedy', url: 'https://www.instagram.com/platte.comedy/' },
};
