let stompClient = null;
let userId = null;
let userName = null;
let currentRoomId = null;
let joinedUsers = new Set();

function generateUserId() {
  return Math.random().toString(36).substr(2, 6);
}

function getRoomIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('room');
}

function isRoomUrl() {
  return getRoomIdFromUrl() !== null;
}

function disableRoomCreationOptions() {
  document.getElementById('create-room-btn').style.display = 'none';
  document.getElementById('room-code-input').style.display = 'none';
  document.getElementById('join-room-btn').style.display = 'none';
}

function enableRoomCreationOptions() {
  document.getElementById('create-room-btn').style.display = 'inline-block';
  document.getElementById('room-code-input').style.display = 'inline-block';
  document.getElementById('join-room-btn').style.display = 'inline-block';
}

function promptForUserName() {
  // Check if we already have a username in session storage
  const storedName = sessionStorage.getItem('scrumPokerUsername');
  if (storedName) {
    return storedName;
  }

  let name = '';
  while (true) {
    name = prompt('Please enter your name (required):');

    if (name === null) {
      // User clicked cancel
      return null;
    }

    name = name.trim();

    if (name === '') {
      alert('Username cannot be empty');
      continue;
    }

    if (name.length > 20) {
      alert('Username must be less than 20 characters');
      continue;
    }

    break;
  }

  return name;
}
// New User Tracking
function isNewUser(userId) {
  if (!joinedUsers.has(userId)) {
    joinedUsers.add(userId);
    return true;
  }
  return false;
}

document.getElementById('create-room-btn').addEventListener('click', function () {
  fetch('/api/create-room', { method: 'POST' })
    .then(response => response.text())
    .then(roomId => {
      userId = generateUserId();
      promptForUserName();
      const roomUrl = `${window.location.origin}?room=${roomId}`;
      window.location.href = roomUrl; // Redirect to the room URL
    });
});

document.getElementById('join-room-btn').addEventListener('click', function () {
  const roomId = document.getElementById('room-code-input').value;
  if (roomId) {
    fetch(`/api/join-room?roomId=${roomId}`, { method: 'POST' })
      .then(response => {
        if (response.ok) {
          userId = generateUserId();
          promptForUserName();
          const roomUrl = `${window.location.origin}?room=${roomId}`;
          window.location.href = roomUrl; // Redirect to the room URL
        } else {
          alert('Room not found. Please enter a valid room code.');
        }
      });
  } else {
    alert('Please enter a valid room code.');
  }
});

document.getElementById('copy-link-btn').addEventListener('click', function () {
  const roomId = document.getElementById('room-code').textContent;
  const link = `${window.location.origin}?room=${roomId}`;
  navigator.clipboard.writeText(link).then(() => {
    alert('Room link copied to clipboard!');
  }).catch(err => {
    alert('Failed to copy link. Please copy manually.');
    console.error('Failed to copy link: ', err);
  });
});

document.querySelectorAll('.vote-btn').forEach(button => {
  button.addEventListener('click', function () {
    const voteValue = this.getAttribute('data-value');
    const roomId = document.getElementById('room-code').textContent;
    sendVote(roomId, voteValue);
  });
});

document.getElementById('reveal-votes-btn').addEventListener('click', function () {
  const roomId = document.getElementById('room-code').textContent;
  stompClient.send(`/app/reveal/${roomId}`, {}, JSON.stringify({}));
});

document.getElementById('clear-votes-btn').addEventListener('click', function () {
  const roomId = document.getElementById('room-code').textContent;
  stompClient.send(`/app/clear-votes/${roomId}`, {}, JSON.stringify({}));
});

document.getElementById('go-home-btn').addEventListener('click', function () {
  window.location.href = `${window.location.origin}/index.html`;
});

function connectWebSocket(roomId) {
  currentRoomId = roomId;
  joinedUsers = new Set(); // Reset for new room
  const socket = new SockJS('/ws');
  stompClient = Stomp.over(socket);
  stompClient.connect({}, function (frame) {
    console.log('Connected: ' + frame);

    // Send join message with user info
    stompClient.send(`/app/join/${roomId}`, {},
      JSON.stringify({ userId, userName }));

    // Subscribe to room updates
    stompClient.subscribe(`/topic/votes/${roomId}`, function (message) {
      const state = JSON.parse(message.body);
      updateUsersList(state.names);  // Update users list
      updateVotesList(state.votes, state.names, state.revealed);
    });
  });
}

function sendVote(roomId, voteValue) {
  const payload = {
    userId: userId,
    vote: voteValue,
    userName: userName // Include userName in the payload
  };
  console.log("Sending vote payload:", payload); // Debugging
  stompClient.send(`/app/vote/${roomId}`, {}, JSON.stringify(payload));
}
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
function updateUsersList(names) {
  const usersList = document.getElementById('users-list');
  const userCount = document.getElementById('user-count');

  // Clear existing items but keep in DOM for smoother transitions
  while (usersList.firstChild) {
    usersList.removeChild(usersList.firstChild);
  }

  userCount.textContent = Object.keys(names).length;

  // Create document fragment for better performance
  const fragment = document.createDocumentFragment();

  Object.entries(names).forEach(([userId, name]) => {
    const userItem = document.createElement('li');
    userItem.className = 'user-item';

    if (userId === window.userId) {
      userItem.classList.add('current-user');
    }

    if (isNewUser(userId)) {
      userItem.classList.add('new-user');
    }

    userItem.innerHTML = `
      <span class="user-avatar">${name.charAt(0).toUpperCase()}</span>
      <span class="user-name">${name}</span>
    `;

    fragment.appendChild(userItem);
  });

  usersList.appendChild(fragment);
  document.getElementById('users-section').style.display = 'block';
}

function updateVotesList(votes, names, revealed) {
  const votesList = document.getElementById('votes-list');
  votesList.innerHTML = '';

  // Add revealed class to parent container
  const votesContainer = document.getElementById('votes-section');
  votesContainer.classList.toggle('votes-revealed', revealed);

  for (const [userId, vote] of Object.entries(votes)) {
    const userName = names[userId] || "Anonymous";
    const voteItem = document.createElement('li');

    voteItem.innerHTML = `
      <span class="voter-name">${userName}</span>
      <div>
        <span>Voted</span>
        <span class="voted-number">${revealed ? vote : '?'}</span>
      </div>
    `;

    votesList.appendChild(voteItem);
  }

  votesContainer.style.display = 'block';
}

window.onload = function() {
  if (isRoomUrl()) {
    const roomId = getRoomIdFromUrl();
    userId = generateUserId();

    // Always prompt for username, regardless of URL parameters
    userName = promptForUserName();

    if (!userName) {
      // If user cancels prompt, redirect to home
      window.location.href = `${window.location.origin}/index.html`;
      return;
    }

    // Store username in sessionStorage to persist through refreshes
    sessionStorage.setItem('scrumPokerUsername', userName);

    document.getElementById('room-code').textContent = roomId;
    document.getElementById('user-name').textContent = userName;
    document.getElementById('room-info').style.display = 'block';
    document.getElementById('voting-section').style.display = 'block';
    disableRoomCreationOptions();
    document.getElementById('go-home-btn').style.display = 'inline-block';

    connectWebSocket(roomId);
  } else {
    // Clear any stored username when on home page
    sessionStorage.removeItem('scrumPokerUsername');
    enableRoomCreationOptions();
  }
};