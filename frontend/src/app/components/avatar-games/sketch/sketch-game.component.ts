import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

const WORD_BANK = [
  'ship',
  'bridge',
  'coffee',
  'rocket',
  'guitar',
  'castle',
  'panda',
  'umbrella',
  'pizza',
  'mountain',
  'bicycle',
  'dragon',
];

type Tool = 'pen' | 'eraser' | 'paint';

@Component({
  selector: 'app-sketch-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sketch-game.component.html',
  styleUrls: ['./sketch-game.component.css'],
})
export class SketchGameComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('board') boardRef?: ElementRef<HTMLCanvasElement>;

  phase: 'pick' | 'draw' | 'guess' | 'done' = 'pick';
  round = 1;
  readonly maxRounds = 3;
  readonly roundSeconds = 30;
  secondsLeft = 30;
  word = '';
  wordChoices: string[] = [];
  guess = '';
  status = 'Player 1: pick the secret word.';
  scoreDrawer = 0;
  scoreGuesser = 0;
  youAreDrawer = true;

  tool: Tool = 'pen';
  color = '#1a2b3c';
  brush = 4;
  colors = ['#1a2b3c', '#e74c3c', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#ffffff'];

  private ctx: CanvasRenderingContext2D | null = null;
  private drawing = false;
  private timer?: ReturnType<typeof setInterval>;
  private lastX = 0;
  private lastY = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.refreshWordChoices();
  }

  ngAfterViewInit(): void {
    this.setupCanvas();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  pickWord(w: string): void {
    this.word = w;
    this.phase = 'draw';
    this.youAreDrawer = true;
    this.status = `Draw “${w}” — ${this.roundSeconds}s`;
    this.resetCanvas();
    this.startTimer(() => this.endDrawPhase());
  }

  setTool(tool: Tool): void {
    this.tool = tool;
  }

  clearBoard(): void {
    this.resetCanvas();
  }

  submitGuess(): void {
    if (this.phase !== 'guess') return;
    const ok = this.guess.trim().toLowerCase() === this.word.toLowerCase();
    if (ok) {
      this.scoreGuesser++;
      this.status = `Correct — it was “${this.word}”!`;
    } else {
      this.status = `Nope. The word was “${this.word}”.`;
    }
    this.clearTimer();
    this.advanceRound();
  }

  goBack(): void {
    void this.router.navigate(['/avatar-games']);
  }

  onPointerDown(ev: PointerEvent): void {
    if (this.phase !== 'draw' || !this.youAreDrawer) return;
    const { x, y } = this.pos(ev);
    this.drawing = true;
    this.lastX = x;
    this.lastY = y;
    this.boardRef?.nativeElement.setPointerCapture(ev.pointerId);
  }

  onPointerMove(ev: PointerEvent): void {
    if (!this.drawing || !this.ctx) return;
    const { x, y } = this.pos(ev);
    this.ctx.beginPath();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    if (this.tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
      this.ctx.lineWidth = Math.max(12, this.brush * 3);
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.color;
      this.ctx.lineWidth = this.tool === 'paint' ? this.brush * 3 : this.brush;
    }
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
  }

  onPointerUp(): void {
    this.drawing = false;
  }

  private endDrawPhase(): void {
    this.phase = 'guess';
    this.youAreDrawer = false;
    this.guess = '';
    this.status = `Player 2: guess the drawing — ${this.roundSeconds}s`;
    this.startTimer(() => {
      this.status = `Time up. Word was “${this.word}”.`;
      this.advanceRound();
    });
  }

  private advanceRound(): void {
    if (this.round >= this.maxRounds) {
      this.phase = 'done';
      this.status = `Game over — Drawer ${this.scoreDrawer} · Guesser ${this.scoreGuesser}`;
      return;
    }
    this.round++;
    this.phase = 'pick';
    this.youAreDrawer = true;
    this.guess = '';
    this.refreshWordChoices();
    this.status = `Round ${this.round}: pick a new word.`;
    this.resetCanvas();
  }

  private refreshWordChoices(): void {
    const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
    this.wordChoices = shuffled.slice(0, 3);
  }

  private startTimer(onEnd: () => void): void {
    this.clearTimer();
    this.secondsLeft = this.roundSeconds;
    this.timer = setInterval(() => {
      this.secondsLeft--;
      if (this.secondsLeft <= 0) {
        this.clearTimer();
        onEnd();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private setupCanvas(): void {
    const canvas = this.boardRef?.nativeElement;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
    this.resetCanvas();
  }

  private resetCanvas(): void {
    const canvas = this.boardRef?.nativeElement;
    if (!canvas || !this.ctx) return;
    const rect = canvas.getBoundingClientRect();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  private pos(ev: PointerEvent): { x: number; y: number } {
    const canvas = this.boardRef!.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }
}
