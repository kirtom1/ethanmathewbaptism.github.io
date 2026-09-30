const openButton = document.querySelector("#openButton");
const gate = document.querySelector("#gate");
const story = document.querySelector("#story");
const giftBox = document.querySelector("#giftBox");
const imageIntro = document.querySelector("#imageIntro");
const continueButton = document.querySelector("#continueButton");

let isOpening = false;
function openInvitation() {
  if (isOpening) return;
  isOpening = true;
  giftBox.classList.add("is-opening");
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  setTimeout(() => {
    gate.classList.add("is-opening");
    story.classList.add("is-open");
    story.setAttribute("aria-hidden", "false");
    document.body.classList.add("unlocked");
  }, 680);
}

openButton.addEventListener("click", openInvitation);
giftBox.addEventListener("click", openInvitation);

continueButton.addEventListener("click", () => {
  imageIntro.classList.add("is-complete");
  setTimeout(() => document.querySelector(".hero").scrollIntoView({ behavior: "smooth" }), 450);
});

const ceremonyDate = new Date("2027-01-06T10:00:00+05:30").getTime();
function updateCountdown() {
  const distance = ceremonyDate - Date.now();
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
