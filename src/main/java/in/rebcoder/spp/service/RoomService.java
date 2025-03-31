package in.rebcoder.spp.service;

import in.rebcoder.spp.model.Room;
import in.rebcoder.spp.model.Vote;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class RoomService {
    public static final String ROOM_KEY_PREFIX = "room:";
    private final RedisTemplate<String, Room> redisTemplate;
    @Autowired
    private SimpMessagingTemplate messageTemplate;

    @Autowired
    public RoomService(RedisTemplate<String, Room> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String createRoom() {
        String roomId = generateRoomId();
        Room room = new Room();
        room.setRoomId(roomId);
        redisTemplate.opsForValue().set(ROOM_KEY_PREFIX + roomId, room, 48, TimeUnit.HOURS);
        return roomId;
    }

    public Room getRoom(String roomId) {
        return redisTemplate.opsForValue().get(ROOM_KEY_PREFIX + roomId);
    }

    public void addOrUpdateVote(String roomId, String userId, String vote) {
        Room room = getRoom(roomId);
        if (room != null && room.getUserNames().containsKey(userId)) {
            room.addOrUpdateVote(userId, vote);
            redisTemplate.opsForValue().set(ROOM_KEY_PREFIX + roomId, room, 48, TimeUnit.HOURS);
        }
    }

    public Map<String, String> getVotes(String roomId) {
        Room room = getRoom(roomId);
        return room != null ? room.getVotesAsStrings() : Collections.emptyMap();
    }

    public void revealVotes(String roomId) {
        Room room = getRoom(roomId);
        if (room != null) {
            room.setRevealed(true);
            redisTemplate.opsForValue().set(ROOM_KEY_PREFIX + roomId, room, 48, TimeUnit.HOURS);
        }
    }

    public void clearVotes(String roomId) {
        Room room = getRoom(roomId);
        if (room != null) {
            room.getUserVotes().clear();
            room.setRevealed(false);
            redisTemplate.opsForValue().set(ROOM_KEY_PREFIX + roomId, room, 48, TimeUnit.HOURS);
        }
    }

    public Map<String, String> getUserNames(String roomId) {
        Room room = getRoom(roomId);
        return room != null ? room.getUserNames() : Collections.emptyMap();
    }

    public boolean addUserName(String roomId, String userId, String name) {
        Room room = getRoom(roomId);
        if (room != null) {
            if (!room.canAddUser()) {
                return false;  // Room is full
            }
            room.addUserName(userId, name);
            redisTemplate.opsForValue().set(
                    ROOM_KEY_PREFIX + roomId,
                    room,
                    48,
                    TimeUnit.HOURS
            );
            return true;
        }
        return false;
    }

    public boolean isRevealed(String roomId) {
        Room room = getRoom(roomId);
        return room != null && room.isRevealed();
    }

    private String generateRoomId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }


    public void saveRoom(Room room) {
        redisTemplate.opsForValue().set(
                ROOM_KEY_PREFIX + room.getRoomId(),
                room,
                24, // TTL in hours
                TimeUnit.HOURS
        );
    }

//    public void removeUser(String roomId, String userId) {
//        Room room = getRoom(roomId);
//        if (room != null) {
//            room.getUserVotes().remove(userId);
//            room.getUserNames().remove(userId);
//            saveRoom(room);
//        }
//    }

    public Map<String, Object> getRoomState(String roomId) {
        Map<String, Object> state = new HashMap<>();
        state.put("votes", getVotes(roomId));
        state.put("names", getUserNames(roomId));
        state.put("revealed", isRevealed(roomId));
        return state;
    }
    public void removeUser(String roomId, String userId) {
        Room room = getRoom(roomId);
        if (room != null) {
            room.getUserVotes().remove(userId);
            room.getUserNames().remove(userId);
            saveRoom(room);

            // Broadcast the updated user list
            Map<String, Object> state = getRoomState(roomId);
            messageTemplate.convertAndSend("/topic/room." + roomId + ".votes", state);
        }
    }


    // Add these methods to your RoomService.java

    /**
     * Finds all room keys using SCAN (safe for production use)
     */
    public Set<String> getAllRoomKeys() {
        Set<String> keys = new HashSet<>();
        ScanOptions options = ScanOptions.scanOptions()
                .match(ROOM_KEY_PREFIX + "*")
                .count(100) // batch size
                .build();

        try (Cursor<byte[]> cursor = redisTemplate.getConnectionFactory()
                .getConnection()
                .scan(options)) {

            while (cursor.hasNext()) {
                keys.add(new String(cursor.next()));
            }
        }
        return keys;
    }

    /**
     * Gets a room if it exists
     */
    public Room getRoomIfExists(String roomId) {
        return (Room) redisTemplate.opsForValue().get(ROOM_KEY_PREFIX + roomId);
    }

    /**
     * Deletes a room
     */
    public void deleteRoom(String roomId) {
        redisTemplate.delete(ROOM_KEY_PREFIX + roomId);
    }
}