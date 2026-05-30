import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css'],
})
export class CreatePostComponent implements OnInit {
  postForm: FormGroup;
  selectedFile: File | null = null;
  filePreview: string | null = null;
  filePreviewIsVideo = false;
  isDragging = false;
  isPublishing = false;
  aiAnalysisMessage = 'Running AI safety checks…';
  categories = ['Technology', 'Lifestyle', 'Travel', 'Food', 'Sports', 'Entertainment'];

  allMentionUsers: User[] = [];
  mentionSuggestions: User[] = [];
  showMentionDropdown = false;
  mentionHighlightIndex = 0;
  mentionTokenStart = 0;
  mentionCaretIndex = 0;
  mentionQueryLabel = '';

  @ViewChild('contentTextarea') contentTextarea?: ElementRef<HTMLTextAreaElement>;

  private currentUserId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private authService: AuthService,
    private router: Router,
    private userService: UserService
  ) {
    this.postForm = this.fb.group({
      content: ['', Validators.required],
      tags: [''],
      category: [''],
    });
  }

  ngOnInit(): void {
    const u = this.authService.getCurrentUser();
    if (u?.id) {
      this.currentUserId = u.id;
    }
    this.userService.getAllUser().subscribe({
      next: (data: unknown[]) => {
        this.allMentionUsers = (data || []).map((raw: any) => ({
          ...raw,
          username: raw.username || raw.userName,
          email: raw.email || '',
        })) as User[];
      },
      error: () => {},
    });
  }

  getMentionHandle(u: User): string {
    return (u.username || (u as User & { userName?: string }).userName || '').trim();
  }

  onContentInput(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    const text = ta.value;
    const caret = ta.selectionStart ?? text.length;
    this.mentionCaretIndex = caret;
    this.updateMentionState(text, caret);
  }

  private updateMentionState(text: string, caret: number): void {
    const before = text.slice(0, caret);
    const match = before.match(/@([\S]*)$/);
    if (!match) {
      this.resetMentionAutocomplete();
      return;
    }
    const query = (match[1] ?? '').toLowerCase();
    this.mentionTokenStart = caret - match[0].length;
    this.mentionQueryLabel = match[1] ?? '';

    let list = this.allMentionUsers.filter((u) => {
      const handle = this.getMentionHandle(u).toLowerCase();
      const name = (u.fullName || '').toLowerCase();
      if (!query) {
        return true;
      }
      return handle.includes(query) || name.includes(query);
    });
    if (this.currentUserId != null) {
      list = list.filter((u) => u.id !== this.currentUserId);
    }
    this.mentionSuggestions = list.slice(0, 12);
    this.showMentionDropdown = true;
    this.mentionHighlightIndex = 0;
  }

  private resetMentionAutocomplete(): void {
    this.showMentionDropdown = false;
    this.mentionSuggestions = [];
    this.mentionHighlightIndex = 0;
    this.mentionQueryLabel = '';
  }

  onContentKeydown(event: KeyboardEvent): void {
    if (!this.showMentionDropdown) {
      return;
    }
    const len = this.mentionSuggestions.length;
    if (len === 0) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.resetMentionAutocomplete();
      }
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.mentionHighlightIndex = Math.min(this.mentionHighlightIndex + 1, len - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.mentionHighlightIndex = Math.max(this.mentionHighlightIndex - 1, 0);
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.selectMention(this.mentionSuggestions[this.mentionHighlightIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.resetMentionAutocomplete();
    } else if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      this.selectMention(this.mentionSuggestions[this.mentionHighlightIndex]);
    }
  }

  selectMention(user: User): void {
    const handle = this.getMentionHandle(user);
    if (!handle) {
      return;
    }
    const ctrl = this.postForm.get('content');
    const text = ctrl?.value || '';
    const caret = this.mentionCaretIndex;
    const start = this.mentionTokenStart;
    const insert = '@' + handle + ' ';
    const newText = text.slice(0, start) + insert + text.slice(caret);
    ctrl?.setValue(newText);
    this.resetMentionAutocomplete();
    const pos = start + insert.length;
    setTimeout(() => {
      const ta = this.contentTextarea?.nativeElement;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(pos, pos);
      }
    });
  }

  private lookupUserIdByHandle(handle: string): number | null {
    const h = (handle || '').toLowerCase();
    if (!h) {
      return null;
    }
    const u = this.allMentionUsers.find(
      (x) => this.getMentionHandle(x).toLowerCase() === h
    );
    return u?.id ?? null;
  }

  /**
   * Resolve @mentions to user ids. Uses @ plus non-whitespace so handles like `dp@123` work
   * (the old [a-zA-Z0-9_]+ pattern only caught `dp` from `@dp@123`).
   */
  extractMentionedUserIds(content: string): number[] {
    const re = /@(\S+)/g;
    const seen = new Set<number>();
    const ids: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      let raw = m[1] ?? '';
      raw = raw.replace(/[.,;:!?)\]}>'"]+$/g, '');
      if (!raw) {
        continue;
      }
      const uid = this.lookupUserIdByHandle(raw);
      if (uid != null && !seen.has(uid)) {
        seen.add(uid);
        ids.push(uid);
      }
    }
    return ids;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.setSelectedFile(file);
    }
  }

  private setSelectedFile(file: File) {
    this.selectedFile = file;
    this.previewFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.setSelectedFile(files[0]);
    }
  }

  previewFile(file: File) {
    this.filePreviewIsVideo = file.type.startsWith('video/');
    if (this.filePreviewIsVideo) {
      this.filePreview = URL.createObjectURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.filePreview = (e.target?.result as string) || null;
    };
    reader.readAsDataURL(file);
  }

  removeFile() {
    if (this.filePreviewIsVideo && this.filePreview) {
      URL.revokeObjectURL(this.filePreview);
    }
    this.selectedFile = null;
    this.filePreview = null;
    this.filePreviewIsVideo = false;
  }

  formatText(command: string) {
    document.execCommand(command, false);
  }

  publishPost() {
    if (!this.postForm.valid || this.isPublishing) {
      if (!this.postForm.valid) {
        alert('Please fill in all required fields.');
      }
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      alert('Please login to create a post.');
      this.router.navigate(['/login']);
      return;
    }

    const content = this.postForm.get('content')?.value || '';
    const mentionedUserIds = this.extractMentionedUserIds(content);

    const postData = {
      title: content.substring(0, 100) || 'Untitled Post',
      content,
      tags: this.postForm.get('tags')?.value || '',
      category: this.postForm.get('category')?.value || '',
      mentionedUserIds,
    };

    this.isPublishing = true;
    this.aiAnalysisMessage = this.selectedFile
      ? 'AI is analyzing your text and media for safety…'
      : 'AI is analyzing your post text…';

    this.postService.createPost(postData, this.selectedFile, currentUser.id).subscribe({
      next: () => {
        this.isPublishing = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isPublishing = false;
        const body = err?.error;
        const msg =
          typeof body === 'object' && body?.error
            ? body.error
            : typeof body === 'string'
              ? body
              : 'Failed to create post. Please try again.';
        alert(msg);
      },
    });
  }

  saveDraft() {
    console.log('Saving draft...', this.postForm.value);
    alert('Draft saved successfully!');
  }

  cancel() {
    this.router.navigate(['/home']);
  }
}
