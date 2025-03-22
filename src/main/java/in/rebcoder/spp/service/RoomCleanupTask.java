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
        roomService.getRooms().entrySet().removeIf(entry -> {
            Room room = entry.getValue();
            return (currentTime - room.getLastActivityTime()) > 3600000; // 1 hour in milliseconds
        });
    }
}
