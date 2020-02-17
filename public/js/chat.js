const socket = io();

// Elements
const $messageForm = document.getElementById('message-form');
const $sendLocation = document.getElementById('send-location');
const $messageFormInput = document.getElementById('message-form-input');
const $messageFormSend = document.getElementById('message-form-send');
const $messages = document.getElementById('messages');
const $locations = document.getElementById('locations');
const $sidebar = document.getElementById('sidebar');

// Templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationTemplate = document.getElementById('location-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  //disable the form
  $messageFormSend.setAttribute('disabled', 'disabled');
  const message = e.target.elements.message.value;

  socket.emit('sendMessage', message, (err) => {
    // enable
    $messageFormSend.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();
    if (err) {
      return console.log(err);

    }
    console.log('The message was delivered.', message);
  });
});

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

$sendLocation.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser');
  }

  $sendLocation.setAttribute('disabled', 'disabled');
  navigator.geolocation.getCurrentPosition((position) => {
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };


    socket.emit('sendLocation', coords, (message) => {
      $sendLocation.removeAttribute('disabled');
      console.log(message);
    });
  });
});

socket.on('sendMessage', (data) => {
  console.log(data);
});

socket.on('locationMessage', (location) => {
  console.log(location);
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    locationURL: location.url,
    createdAt: moment(location.createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
});

socket.on('roomData', (({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });

  $sidebar.innerHTML = html
}));

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    // Jump back to the home directory
    location.href = '/'
  }
});