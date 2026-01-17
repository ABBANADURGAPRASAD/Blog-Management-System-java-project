package com.blog.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "index";  // Will render templates/index.html
    }

    @GetMapping("/login")
    public String login() {
        return "login";  // Will render templates/login.html
    }

    @GetMapping("/signup")
    public String signup() {
        return "signup";  // Will render templates/signup.html
    }
}
