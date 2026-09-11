import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollAnimations() {
  // --------------------------------
  // BASIC REVEAL ANIMATIONS
  // --------------------------------

  const elements = document.querySelectorAll(
    '.section-eyebrow, .section-title, .experience-heading h2, .experience-description, .ai-content'
  );

  elements.forEach((element) => {
    gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 40,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 85%',
          once: true,
        },
      }
    );
  });

  // --------------------------------
  // RESTAURANT / EXPERIENCE CARDS
  // --------------------------------

  const cards = document.querySelectorAll(
    '.restaurant-card, .experience-secondary-card'
  );

  cards.forEach((card, index) => {
    gsap.fromTo(
      card,
      {
        opacity: 0,
        y: 60,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: index * 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          once: true,
        },
      }
    );
  });

  // --------------------------------
  // EXPERIENCE EXPAND ANIMATION
  // --------------------------------

  const expandSection = document.querySelector(
    '.experience-expand-wrap'
  );

  const expandElement = document.querySelector(
    '.experience-expand'
  );

  const expandImage = document.querySelector(
    '.experience-image img'
  );

  if (
    expandSection &&
    expandElement &&
    expandImage
  ) {
    gsap.set(expandElement, {
      width: '60vw',
      height: '65vh',
      borderRadius: '32px',
    });

    gsap.set(expandImage, {
      scale: 1.16,
    });

    const expandTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: expandSection,
        start: 'top top',
        end: '+=1100',
        scrub: 1.5,
        pin: true,
        anticipatePin: 1,
      },
    });

    expandTimeline
      .to(
        expandElement,
        {
          width: '100vw',
          height: '100vh',
          borderRadius: '0px',
          ease: 'power2.inOut',
          duration: 1,
        },
        0
      )
      .to(
        expandImage,
        {
          scale: 1,
          ease: 'power2.out',
          duration: 1,
        },
        0
      );
  }

  // --------------------------------
  // EXPERIENCE CONTENT
  // --------------------------------

  const experienceContent =
    document.querySelector(
      '.experience-content'
    );

  if (experienceContent) {
    gsap.fromTo(
      experienceContent,
      {
        opacity: 0,
        y: 35,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.experience-expand-wrap',
          start: 'top 70%',
          once: true,
        },
      }
    );
  }

  ScrollTrigger.refresh();
}