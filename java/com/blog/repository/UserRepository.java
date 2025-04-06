package com.blog.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;

import com.dp.blog.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
}
