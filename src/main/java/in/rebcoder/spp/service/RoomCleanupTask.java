package in.rebcoder.spp.service;

import in.rebcoder.spp.model.Room;
import in.rebcoder.spp.model.Vote;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class RoomCleanupTask {

    @Autowired
    private RoomService roomService;

    @Scheduled(fixedRate = 60000) // Run every minute
    public void cleanupInactiveRooms() {
        long currentTime = System.currentTimeMillis();
        long inactivityThreshold = 30000000; // 30 minutes

        roomService.getAllRoomKeys().forEach(roomKey -> {
            String roomId = roomKey.replace(roomService.ROOM_KEY_PREFIX, "");
            Room room = roomService.getRoomIfExists(roomId);

            if (room != null &&
                    (currentTime - room.getLastActivityTime()) > inactivityThreshold) {
                roomService.deleteRoom(roomId);
                System.out.println("Cleaned up inactive room: " + roomId);
            }
        });
    }

    @Scheduled(fixedRate = 30000) // Run every 30 seconds
    public void cleanupInactiveUsers() {
        long currentTime = System.currentTimeMillis();
        long userInactivityThreshold = 900000; // 15 minutes

        roomService.getAllRoomKeys().forEach(roomKey -> {
            String roomId = roomKey.replace(RoomService.ROOM_KEY_PREFIX, "");
            Room room = roomService.getRoomIfExists(roomId);

            if (room != null) {
                // Check each user's last activity
                room.getUserNames().keySet().forEach(userId -> {
                    Vote vote = room.getUserVotes().get(userId);
                    if (vote != null &&
                            (currentTime - vote.getLastActivity()) > userInactivityThreshold) {
                        roomService.removeUser(roomId, userId);
                    }
                });
            }
        });
    }
}