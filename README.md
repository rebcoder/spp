# Scrum Poker Planner (SPP) 🃏

<img width="1039" height="384" alt="Screenshot 2025-08-14 at 1 59 29 AM" src="https://github.com/user-attachments/assets/2c807825-7e45-46e4-a59e-056957ec08ff" />
<img width="893" height="950" alt="Screenshot 2025-08-14 at 2 01 42 AM" src="https://github.com/user-attachments/assets/7c51c858-5b9e-41c3-acd8-7fb36f6cd5e4" />


A real-time collaborative planning poker application for agile teams to estimate user stories efficiently.

## Features ✨

- **Real-time voting** with WebSocket communication
- **Room-based collaboration** for team estimation sessions
- **Vote reveal/clear** functionality
- **User presence tracking** with avatars
- **Room capacity management** (max 15 users)
- **Automatic cleanup** of inactive rooms and users
- **Responsive design** works on desktop and mobile
- **Secure** with CSRF protection and proper CORS configuration

## Tech Stack 🛠️

### Backend
- **Spring Boot 3** (Java 17)
- **WebSocket** with STOMP protocol
- **Redis** for persistence
- **RabbitMQ** as message broker
- **Spring Security**

### Frontend
- Vanilla JavaScript
- SockJS + STOMP.js
- Responsive CSS

### Infrastructure
- Docker Compose
- Redis
- RabbitMQ

## Getting Started 🚀

### Prerequisites
- Java 17+
- Docker
- Node.js (for optional frontend build)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rebcoder/spp.git
   cd spp
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Build and run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```

4. Access the application at: [http://localhost:8080](http://localhost:8080)

## Usage 📝

1. **Create or join a room**
   - Click "Create Room" to start a new session
   - Or enter an existing room code and click "Join Room"

2. **Enter your name** when prompted

3. **Vote on items** by clicking the card values

4. **Reveal votes** when everyone has voted

5. **Clear votes** to start a new round

## API Endpoints 🔌

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/create-room` | POST | Creates a new room |
| `/api/join-room?roomId={id}` | POST | Joins an existing room |
| `/api/votes?roomId={id}` | GET | Gets current votes |
| `/api/leave-room` | POST | Leaves a room |
| `/ws` | WebSocket | WebSocket endpoint |

## Configuration ⚙️

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_REDIS_HOST` | `localhost` | Redis host |
| `SPRING_RABBITMQ_HOST` | `localhost` | RabbitMQ host |
| `SPRING_RABBITMQ_PORT` | `61613` | STOMP port |
| `SPRING_RABBITMQ_USERNAME` | `guest` | RabbitMQ username |
| `SPRING_RABBITMQ_PASSWORD` | `guest` | RabbitMQ password |

## Contributing 🤝

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Screenshots 📷

*(Add screenshots of the application in action here)*

## Roadmap 🗺️

- [ ] Add user authentication
- [ ] Implement voting history
- [ ] Add admin controls
- [ ] Support for multiple voting rounds
- [ ] Mobile app version

---

**Happy Planning!** 🎉
