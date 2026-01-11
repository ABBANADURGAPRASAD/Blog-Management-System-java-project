import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css']
})
export class CreatePostComponent implements OnInit {
  postForm: FormGroup;
  selectedFile: File | null = null;
  filePreview: string | null = null;
  isDragging = false;
  categories = ['Technology', 'Lifestyle', 'Travel', 'Food', 'Sports', 'Entertainment'];

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private router: Router
  ) {
    this.postForm = this.fb.group({
      content: ['', Validators.required],
      tags: [''],
      category: ['']
    });
  }

  ngOnInit() {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.previewFile(file);
    }
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
      this.selectedFile = files[0];
      this.previewFile(files[0]);
    }
  }

  previewFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.filePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeFile() {
    this.selectedFile = null;
    this.filePreview = null;
  }

  formatText(command: string) {
    document.execCommand(command, false);
  }

  publishPost() {
    if (this.postForm.valid) {
      const formData = new FormData();
      formData.append('content', this.postForm.get('content')?.value);
      
      if (this.selectedFile) {
        formData.append('media', this.selectedFile);
      }
      
      if (this.postForm.get('tags')?.value) {
        formData.append('tags', this.postForm.get('tags')?.value);
      }
      
      if (this.postForm.get('category')?.value) {
        formData.append('category', this.postForm.get('category')?.value);
      }

      this.postService.createPost(formData).subscribe({
        next: (response) => {
          console.log('Post created successfully:', response);
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error('Error creating post:', error);
          alert('Failed to create post. Please try again.');
        }
      });
    } else {
      alert('Please fill in all required fields.');
    }
  }

  saveDraft() {
    // Implement draft saving logic
    console.log('Saving draft...', this.postForm.value);
    alert('Draft saved successfully!');
  }
}

