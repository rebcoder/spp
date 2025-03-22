let stompClient = null;
let userId = null;
let userName = null;

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
  userName = prompt('Please enter your name:');
  if (!userName) {
    userName = 'Anonymous';
  }
  document.getElementById('user-name').textContent = userName;
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
  const socket = new SockJS('/ws');
  stompClient = Stomp.over(socket);
  stompClient.connect({}, function (frame) {
    console.log('Connected: ' + frame);
    stompClient.send(`/app/join/${roomId}`, {}, JSON.stringify({ userId, userName }));
    stompClient.subscribe(`/topic/votes/${roomId}`, function (message) {
      const state = JSON.parse(message.body);
      updateUsersList(state.names); // Always update users list
      updateVotesList(state.votes, state.names, state.revealed); // Update votes list based on revealed state
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

function updateUsersList(names) {
  const usersList = document.getElementById('users-list');
  usersList.innerHTML = ''; // Clear the list before updating

  for (const [userId, name] of Object.entries(names)) {
    const userItem = document.createElement('li');
    userItem.textContent = name; // Display user name
    usersList.appendChild(userItem);
  }

  document.getElementById('users-section').style.display = 'block'; // Show the users section
}

function updateVotesList(votes, names, revealed) {
  const votesList = document.getElementById('votes-list');
  votesList.innerHTML = ''; // Clear the list before updating

  for (const [userId, vote] of Object.entries(votes)) {
    const userName = names[userId] || "Anonymous"; // Fallback to "Anonymous" if name is missing
    const voteItem = document.createElement('li');

    if (revealed) {
      voteItem.textContent = `${userName}: Voted ${vote}`; // Show vote if revealed
    } else {
      voteItem.textContent = `${userName}: Voted`; // Hide vote until revealed
    }

    votesList.appendChild(voteItem);
  }

  document.getElementById('votes-section').style.display = 'block'; // Show the votes section
}

window.onload = function () {
  if (isRoomUrl()) {
    const roomId = getRoomIdFromUrl();
    userId = generateUserId();
    promptForUserName();
    document.getElementById('room-code').textContent = roomId;
    document.getElementById('room-info').style.display = 'block';
    document.getElementById('voting-section').style.display = 'block';
    disableRoomCreationOptions();
    document.getElementById('go-home-btn').style.display = 'inline-block';
    connectWebSocket(roomId);
  } else {
    enableRoomCreationOptions();
  }

};