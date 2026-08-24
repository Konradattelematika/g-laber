// G-Laber — Player-Logik + Scroll-Reveals (kein Framework, ~2 KB)

// ---------- Audio-Player ----------
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

// ---------- Scroll-Reveals ----------
if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  document.querySelectorAll('[data-reveal]').forEach((el, i) => {
    // sanfter Stagger innerhalb einer Gruppe
    const group = el.closest('[data-reveal-group]');
    if (group) {
      const idx = [...group.querySelectorAll('[data-reveal]')].indexOf(el);
      el.style.setProperty('--reveal-delay', `${Math.min(idx * 0.09, 0.45)}s`);
    }
    io.observe(el);
  });
} else {
  document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
}
