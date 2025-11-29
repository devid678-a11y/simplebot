const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const animatedNodes = [...document.querySelectorAll("[data-animate]")];
const statNumbers = [...document.querySelectorAll(".stat-number")];
const parallaxLayers = [...document.querySelectorAll("[data-depth]")];
const hero = document.querySelector(".hero");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const links = document.querySelector(".links");

if (!prefersReducedMotion) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseFloat(entry.target.dataset.delay || "0");
          setTimeout(() => {
            entry.target.classList.add("is-visible");
          }, delay * 1000);

          if (entry.target.classList.contains("stat-card")) {
            animateStat(entry.target.querySelector(".stat-number"));
          } else if (entry.target.classList.contains("stat-number")) {
            animateStat(entry.target);
          }
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.25,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  animatedNodes.forEach((node) => observer.observe(node));
} else {
  animatedNodes.forEach((node) => node.classList.add("is-visible"));
  statNumbers.forEach((node) => {
    const value = parseFloat(node.dataset.count || "0");
    node.textContent = formatNumber(value);
  });
}

let statAnimated = new WeakSet();

function animateStat(node) {
  if (!node || statAnimated.has(node)) {
    return;
  }
  statAnimated.add(node);

  const target = parseFloat(node.dataset.count || "0");
  const duration = 2200;
  const isDecimal = !Number.isInteger(target);
  const decimals = isDecimal ? (node.dataset.count.split(".")[1]?.length || 1) : 0;

  const start = performance.now();
  const step = (timestamp) => {
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = easeOutCubic(progress);
    const current = target * eased;
    node.textContent = formatNumber(current, decimals);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      node.textContent = formatNumber(target, decimals);
    }
  };
  requestAnimationFrame(step);
}

function formatNumber(value, decimals = 0) {
  const formatter = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return formatter.format(value);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

let heroBounds = hero?.getBoundingClientRect();

function updateBounds() {
  heroBounds = hero?.getBoundingClientRect();
}

window.addEventListener("resize", () => {
  updateBounds();
});

updateBounds();

let mouseX = 0;
let mouseY = 0;
let scrollY = window.scrollY;
let ticking = false;

document.addEventListener("pointermove", (event) => {
  mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
  requestParallaxFrame();
});

window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
  requestParallaxFrame();
}, { passive: true });

function requestParallaxFrame() {
  if (!prefersReducedMotion && !ticking) {
    ticking = true;
    requestAnimationFrame(applyParallax);
  }
}

function applyParallax() {
  const scrollFactor = Math.min(scrollY / (heroBounds?.height || 1), 1);

  parallaxLayers.forEach((layer) => {
    const depth = parseFloat(layer.dataset.depth || "0.2");
    const translateX = mouseX * depth * 30;
    const translateY = mouseY * depth * 18 + scrollFactor * depth * -60;
    layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
  });

  ticking = false;
}

if (menuToggle && links) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
if (prefersDark.matches) {
  document.documentElement.style.setProperty("--bg", "#10121a");
  document.documentElement.style.setProperty("--surface", "rgba(22, 25, 36, 0.92)");
  document.documentElement.style.setProperty("--surface-soft", "rgba(22, 25, 36, 0.72)");
  document.documentElement.style.setProperty("--text", "#f5f7ff");
  document.documentElement.style.setProperty("--text-soft", "rgba(223, 228, 240, 0.72)");
  document.body.classList.add("theme-dark");
}

if ("scrollBehavior" in document.documentElement.style) {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetID = anchor.getAttribute("href")?.slice(1);
      if (!targetID) {
        return;
      }
      const targetNode = document.getElementById(targetID);
      if (!targetNode) {
        return;
      }
      event.preventDefault();
      targetNode.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

window.addEventListener("load", () => {
  requestParallaxFrame();
});

