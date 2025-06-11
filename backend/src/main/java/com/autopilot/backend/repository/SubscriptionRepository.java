package com.autopilot.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.autopilot.backend.model.Subscription;

public interface SubscriptionRepository extends MongoRepository<Subscription, String> {
    List<Subscription> findByUserId(String userId);
    Subscription findByOrderId(String orderId);
}

