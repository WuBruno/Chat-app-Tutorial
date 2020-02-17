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

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage); // Gets the style of the given component
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
}


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
    });
  });
});

socket.on('locationMessage', (location) => {
  console.log(location);
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    locationURL: location.url,
    createdAt: moment(location.createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll()
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
  autoscroll()
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    // Jump back to the home directory
    location.href = '/'
  }
});