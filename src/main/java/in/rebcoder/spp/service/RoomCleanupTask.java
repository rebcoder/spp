package in.rebcoder.spp.service;

import in.rebcoder.spp.model.Room;
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
        long inactivityThreshold = 3600000; // 1 hour in milliseconds

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
}