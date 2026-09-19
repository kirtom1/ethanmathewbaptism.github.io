const openButton = document.querySelector("#openButton");
const gate = document.querySelector("#gate");
const story = document.querySelector("#story");
const ribbon = document.querySelector("#ribbon");
const imageIntro = document.querySelector("#imageIntro");
const continueButton = document.querySelector("#continueButton");
const musicToggle = document.querySelector("#musicToggle");
const musicLabel = document.querySelector("#musicLabel");
const rsvpForm = document.querySelector("#rsvpForm");
const successMessage = document.querySelector("#successMessage");

let audioContext;
let ambientNodes = [];
let musicOn = true;

function startAmbient() {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  const master = audioContext.createGain();
  master.gain.setValueAtTime(0, audioContext.currentTime);
  master.gain.linearRampToValueAtTime(0.035, audioContext.currentTime + 2);
  master.connect(audioContext.destination);
  // A quiet, original two-note pad avoids a network audio dependency and starts only after consent.
  [196, 246.94].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = index ? 0.17 : 0.13;
    oscillator.connect(gain).connect(master);
    oscillator.start();
    ambientNodes.push(oscillator, gain);
  });
  ambientNodes.push(master);
}

function setMusicState(isOn) {
  musicOn = isOn;
  musicToggle.classList.toggle("is-off", !isOn);
  musicLabel.textContent = isOn ? "Music on" : "Music off";
  musicToggle.setAttribute("aria-pressed", String(isOn));
  musicToggle.setAttribute("aria-label", isOn ? "Turn ambient music off" : "Turn ambient music on");
  if (audioContext) {
    const master = ambientNodes.at(-1);
    master.gain.cancelScheduledValues(audioContext.currentTime);
    master.gain.setTargetAtTime(isOn ? 0.035 : 0, audioContext.currentTime, 0.15);
  }
}

openButton.addEventListener("click", () => {
  ribbon.classList.add("is-untied");
  startAmbient();
  setTimeout(() => {
    gate.classList.add("is-opening");
    story.classList.add("is-open");
    story.setAttribute("aria-hidden", "false");
    document.body.classList.add("unlocked");
  }, 480);
});

continueButton.addEventListener("click", () => {
  imageIntro.classList.add("is-complete");
  setTimeout(() => document.querySelector(".hero").scrollIntoView({ behavior: "smooth" }), 450);
});

musicToggle.addEventListener("click", () => setMusicState(!musicOn));

const ceremonyDate = new Date("2026-01-06T10:00:00+05:30").getTime();
function updateCountdown() {
  const distance = Math.max(0, ceremonyDate - Date.now());
  const units = {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance % 86400000) / 3600000),
    minutes: Math.floor((distance % 3600000) / 60000),
    seconds: Math.floor((distance % 60000) / 1000),
  };
  Object.entries(units).forEach(([id, value]) => {
    document.querySelector(`#${id}`).textContent = String(value).padStart(2, "0");
  });
}
updateCountdown();
setInterval(updateCountdown, 1000);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
  });
}, { threshold: 0.16 });
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

rsvpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!rsvpForm.checkValidity()) {
    rsvpForm.reportValidity();
    return;
  }
  rsvpForm.hidden = true;
  successMessage.hidden = false;
  successMessage.scrollIntoView({ behavior: "smooth", block: "center" });
});
