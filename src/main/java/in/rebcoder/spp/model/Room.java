package in.rebcoder.spp.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Getter
@Setter
public class Room {
    private String roomId;
    private ConcurrentMap<String, Vote> userVotes; // Changed from Map<String, String>
    private ConcurrentMap<String, String> userNames;
    private boolean revealed;
    private long lastActivityTime;
    private static final int MAX_USERS = 15;  // Add this constant

    @JsonCreator
    public Room(@JsonProperty("roomId") String roomId,
                @JsonProperty("userVotes") ConcurrentMap<String, Vote> userVotes,
                @JsonProperty("userNames") ConcurrentMap<String, String> userNames,
                @JsonProperty("revealed") boolean revealed,
                @JsonProperty("lastActivityTime") long lastActivityTime) {
        this.roomId = roomId;
        this.userVotes = userVotes != null ? userVotes : new ConcurrentHashMap<>();
        this.userNames = userNames != null ? userNames : new ConcurrentHashMap<>();
        this.revealed = revealed;
        this.lastActivityTime = lastActivityTime;
    }

    public Room() {
        this.userVotes = new ConcurrentHashMap<>();
        this.userNames = new ConcurrentHashMap<>();
    }

    public boolean canAddUser() {
        return this.userNames.size() < MAX_USERS;
    }

    // Update methods to handle Vote objects
    public void addOrUpdateVote(String userId, String voteValue) {
        this.userVotes.put(userId, new Vote(userId, voteValue, System.currentTimeMillis()));
        updateLastActivityTime();
    }
    @JsonIgnore
    public Map<String, String> getVotesAsStrings() {
        Map<String, String> result = new ConcurrentHashMap<>();
        userVotes.forEach((userId, vote) -> result.put(userId, vote.getValue()));
        return result;
    }

    public void addUserName(String userId, String name) {
        userNames.put(userId, name);
        updateLastActivityTime();
    }


    public void updateLastActivityTime() {
        this.lastActivityTime = System.currentTimeMillis();
    }
}