package in.rebcoder.spp.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Vote {
    private String userId;
    private String value;

    public Vote(String userId, String value) {
        this.userId = userId;
        this.value = value;
    }

    // Getters and setters
}