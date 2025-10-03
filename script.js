import songs from "./songs.js";

const player = document.querySelector("#player");
const musicName = document.querySelector("#musicName");
const playPauseButton = document.querySelector("#playPauseButton");
const prevButton = document.querySelector("#prevButton");
const nextButton = document.querySelector("#nextButton");
const currentTimeEl = document.querySelector("#currentTime");
const durationEl = document.querySelector("#duration");
const cover = document.querySelector("#cover");
const body = document.querySelector("body");

const progressBar =
  document.querySelector("#progress-bar") ||
  document.querySelector(".progress-bar");
const progress =
  document.querySelector("#progress") || document.querySelector(".progress");

const textButtonPlay = `<i class="bx bx-caret-right"></i>`;
const textButtonPause = `<i class="bx bx-pause"></i>`;

let index = 0;
let isPlaying = false;
let isDragging = false;

const formatTime = (time = 0) => {
  if (!isFinite(time) || time <= 0) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
};

const updatePlayButton = () => {
  if (playPauseButton)
    playPauseButton.innerHTML = isPlaying ? textButtonPause : textButtonPlay;
};

const playPause = async () => {
  if (!player) return;
  if (!player.src) prevNextMusic("init");
  try {
    if (isPlaying) {
      player.pause();
      isPlaying = false;
    } else {
      await player.play();
      isPlaying = true;
    }
  } catch (err) {
    console.error("Erro ao tentar tocar:", err);
    isPlaying = false;
  }
  updatePlayButton();
};

const prevNextMusic = async (type = "next") => {
  if (!Array.isArray(songs) || songs.length === 0) return;

  if ((type === "next" && index + 1 === songs.length) || type === "init")
    index = 0;
  else if (type === "prev" && index === 0) index = songs.length - 1;
  else index = type === "prev" ? index - 1 : index + 1;

  player.src = songs[index].src;
  if (musicName) musicName.textContent = songs[index].name || "";
  cover.src = songs[index].img;

  body.style.setProperty("--bg-image", `url(${songs[index].img})`);
  document.body.style.backgroundImage = `url(${songs[index].img})`;

  player.load();
  if (currentTimeEl) currentTimeEl.textContent = "0:00";
  if (durationEl) durationEl.textContent = "0:00";
  if (progress) progress.style.width = "0%";

  if (type !== "init") {
    try {
      await player.play();
      isPlaying = true;
    } catch {
      isPlaying = false;
    }
    updatePlayButton();
  } else {
    isPlaying = false;
    updatePlayButton();
  }
};

player?.addEventListener("timeupdate", () => {
  if (!player || !isFinite(player.duration) || player.duration === 0) return;
  if (currentTimeEl) currentTimeEl.textContent = formatTime(player.currentTime);
  if (progress && !isDragging) {
    const pct = (player.currentTime / player.duration) * 100;
    progress.style.width = `${pct}%`;
  }
});

player?.addEventListener("loadedmetadata", () => {
  if (!player) return;
  if (durationEl) durationEl.textContent = formatTime(player.duration);
  if (progress) progress.style.width = "0%";
});

player?.addEventListener("ended", () => prevNextMusic("next"));

if (progressBar) {
  const setProgressFromEvent = (ev) => {
    const rect = progressBar.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (ev.clientX - rect.left) / rect.width)
    );
    if (progress) progress.style.width = `${ratio * 100}%`;
    if (!isDragging && player?.duration)
      player.currentTime = ratio * player.duration;
  };

  progressBar.addEventListener("click", setProgressFromEvent);

  progressBar.addEventListener("pointerdown", (e) => {
    if (!player || !isFinite(player.duration)) return;
    isDragging = true;
    setProgressFromEvent(e);

    const onMove = (ev) => setProgressFromEvent(ev);
    const onUp = (ev) => {
      isDragging = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setProgressFromEvent(ev);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });
}

playPauseButton?.addEventListener("click", playPause);
prevButton?.addEventListener("click", () => prevNextMusic("prev"));
nextButton?.addEventListener("click", () => prevNextMusic("next"));

prevNextMusic("init");
