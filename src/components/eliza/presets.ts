// "Fast-forward 60 years": ELIZA answers these live; the modern replies were written by Claude
// (Anthropic) for this page in November 2026. They are not recordings of any product's output.
export const presets: { message: string; modern: string }[] = [
  {
    message: 'Men are all alike.',
    modern: 'That sounds like frustration, maybe after a run of bad experiences. Has something happened recently? I would gently push back on "all", though: people differ a lot, and lumping them together can make a bad week feel like a rule.',
  },
  {
    message: 'I feel angry at you.',
    modern: 'Sorry, it sounds like I have let you down. Tell me what I got wrong and I will try to fix it. If the anger is about something bigger than this chat, I am happy to talk that through too.',
  },
  {
    message: 'Can you remember what I told you earlier?',
    modern: 'Within this conversation, yes: I can see everything we have said so far. Once a chat ends, I only keep something if a memory feature is switched on and you chose to save it. What would you like me to recall?',
  },
  {
    message: 'What is 17 times 23?',
    modern: '17 × 23 = 391. One way to check: 17 × 20 = 340, and 17 × 3 = 51, so 340 + 51 = 391.',
  },
  {
    message: 'Do you actually understand me?',
    modern: 'It depends what you mean by "understand". I can follow what you say, link it to what came earlier and answer in context, which ELIZA could not. Whether that adds up to understanding the way a person does is still an open question, and I would be wary of anyone, me included, who claims to know for sure.',
  },
];
