package in.rebcoder.spp.controller;

import in.rebcoder.spp.model.Room;
import in.rebcoder.spp.model.Vote;
import in.rebcoder.spp.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class RoomController {
    @Autowired
    private RoomService roomService;

    @PostMapping("/create-room")
    public String createRoom() {
        return roomService.createRoom();
    }

    @PostMapping("/join-room")
    public ResponseEntity<?> joinRoom(@RequestParam String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room != null) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Room not found");
        }
    }



    @GetMapping("/votes")
    public Map<String, String> getVotes(@RequestParam String roomId) {
        return roomService.getVotes(roomId);
    }
}