package com.autopilot.backend.controller;

import com.autopilot.backend.model.Subscription;
import com.autopilot.backend.model.User;
import com.autopilot.backend.repository.SubscriptionRepository;
import com.autopilot.backend.repository.UserRepository;
import com.autopilot.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/create-order")
    public Map<String, String> createOrder(@RequestBody Map<String, String> payload, Principal principal)
            throws Exception {
        String plan = payload.get("plan");
        double amount = getPlanAmount(plan);
        User user = userRepository.findByEmail(principal.getName());

        return paymentService.createRazorpayOrder(user, amount, plan);
    }

    @PostMapping("/confirm")
    public String confirmPayment(@RequestBody Map<String, String> payload) {
        String razorpayOrderId = payload.get("razorpay_order_id");
        String razorpayPaymentId = payload.get("razorpay_payment_id");
        String razorpaySignature = payload.get("razorpay_signature");

        // Verify signature to ensure payment is genuine
        boolean isValid = paymentService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!isValid) {
            return "Payment signature verification failed";
        }

        // Update subscription as completed
        paymentService.updateSubscriptionStatus(razorpayOrderId, "COMPLETED");

        // Update user subscription status
        Subscription subscription = subscriptionRepository.findByOrderId(razorpayOrderId);
        if (subscription != null) {
            User user = userRepository.findById(subscription.getUserId()).orElse(null);
            if (user != null) {
                user.setSubscribed(true);
                user.setPlan(subscription.getPlan());
                user.setSubscriptionDate(LocalDate.now());
                userRepository.save(user);
            }
        }

        return "Payment Successful";
    }

    private double getPlanAmount(String plan) {
        return switch (plan.toLowerCase()) {
            case "free" -> 0.0; // free plan is zero
            case "premium" -> 699.0;
            case "business" -> 1499.0;
            default -> 0.0;
        };
    }
}
