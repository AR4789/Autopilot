package com.autopilot.backend.service;

import com.autopilot.backend.model.Subscription;
import com.autopilot.backend.model.User;
import com.autopilot.backend.repository.SubscriptionRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentService {

    @Value("${razorpay.keyId}")
    private String keyId;

    @Value("${razorpay.keySecret}")
    private String keySecret;

    private final SubscriptionRepository subscriptionRepository;

    public PaymentService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    public Map<String, String> createRazorpayOrder(User user, double amount, String plan) throws Exception {
        RazorpayClient client = new RazorpayClient(keyId, keySecret);

        // Razorpay expects amount in paise
        int amountInPaise = (int) (amount * 100);

        JSONObject options = new JSONObject();
        options.put("amount", amountInPaise); // amount in the smallest currency unit
        options.put("currency", "INR");
        options.put("receipt", UUID.randomUUID().toString());
        options.put("payment_capture", 1); // auto capture

        Order order = client.orders.create(options);

        // Save to DB
        Subscription subscription = new Subscription();
        subscription.setUserId(user.getId());
        subscription.setPlan(plan);
        subscription.setAmount(amount);
        subscription.setOrderId(order.get("id")); // razorpay order id
        subscription.setStatus("PENDING");
        subscription.setPaymentDate(LocalDateTime.now());
        subscriptionRepository.save(subscription);

        Map<String, String> result = new HashMap<>();
        result.put("orderId", order.get("id"));
        result.put("keyId", keyId);
        result.put("amount", String.valueOf(amountInPaise));
        result.put("currency", "INR");
        result.put("name", "Your Company/Service Name");
        result.put("description", "Subscription for plan: " + plan);
        result.put("prefill_email", user.getEmail());
        result.put("prefill_contact", user.getPhone()); // if you have phone number
        return result;
    }

    public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKeySpec = new javax.crypto.spec.SecretKeySpec(keySecret.getBytes(),
                    "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes());
            String generatedSignature = bytesToHex(hash);
            return generatedSignature.equals(razorpaySignature);
        } catch (Exception e) {
            throw new RuntimeException("Error while verifying payment signature", e);
        }
    }

    public void updateSubscriptionStatus(String orderId, String paymentStatus) {
        Subscription subscription = subscriptionRepository.findByOrderId(orderId);
        if (subscription != null) {
            subscription.setStatus(paymentStatus);
            subscription.setPaymentDate(LocalDateTime.now());
            subscriptionRepository.save(subscription);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1)
                hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

}
