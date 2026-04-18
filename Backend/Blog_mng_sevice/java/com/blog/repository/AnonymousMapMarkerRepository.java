package com.blog.repository;

import com.blog.model.AnonymousMapMarker;
import com.blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnonymousMapMarkerRepository extends JpaRepository<AnonymousMapMarker, Long> {

    Optional<AnonymousMapMarker> findByPublicToken(String publicToken);

    Optional<AnonymousMapMarker> findByUser(User user);

    Optional<AnonymousMapMarker> findByUser_Id(Long userId);

    void deleteByUser_Id(Long userId);

    @Query("SELECT DISTINCT m FROM AnonymousMapMarker m JOIN FETCH m.user WHERE m.latitude BETWEEN :minLat AND :maxLat "
            + "AND m.longitude BETWEEN :minLng AND :maxLng")
    List<AnonymousMapMarker> findInBounds(@Param("minLat") double minLat, @Param("maxLat") double maxLat,
            @Param("minLng") double minLng, @Param("maxLng") double maxLng);
}
