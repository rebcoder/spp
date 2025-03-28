package in.rebcoder.spp.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Vote {
    private String userId;
    private String value;

    @JsonCreator
    public Vote(@JsonProperty("userId") String userId,
                @JsonProperty("value") String value) {
        this.userId = userId;
        this.value = value;
    }

    @Override
    public String toString() {
        return this.value; // Return just the vote value for display
    }
}