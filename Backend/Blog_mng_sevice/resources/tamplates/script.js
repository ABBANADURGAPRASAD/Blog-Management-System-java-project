document.addEventListener("DOMContentLoaded", function () {
    // Select DOM elements
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const postFeed = document.getElementById("post-feed");

    // Handle login
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            fetch("http://localhost:8080/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem("authToken", data.token);
                    window.location.href = "index.html";
                } else {
                    alert("Invalid credentials");
                }
            })
            .catch(error => console.error("Error:", error));
        });
    }

    // Handle signup
    if (signupForm) {
        signupForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            fetch("http://localhost:8080/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.id) {
                    alert("Signup successful! Please login.");
                    window.location.href = "login.html";
                } else {
                    alert("Signup failed! Try again.");
                }
            })
            .catch(error => console.error("Error:", error));
        });
    }

    // Logout function
    window.logout = function () {
        localStorage.removeItem("authToken");
        window.location.href = "login.html";
    };

    // Load posts from backend
    function loadPosts() {
        if (!postFeed) return;
        fetch("http://localhost:8080/api/posts")
            .then(response => response.json())
            .then(posts => {
                postFeed.innerHTML = "";
                posts.forEach(post => {
                    const postElement = document.createElement("div");
                    postElement.classList.add("post");
                    postElement.innerHTML = `
                        <strong>${post.user}</strong>
                        <p>${post.content}</p>
                        <button onclick="likePost(${post.id})">Like (${post.likes})</button>
                        <button onclick="showCommentBox(${post.id})">Comment</button>
                        <div id="comments-${post.id}"></div>
                    `;
                    postFeed.appendChild(postElement);
                });
            })
            .catch(error => console.error("Error loading posts:", error));
    }

    // Like a post
    window.likePost = function (postId) {
        fetch(`http://localhost:8080/api/posts/${postId}/like`, { method: "POST" })
        .then(() => loadPosts())
        .catch(error => console.error("Error liking post:", error));
    };

    // Show comment box
    window.showCommentBox = function (postId) {
        const commentBox = document.getElementById(`comments-${postId}`);
        commentBox.innerHTML = `
            <input type="text" id="comment-input-${postId}" placeholder="Add a comment">
            <button onclick="addComment(${postId})">Post</button>
        `;
    };

    // Add a comment
    window.addComment = function (postId) {
        const commentInput = document.getElementById(`comment-input-${postId}`);
        if (!commentInput.value.trim()) return;

        fetch(`http://localhost:8080/api/posts/${postId}/comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: commentInput.value })
        })
        .then(() => loadPosts())
        .catch(error => console.error("Error adding comment:", error));
    };

    // Load posts initially
    loadPosts();
});
