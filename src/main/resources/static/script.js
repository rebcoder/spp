let stompClient = null;
let userId = null;
let userName = null;
let currentRoomId = null;
let joinedUsers = new Set();
let joinedUsernames = new Set();

function generateUserId() {
  return Math.random().toString(36).substr(2, 6);
}
// Generate or retrieve existing user ID
function getOrCreateUserId() {
    let userId = sessionStorage.getItem('scrumPokerUserId');
    if (!userId) {
        userId = generateUserId();
        sessionStorage.setItem('scrumPokerUserId', userId);
    }
    return userId;
}


function getRoomIdFromUrl() {
  return new URLSearchParams(window.location.search).get('room');
}

function isRoomUrl() {
  return getRoomIdFromUrl() !== null;
}

function toggleRoomCreationOptions(show) {
  const display = show ? 'inline-block' : 'none';
  document.getElementById('create-room-btn').style.display = display;
  document.getElementById('room-code-input').style.display = display;
  document.getElementById('join-room-btn').style.display = display;
}

function promptForUserName() {
  let name = '';
  while (true) {
    name = prompt('Please enter your name (required):').trim();
    if (name === null) return null;
    if (name && name.length <= 20) break;
    alert(name ? 'Username must be less than 20 characters' : 'Username cannot be empty');
  }
  return name;
}

function isNewUser(userId) {
  if (!joinedUsers.has(userId)) {
    joinedUsers.add(userId);
    joinedUsernames.add(userName);
    return true;
  }
  return false;
}

document.getElementById('create-room-btn').addEventListener('click', () => {
  fetch('/api/create-room', { method: 'POST' })
    .then(response => response.text())
    .then(roomId => {
      userId = generateUserId();
      window.location.href = `${window.location.origin}?room=${roomId}`;
    });
});

document.getElementById('join-room-btn').addEventListener('click', () => {
  const roomId = document.getElementById('room-code-input').value;
  if (roomId) {
    fetch(`/api/join-room?roomId=${roomId}`, { method: 'POST' })
      .then(response => {
        if (response.ok) {
          userId = generateUserId();
          promptForUserName();
          window.location.href = `${window.location.origin}?room=${roomId}`;
        } else {
          alert('Room not found. Please enter a valid room code.');
        }
      });
  } else {
    alert('Please enter a valid room code.');
  }
});

document.getElementById('copy-link-btn').addEventListener('click', () => {
  const roomId = document.getElementById('room-code').textContent;
  const link = `${window.location.origin}?room=${roomId}`;
  navigator.clipboard.writeText(link)
    .then(() => alert('Room link copied to clipboard!'))
    .catch(err => {
      alert('Failed to copy link. Please copy manually.');
      console.error('Failed to copy link: ', err);
    });
});

document.querySelectorAll('.vote-btn').forEach(button => {
  button.addEventListener('click', function () {
    sendVote(document.getElementById('room-code').textContent, this.getAttribute('data-value'));
  });
});

document.getElementById('reveal-votes-btn').addEventListener('click', () => {
  const roomId = document.getElementById('room-code').textContent;
  if (stompClient && stompClient.connected) {
    stompClient.send(`/app/room.${roomId}.reveal`, {}, JSON.stringify({}));
    connectWebSocket(roomId);
  } else {
    console.error('Not connected to WebSocket');
  }
});

document.getElementById('clear-votes-btn').addEventListener('click', () => {
  const roomId = document.getElementById('room-code').textContent;
  if (stompClient && stompClient.connected) {
    stompClient.send(`/app/room.${roomId}.clear`, {}, JSON.stringify({}));
    connectWebSocket(roomId);
  } else {
    console.error('Not connected to WebSocket');
    alert('Please wait for connection to establish');
  }
});

document.getElementById('go-home-btn').addEventListener('click', () => {
  window.location.href = `${window.location.origin}/index.html`;
});

//function connectWebSocket(roomId) {
//    currentRoomId = roomId; // Store current room ID
//
//    const socket = new SockJS('/ws');
//    stompClient = Stomp.over(socket);
//
//    stompClient.connect({}, function(frame) {
//        // Send reconnect instead of join if we have existing ID
//        const endpoint = sessionStorage.getItem('scrumPokerReconnected')
//            ? `/app/reconnect.${roomId}`
//            : `/app/join.${roomId}`;
//
//        stompClient.send(endpoint, {}, JSON.stringify({ userId, userName }));
//        sessionStorage.setItem('scrumPokerReconnected', 'true');
//
//        stompClient.subscribe(`/topic/room.${roomId}.votes`, function(message) {
//            const state = JSON.parse(message.body);
//            updateUsersList(state.names);
//            updateVotesList(state.votes, state.names, state.revealed);
//        });
//    }, function(error) {
//        console.error('Connection error:', error);
//        setTimeout(() => connectWebSocket(roomId), 5000);
//    });
//}

