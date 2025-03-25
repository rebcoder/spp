package in.rebcoder.spp.controller;

import in.rebcoder.spp.model.Vote;
import in.rebcoder.spp.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class VoteController {
    @Autowired
    private RoomService roomService;

    @MessageMapping("/vote/{roomId}")
    @SendTo("/topic/votes/{roomId}")
    public Map<String, Object> vote(
            @Payload Map<String, String> payload,
            @DestinationVariable String roomId
    ) {
        String userId = payload.get("userId");
        String vote = payload.get("vote");
        String userName = payload.get("userName");
        roomService.addOrUpdateVote(roomId, userId, vote);
        roomService.addUserName(roomId, userId, userName);
        return getRoomState(roomId);
    }


    @MessageMapping("/reveal/{roomId}")
    @SendTo("/topic/votes/{roomId}")
    public Map<String, Object> revealVotes(@DestinationVariable String roomId) {
        roomService.revealVotes(roomId);
        return getRoomState(roomId);
    }

    @MessageMapping("/clear-votes/{roomId}")
    @SendTo("/topic/votes/{roomId}")
    public Map<String, Object> clearVotes(@DestinationVariable String roomId) {
        roomService.clearVotes(roomId);
        return getRoomState(roomId);
    }

    private Map<String, Object> getRoomState(String roomId) {
        Map<String, Object> state = new HashMap<>();
        state.put("votes", roomService.getVotes(roomId));
        state.put("names", roomService.getUserNames(roomId));
        state.put("revealed", roomService.isRevealed(roomId));
        return state;
    }

    @MessageMapping("/join/{roomId}")
    @SendTo("/topic/votes/{roomId}")
    public Map<String, Object> joinRoom(
            @Payload Map<String, String> payload,
            @DestinationVariable String roomId) {
        String userId = payload.get("userId");
        String userName = payload.get("userName");

        // Add user to the room
        roomService.addUserName(roomId, userId, userName);

        // Return updated room state
        return getRoomState(roomId);
    }
}
