// G-Laber — Audio-Player, mobile Navigation, Scroll-Reveals.
// Kein Framework, Vanilla, läuft erst nach dem Parsen (Astro lädt als Modul).

/* ------------------------------------------------------------------
   Audio-Player
   ------------------------------------------------------------------ */
const players = [...document.querySelectorAll('[data-player]')];

const fmt = (s) => {
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

for (const root of players) {
  const audio = root.querySelector('audio');
  const toggle = root.querySelector('[data-play]');
  const seek = root.querySelector('[data-seek]');
  const current = root.querySelector('[data-current]');

  const setFill = () => {
    const max = Number(seek.max) || 1;
    seek.style.setProperty('--fill', `${(Number(seek.value) / max) * 100}%`);
  };

  toggle.addEventListener('click', () => {
    if (audio.paused) {
      // Immer nur eine Folge gleichzeitig
      for (const other of players) {
        const a = other.querySelector('audio');
        if (a !== audio) a.pause();
      }
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => root.classList.add('is-playing'));
  audio.addEventListener('pause', () => root.classList.remove('is-playing'));
  audio.addEventListener('ended', () => {
    root.classList.remove('is-playing');
    seek.value = 0;
    current.textContent = '0:00';
    setFill();
  });

  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration)) seek.max = Math.floor(audio.duration);
  });

  let seeking = false;
  audio.addEventListener('timeupdate', () => {
    if (seeking) return;
    seek.value = Math.floor(audio.currentTime);
    current.textContent = fmt(audio.currentTime);
    setFill();
  });

  seek.addEventListener('input', () => {
    seeking = true;
    current.textContent = fmt(Number(seek.value));
    setFill();
  });
  seek.addEventListener('change', () => {
    audio.currentTime = Number(seek.value);
    seeking = false;
    if (audio.paused) toggle.click();
  });

  setFill();
}

/* ------------------------------------------------------------------
   Mobile Navigation (Vollbild-Overlay)
   ------------------------------------------------------------------ */
const navToggle = document.querySelector('[data-nav-toggle]');
const navOverlay = document.querySelector('[data-nav-overlay]');

if (navToggle && navOverlay) {
  const setNav = (open) => {
    navToggle.setAttribute('aria-expanded', String(open));
    navOverlay.hidden = !open;
    // Hintergrund nicht mitscrollen lassen, solange das Menü offen ist
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) navOverlay.querySelector('a')?.focus();
  };

  navToggle.addEventListener('click', () => {
    setNav(navToggle.getAttribute('aria-expanded') !== 'true');
  });

  // Nach dem Sprung zum Anker schließen
  navOverlay.addEventListener('click', (e) => {
    if (e.target.closest('a')) setNav(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      setNav(false);
      navToggle.focus();
    }
  });

  // Beim Wechsel auf Desktop-Breite aufräumen, sonst bleibt body gesperrt
  const desktop = matchMedia('(min-width: 52.0625rem)');
  desktop.addEventListener('change', (e) => {
    if (e.matches) setNav(false);
  });
}

/* ------------------------------------------------------------------
   Scroll-Reveals
   ------------------------------------------------------------------ */
if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  // Block-Reveals (ganze Elemente faden hoch)
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    // sanfter Stagger innerhalb einer Gruppe
    const group = el.closest('[data-reveal-group]');
    if (group) {
      const idx = [...group.querySelectorAll('[data-reveal]')].indexOf(el);
      el.style.setProperty('--reveal-delay', `${Math.min(idx * 0.08, 0.4)}s`);
    }
    io.observe(el);
  });

  // Kinetische Überschriften: Buchstaben-Reveal beim Eintritt in den Viewport
  const kio = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          kio.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.2 }
  );
  document.querySelectorAll('.kinetic.scroll').forEach((el) => kio.observe(el));
} else {
  document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
}
