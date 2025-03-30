package in.rebcoder.spp.controller;

import in.rebcoder.spp.model.Room;
import in.rebcoder.spp.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Controller
public class VoteController {
    @Autowired
    private RoomService roomService;

    @MessageMapping("/vote.{roomId}")
    @SendTo("/topic/room.{roomId}.votes")
    public Map<String, Object> vote(
            @Payload Map<String, String> payload,
            @DestinationVariable String roomId) {
        String userId = payload.get("userId");
        String vote = payload.get("vote");
        String userName = payload.get("userName");
        roomService.addOrUpdateVote(roomId, userId, vote);
        roomService.addUserName(roomId, userId, userName);
        return roomService.getRoomState(roomId);
    }

    @MessageMapping("/room.{roomId}.reveal")
    @SendTo("/topic/room.{roomId}")
    public Map<String, Object> revealVotes(@DestinationVariable String roomId) {
        Room room = roomService.getRoom(roomId);
        room.setRevealed(true);
        roomService.saveRoom(room);

        return Map.of(
                "votes", room.getVotesAsStrings(),
                "names", room.getUserNames(),
                "revealed", true
        );
    }

    @MessageMapping("/room.{roomId}.clear")
    @SendTo("/topic/room.{roomId}")
    public Map<String, Object> clearVotes(@DestinationVariable String roomId) {
        Room room = roomService.getRoom(roomId);
        room.getUserVotes().clear();
        room.setRevealed(false);
        roomService.saveRoom(room);

        return Map.of(
                "votes", Collections.emptyMap(),
                "names", room.getUserNames(),
                "revealed", false
        );
    }


    @MessageMapping("/join.{roomId}")
    @SendTo("/topic/room.{roomId}.votes")
    public Map<String, Object> joinRoom(
            @Payload Map<String, String> payload,
            @DestinationVariable String roomId) {
        String userId = payload.get("userId");
        String userName = payload.get("userName");
        if (!roomService.addUserName(roomId, userId, userName)) {
            return Map.of(
                    "error", "Room is full (max 15 users)",
                    "roomFull", true
            );
        }
        roomService.addUserName(roomId, userId, userName);
        return roomService.getRoomState(roomId);
    }


    @MessageMapping("/room.{roomId}.leave")
    public void handleLeave(
            @Payload Map<String, String> payload,
            @DestinationVariable String roomId) {

        String userId = payload.get("userId");
        roomService.removeUser(roomId, userId);
    }

    @MessageMapping("/reconnect.{roomId}")
    @SendTo("/topic/room.{roomId}.votes")
    public Map<String, Object> handleReconnect(
            @Payload Map<String, String> payload,
            @DestinationVariable String roomId) {

        String userId = payload.get("userId");
        String userName = payload.get("userName");

        // Just update last activity time
        Room room = roomService.getRoom(roomId);
        if (room != null) {
            room.updateLastActivityTime();
            roomService.saveRoom(room);
        }

        return roomService.getRoomState(roomId);
    }
}