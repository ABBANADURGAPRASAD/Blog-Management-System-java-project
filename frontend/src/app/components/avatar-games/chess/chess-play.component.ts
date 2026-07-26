import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

type Piece = string | null;

const START: Piece[][] = [
  ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
  ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
];

@Component({
  selector: 'app-chess-play',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chess-play.component.html',
  styleUrls: ['./chess-play.component.css'],
})
export class ChessPlayComponent implements OnInit {
  mode = 'avatar';
  room = '';
  friend = '';
  board: Piece[][] = START.map((r) => [...r]);
  selected: { r: number; c: number } | null = null;
  whiteTurn = true;
  status = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.queryParamMap.get('mode') || 'avatar';
    this.room = this.route.snapshot.queryParamMap.get('room') || '';
    this.friend = this.route.snapshot.queryParamMap.get('friend') || '';
    if (this.mode === 'strangers') {
      this.status = 'Looking for a stranger… board is ready while you wait.';
    } else if (this.mode === 'friends') {
      this.status = this.friend
        ? `Requesting ${this.friend}…`
        : `Room ${this.room || '—'} — share the code with a friend.`;
    } else {
      this.status = 'You play white. Your avatar replies with random legal-ish moves.';
    }
  }

  cellClass(r: number, c: number): string {
    const dark = (r + c) % 2 === 1;
    const on = this.selected?.r === r && this.selected?.c === c;
    return `${dark ? 'cp-dark' : 'cp-light'}${on ? ' cp-on' : ''}`;
  }

  onCell(r: number, c: number): void {
    const piece = this.board[r][c];
    if (this.selected) {
      if (this.selected.r === r && this.selected.c === c) {
        this.selected = null;
        return;
      }
      this.move(this.selected.r, this.selected.c, r, c);
      this.selected = null;
      return;
    }
    if (!piece) return;
    const isWhite = this.isWhite(piece);
    if (isWhite !== this.whiteTurn) return;
    this.selected = { r, c };
  }

  goBack(): void {
    void this.router.navigate(['/avatar-games/chess']);
  }

  private move(fr: number, fc: number, tr: number, tc: number): void {
    const piece = this.board[fr][fc];
    if (!piece) return;
    this.board[tr][tc] = piece;
    this.board[fr][fc] = null;
    this.whiteTurn = !this.whiteTurn;
    if (this.mode === 'avatar' && !this.whiteTurn) {
      setTimeout(() => this.avatarReply(), 450);
    }
  }

  private avatarReply(): void {
    const moves: { fr: number; fc: number; tr: number; tc: number }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (!p || this.isWhite(p)) continue;
        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            const target = this.board[tr][tc];
            if (target && !this.isWhite(target)) continue;
            if (Math.abs(tr - r) + Math.abs(tc - c) === 0) continue;
            if (Math.abs(tr - r) <= 2 && Math.abs(tc - c) <= 2) {
              moves.push({ fr: r, fc: c, tr, tc });
            }
          }
        }
      }
    }
    if (!moves.length) {
      this.status = 'Avatar has no move — you win this practice.';
      return;
    }
    const m = moves[Math.floor(Math.random() * moves.length)];
    this.board[m.tr][m.tc] = this.board[m.fr][m.fc];
    this.board[m.fr][m.fc] = null;
    this.whiteTurn = true;
    this.status = 'Your turn.';
  }

  private isWhite(piece: string): boolean {
    return '♙♖♘♗♕♔'.includes(piece);
  }
}
