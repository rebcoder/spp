package in.rebcoder.spp.model;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


public class Room {
    private String roomId;
    private Map<String, String> userVotes = new ConcurrentHashMap<>(); // userId -> vote
    private Map<String, String> userNames = new ConcurrentHashMap<>(); // userId -> name
    private boolean revealed = false; // Track if votes are revealed
    private long lastActivityTime = System.currentTimeMillis(); // Track last activity time

    public Room(String roomId) {
        this.roomId = roomId;
        this.userVotes = new ConcurrentHashMap<>();
        this.userNames = new ConcurrentHashMap<>(); // Initialize the userNames map
    }

    public void updateLastActivityTime() {
        this.lastActivityTime = System.currentTimeMillis();
    }

    public long getLastActivityTime() {
        return lastActivityTime;
    }

    public void addOrUpdateVote(String userId, String vote) {
        userVotes.put(userId, vote);
    }

    public void addUserName(String userId, String name) {
        userNames.put(userId, name);
    }

    public String getUserName(String userId) {
        return userNames.get(userId);
    }

    public Map<String, String> getUserVotes() {
        return userVotes;
    }

    public Map<String, String> getUserNames() {
        return userNames;
    }

    public boolean isRevealed() {
        return revealed;
    }

    public void setRevealed(boolean revealed) {
        this.revealed = revealed;
    }
}