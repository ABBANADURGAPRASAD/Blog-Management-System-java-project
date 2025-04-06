package com.blog.service;

import com.blog.model.Post;
import com.blog.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class PostService {
    @Autowired
    private PostRepository postRepository;

    public Post createPost(String content, MultipartFile mediaFile) throws IOException {
        Post post = new Post();
        post.setContent(content);
        post.setMedia(mediaFile.getBytes());
        return postRepository.save(post);
    }

    public List<Post> getUserPosts(Long userId) {
        return postRepository.findByUserId(userId);
    }
}
