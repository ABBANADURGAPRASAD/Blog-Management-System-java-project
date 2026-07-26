import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { getAvatarGame } from '../games.catalog';

interface QuizQ {
  prompt: string;
  choices: string[];
  answer: number;
  tip: string;
}

const QUIZZES: Record<string, { title: string; blurb: string; theme: string; questions: QuizQ[] }> = {
  'fact-check': {
    title: 'Fact Check',
    blurb: '18+ media literacy — spot scams, spin, and weak claims.',
    theme: 'fact',
    questions: [
      {
        prompt: 'A viral post says “Doctors hate this one trick.” What’s the best first move?',
        choices: [
          'Share it so friends stay safe',
          'Check source, date, and a second reputable outlet',
          'Believe it if it has lots of likes',
          'Argue in the comments immediately',
        ],
        answer: 1,
        tip: 'Virality ≠ truth. Verify publisher, date, and independent coverage.',
      },
      {
        prompt: 'Someone DMs: “Confirm your bank OTP to unlock your account.” You should…',
        choices: [
          'Send the OTP quickly',
          'Ignore and report — banks never ask for OTP via chat',
          'Ask them for their employee ID only',
          'Forward the OTP to a friend for advice',
        ],
        answer: 1,
        tip: 'OTPs are one-time secrets. Never share them.',
      },
      {
        prompt: 'A headline uses ALL CAPS and no named source. Risk level?',
        choices: ['Low', 'Medium', 'High — treat as unverified', 'Always true if emotional'],
        answer: 2,
        tip: 'Emotion + anonymity is a classic clickbait / misinformation combo.',
      },
    ],
  },
  'money-sense': {
    title: 'Money Sense',
    blurb: '18+ practical finance — debt traps, budgets, and trade-offs.',
    theme: 'money',
    questions: [
      {
        prompt: 'A store offers “0% for 12 months” then 36% APR. Best habit?',
        choices: [
          'Ignore the APR — you’ll pay early for sure',
          'Only use it if you can clear the balance before interest starts',
          'Take the max credit for points',
          'Refinance with another high-APR card immediately',
        ],
        answer: 1,
        tip: 'Deferred interest can hit the whole balance if you miss the window.',
      },
      {
        prompt: 'You get a raise. A healthy default move is…',
        choices: [
          'Raise lifestyle by the full amount day one',
          'Auto-save a slice first, then adjust spending',
          'Quit budgeting forever',
          'Hide the raise from your budget',
        ],
        answer: 1,
        tip: 'Pay yourself first — automation beats willpower.',
      },
      {
        prompt: '“Guaranteed 40% monthly returns” from a tipster is…',
        choices: [
          'A normal investment',
          'A red-flag likely scam',
          'Safer than an index fund',
          'Fine if your cousin did it',
        ],
        answer: 1,
        tip: 'Unrealistic guaranteed returns are a classic fraud signal.',
      },
    ],
  },
  'civic-rights': {
    title: 'Civic Rights',
    blurb: '18+ consent, boundaries, and lawful everyday choices.',
    theme: 'civic',
    questions: [
      {
        prompt: 'Consent for intimacy or sharing private photos must be…',
        choices: [
          'Assumed if you’re dating',
          'Clear, ongoing, and freely given — and can be withdrawn',
          'Implied by silence',
          'Valid only if written once years ago',
        ],
        answer: 1,
        tip: 'Consent is active and reversible — not a one-time checkbox.',
      },
      {
        prompt: 'A friend wants to post your face in a meme without asking. Best reply?',
        choices: [
          'It’s fine — public face = free use always',
          'Ask them to wait until you agree (or refuse)',
          'Threaten them online',
          'Ignore and hope',
        ],
        answer: 1,
        tip: 'Respect privacy boundaries even among friends.',
      },
      {
        prompt: 'Workplace: HR asks you to report harassment. You…',
        choices: [
          'Must stay silent to keep the peace',
          'Can document facts and use official channels safely',
          'Must confront only in public',
          'Lose all rights if on probation',
        ],
        answer: 1,
        tip: 'Documentation + official process protects you better than rumors.',
      },
    ],
  },
  'critical-cases': {
    title: 'Critical Cases',
    blurb: '18+ judgment drills — weigh evidence before you decide.',
    theme: 'cases',
    questions: [
      {
        prompt: 'Two friends argue; each shows only texts that help their side. You…',
        choices: [
          'Pick the funnier story',
          'Ask for full context / both timelines before judging',
          'Side with whoever messaged first',
          'Post the drama publicly',
        ],
        answer: 1,
        tip: 'Selection bias is everywhere — demand the missing middle.',
      },
      {
        prompt: 'A study has n=12 and no control group. For a bold claim you…',
        choices: [
          'Treat it as settled science',
          'Treat it as weak evidence needing replication',
          'Share it as proof',
          'Ignore sample size forever',
        ],
        answer: 1,
        tip: 'Tiny, uncontrolled studies are exploratory at best.',
      },
      {
        prompt: 'You’re late and can cut a long queue unfairly. Adult move?',
        choices: [
          'Cut — time is money',
          'Wait your turn or ask the group politely',
          'Blame “the system” while cutting',
          'Pay someone else to cut for you secretly',
        ],
        answer: 1,
        tip: 'Fair process matters even when you’re rushed.',
      },
    ],
  },
};

@Component({
  selector: 'app-knowledge-game',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './knowledge-game.component.html',
  styleUrls: ['./knowledge-game.component.css'],
})
export class KnowledgeGameComponent implements OnInit {
  gameId = '';
  title = '';
  blurb = '';
  theme = 'fact';
  questions: QuizQ[] = [];
  index = 0;
  score = 0;
  feedback = '';
  locked = false;
  done = false;
  mode: 'solo' | 'strangers' | 'friends' = 'solo';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('gameId') || '';
    const pack = QUIZZES[this.gameId];
    const meta = getAvatarGame(this.gameId);
    if (!pack) {
      void this.router.navigate(['/avatar-games']);
      return;
    }
    this.title = pack.title;
    this.blurb = pack.blurb;
    this.theme = meta?.theme || pack.theme;
    this.questions = pack.questions;
  }

  get current(): QuizQ | null {
    return this.questions[this.index] ?? null;
  }

  setMode(mode: 'solo' | 'strangers' | 'friends'): void {
    this.mode = mode;
  }

  answer(choiceIndex: number): void {
    if (this.locked || !this.current) return;
    this.locked = true;
    const q = this.current;
    if (choiceIndex === q.answer) {
      this.score++;
      this.feedback = `Correct. ${q.tip}`;
    } else {
      this.feedback = `Not quite. ${q.tip}`;
    }
  }

  next(): void {
    if (this.index >= this.questions.length - 1) {
      this.done = true;
      return;
    }
    this.index++;
    this.feedback = '';
    this.locked = false;
  }

  goBack(): void {
    void this.router.navigate(['/avatar-games']);
  }
}
