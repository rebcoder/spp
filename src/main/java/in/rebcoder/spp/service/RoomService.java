package in.rebcoder.spp.service;

import in.rebcoder.spp.model.Room;
import in.rebcoder.spp.model.Vote;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoomService {
    private Map<String, Room> rooms = new ConcurrentHashMap<>();

    public String createRoom() {
        String roomId = UUID.randomUUID().toString().substring(0, 6);
        rooms.put(roomId, new Room(roomId));
        return roomId;
    }

    public Room getRoom(String roomId) {
        return rooms.get(roomId);
    }

    public void addOrUpdateVote(String roomId, String userId, String vote) {
        Room room = rooms.get(roomId);
        if (room != null) {
            room.addOrUpdateVote(userId, vote);
            room.updateLastActivityTime();
        }
    }

    public void addUserName(String roomId, String userId, String name) {
        Room room = rooms.get(roomId);
        if (room != null) {
            room.addUserName(userId, name);
            room.updateLastActivityTime();
        }
    }

    public Map<String, String> getVotes(String roomId) {
        Room room = rooms.get(roomId);
        return room != null ? room.getUserVotes() : Collections.emptyMap();
    }

    public Map<String, String> getUserNames(String roomId) {
        Room room = rooms.get(roomId);
        return room != null ? room.getUserNames() : Collections.emptyMap();
    }

    public void revealVotes(String roomId) {
        Room room = rooms.get(roomId);
        if (room != null) {
            room.setRevealed(true);
            room.updateLastActivityTime();
        }
    }

    public boolean isRevealed(String roomId) {
        Room room = rooms.get(roomId);
        return room != null && room.isRevealed();
    }

    public void clearVotes(String roomId) {
        Room room = rooms.get(roomId);
        if (room != null) {
            room.getUserVotes().clear();
            room.setRevealed(false);
            room.updateLastActivityTime();
        }
    }
    public Map<String, Room> getRooms() {
        return rooms;
    }
}