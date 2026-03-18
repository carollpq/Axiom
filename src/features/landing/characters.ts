export const CHARACTERS = [
  {
    name: 'Hypatia',
    title: 'The Creator',
    role: 'Researchers',
    image: '/landing/Hypatia - The Author.png',
    imgWidth: 537,
    imgHeight: 667,
    imgClass: 'h-auto w-[537px]',
    charScale: 0.65,
    plateTop: '50%',
    leftText:
      'Your ideas have value the moment they exist\u2014not when a journal decides to publish them. Yet today, authorship is claimed after the fact, contributions are disputed without evidence, and years of collaboration rest on nothing but good faith.',
    quote:
      'In the spirit of Hypatia\u2014who taught that knowledge belongs to those who create it.',
    rightText:
      'Axiom registers your research at creation\u2014timestamped, immutable, on-chain. Authorship contracts are cryptographically signed by every contributor with percentages locked before submission. If your work is unfairly rejected despite meeting every criterion, a built-in rebuttal phase lets you challenge the decision on the record.',
  },
  {
    name: 'Aristotle',
    title: 'The Evaluator',
    role: 'Reviewers',
    image: '/landing/Aristotle - The Evaluator.png',
    imgWidth: 735,
    imgHeight: 939,
    imgClass: 'h-auto w-[280px] lg:w-[360px] xl:w-[420px]',
    charScale: 1,
    plateTop: '65%',
    leftText:
      'Your expertise has value. Your time has value. But in traditional publishing, your reviews vanish into a black box\u2014unrecognized, unrewarded, owned by the journal. No reputation follows you. No credential proves your contribution.',
    quote:
      'In the spirit of Aristotle\u2014who understood that rigorous evaluation is itself a form of scholarship.',
    rightText:
      'On Axiom, every review builds a soulbound reputation score\u2014tied to your identity, portable across journals, impossible to fake. Timeliness, editor ratings, author feedback, and publication outcomes all count. Hit milestones and earn verifiable OpenBadge credentials you can share directly to LinkedIn.',
  },
  {
    name: 'Solomon',
    title: 'The Verifier',
    role: 'Editors',
    image: '/landing/solomon.png',
    imgWidth: 867,
    imgHeight: 642,
    imgClass: 'h-auto w-[320px] lg:w-[420px] xl:w-[480px]',
    charScale: 1.15,
    plateTop: '50%',
    leftText:
      'You make the final call\u2014but the system gives you no tools to prove it was fair. Reviewer quality is invisible. Deadlines slip without consequence. When decisions are challenged, the evidence trail is whatever you remember.',
    quote:
      'In the spirit of Solon\u2014who made law public so justice could be verified.',
    rightText:
      'Axiom gives editors structured reviews with per-criterion evaluations\u2014no vague rejections. Reviewer reputation scores let you assign the right people. On-chain deadlines enforce accountability automatically. Every decision you make is backed by a transparent, auditable record that protects you and your journal.',
  },
] as const;

export type Character = (typeof CHARACTERS)[number];
