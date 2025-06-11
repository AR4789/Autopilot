package com.autopilot.backend.model;

import java.util.List;
import java.util.Map;

public class ConfigRequest {
    private List<Map<String, Object>> pre;
    private List<Map<String, Object>> post;

    public List<Map<String, Object>> getPre() { return pre; }
    public void setPre(List<Map<String, Object>> pre) { this.pre = pre; }

    public List<Map<String, Object>> getPost() { return post; }
    public void setPost(List<Map<String, Object>> post) { this.post = post; }
}