function connectWebSocket(roomId) {
    currentRoomId = roomId;
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        // Subscribe to room updates first
        const roomSubscription = stompClient.subscribe(`/topic/room.${roomId}`, function(message) {
            const data = JSON.parse(message.body);

            // Handle room full error
            if (data.error === "Room is full") {
                alert("This room has reached its maximum capacity (15 users)");
                window.location.href = `${window.location.origin}`;
                return;
            }

            // Handle normal updates
            if (data.votes !== undefined) {
                updateUsersList(data.names);
                updateVotesList(data.votes, data.names, data.revealed);
            }
        });

        // Subscribe to vote updates
        const voteSubscription = stompClient.subscribe(`/topic/room.${roomId}.votes`, function(message) {
            const state = JSON.parse(message.body);
            updateUsersList(state.names);
            updateVotesList(state.votes, state.names, state.revealed);
        });

        // Send join/reconnect message
        const endpoint = sessionStorage.getItem('scrumPokerReconnected')
            ? `/app/reconnect.${roomId}`
            : `/app/join.${roomId}`;

        stompClient.send(endpoint, {}, JSON.stringify({
            userId,
            userName
        }));

        sessionStorage.setItem('scrumPokerReconnected', 'true');

        // Store subscriptions for cleanup
        socket.subscriptions = {
            room: roomSubscription,
            votes: voteSubscription
        };

    }, function(error) {
        console.error('Connection error:', error);
        showNotification("Connection lost - reconnecting...");
        setTimeout(() => connectWebSocket(roomId), 5000);
    });

    // Better disconnect handling
    window.addEventListener('beforeunload', () => {
        if (stompClient && stompClient.connected) {
            stompClient.send(`/app/room.${roomId}.leave`, {},
                JSON.stringify({ userId }));
            stompClient.disconnect();
        }
    });
}

function sendVote(roomId, voteValue) {
  stompClient.send(`/app/vote.${roomId}`, {}, JSON.stringify({ userId, vote: voteValue, userName }));
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function updateUsersList(names) {
  document.getElementById('current-users').textContent = Object.keys(names).length;
  const usersList = document.getElementById('users-list');
  const userCount = document.getElementById('user-count');
  usersList.innerHTML = '';
  userCount.textContent = Object.keys(names).length;

  const fragment = document.createDocumentFragment();
  Object.entries(names).forEach(([userId, name]) => {
    const userItem = document.createElement('li');
    userItem.className = 'user-item';
    if (userId === window.userId) userItem.classList.add('current-user');
    if (isNewUser(userId)) userItem.classList.add('new-user');
    userItem.innerHTML = `<span class="user-avatar">${name.charAt(0).toUpperCase()}</span><span class="user-name">${name}</span>`;
    fragment.appendChild(userItem);
  });

  usersList.appendChild(fragment);
  document.getElementById('users-section').style.display = 'block';
}

function updateVotesList(votes, names, revealed) {
  const votesList = document.getElementById('votes-list');
  votesList.innerHTML = '';
  const votesContainer = document.getElementById('votes-section');
  votesContainer.classList.toggle('votes-revealed', revealed);

  for (const [userId, vote] of Object.entries(votes)) {
    const userName = names[userId] || "Anonymous";
    const voteItem = document.createElement('li');
    voteItem.innerHTML = `<span class="voter-name">${userName}</span><div><span>Voted</span><span class="voted-number">${revealed ? vote : '?'}</span></div>`;
    votesList.appendChild(voteItem);
  }

  votesContainer.style.display = 'block';
}

window.onload = function() {
  if (isRoomUrl()) {
    const roomId = getRoomIdFromUrl();
    userId = getOrCreateUserId();
    userName = promptForUserName();
    if (!userName) {
      window.location.href = `${window.location.origin}/index.html`;
      return;
    }
    sessionStorage.setItem('scrumPokerUsername', userName);
    document.getElementById('room-code').textContent = roomId;
    document.getElementById('user-name').textContent = userName;
    document.getElementById('room-info').style.display = 'block';
    document.getElementById('voting-section').style.display = 'block';
    toggleRoomCreationOptions(false);
    document.getElementById('go-home-btn').style.display = 'inline-block';
    connectWebSocket(roomId);
  } else {
    sessionStorage.removeItem('scrumPokerUsername');
    toggleRoomCreationOptions(true);
  }
};

// Add beforeunload handler to clean up
window.addEventListener('beforeunload', function() {
    if (currentRoomId && userId) {
        // Send leave message more reliably
        navigator.sendBeacon(`/api/leave-room?roomId=${currentRoomId}&userId=${userId}`);
    }
});

document.addEventListener('keydown', function(e) {
  if ((e.key === 'F5') || (e.key === 'r' && e.ctrlKey) || (e.key === 'R' && e.ctrlKey && e.shiftKey)) {
    e.preventDefault();
    showToast('Refresh is disabled - use the navigation buttons instead');
  }
});

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}


// Update your leaveRoom function
function leaveRoom() {
    if (stompClient) {
        stompClient.send(`/app/room.${currentRoomId}.leave`, {},
            JSON.stringify({ userId: userId }));
        stompClient.disconnect();
    }
    window.location.href = '/';
}
