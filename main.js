// Options
const CLIENT_ID = '201992105800-7n4f17d3eibu5q6hgcatooqtih13kf02.apps.googleusercontent.com';
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'
];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.getElementById('content');
const channelForm = document.getElementById('channel-form');
const channelInput = document.getElementById('channel-input');

const playlistContainer = document.getElementById('playlist-container');
const videoContainer = document.getElementById('video-container');

//const defaultChannel = 'techguyweb';
const defaultChannel = 'UCglktuLV6GWCg5MHdTGQYDQ';

// Form submit and change channel
// channelForm.addEventListener('submit', e => {
//   e.preventDefault();

//   const channel = channelInput.value;

//   getChannel(channel);
// });

// Load auth2 library
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

// Init API client library and set up sign in listeners
function initClient() {
  gapi.client
    .init({
      discoveryDocs: DISCOVERY_DOCS,
      clientId: CLIENT_ID,
      scope: SCOPES
    })
    .then(() => {
      // Listen for sign in state changes
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      // Handle initial sign in state
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
    });
}

// Update UI sign in state changes
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    content.style.display = 'block';
    videoContainer.style.display = 'block';
    getChannel(defaultChannel);
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    content.style.display = 'none';
    videoContainer.style.display = 'none';
  }
}

// Handle login
function handleAuthClick() {
  gapi.auth2.getAuthInstance().signIn();
}

// Handle logout
function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}

// Display channel data
function showChannelData(data) {
  const channelData = document.getElementById('channel-data');
  channelData.innerHTML = data;
}

// Get channel from API
function getChannel(channel) {
  gapi.client.youtube.channels
    .list({
      part: 'snippet,contentDetails,statistics',
      id: channel
      //forUsername: channel
    })
    .then(response => {
      console.log("whole response: ", response);
      const channel = response.result.items[0];

      const output = `
        <ul class="collection">
          <li class="collection-item">Title: ${channel.snippet.title}</li>
          <li class="collection-item">ID: ${channel.id}</li>
          <li class="collection-item">Subscribers: ${numberWithCommas(
        channel.statistics.subscriberCount
      )}</li>
          <li class="collection-item">Views: ${numberWithCommas(
        channel.statistics.viewCount
      )}</li>
          <li class="collection-item">Videos: ${numberWithCommas(
        channel.statistics.videoCount
      )}</li>
        </ul>
        <p>${channel.snippet.description}</p>
        <hr>
        <a class="btn grey dark" target="_blank" href="https://youtube.com/${
        channel.snippet.customUrl
        }">Visit Channel</a>
      `;
      showChannelData(output);

      console.log("channel: ", channel)

      const playlistId = channel.contentDetails.relatedPlaylists.uploads;
      requestVideoPlaylist(playlistId);
    })
    .catch(err => alert('No Channel By That Name'));
}

// get all playlists
function getPlaylists() {
  const requestOptions = {
    part: "snippet",
    mine: true
  };

  const request = gapi.client.youtube.playlists.list(requestOptions);

  request.execute(response => {
    //console.log("Response Playlists", response);
    playlists = response.items;
    console.log("items: ", playlists);
    if (playlists) {
      let output = '<br><h4 class="center-align">Packages</h4>';
      output += "<ul>"
      playlists.forEach(item => {

        output += `
          <li class="col s3">
            <div>
              <img width="10%" height="10%" src="${item.snippet.thumbnails.default.url}" />
              <h4>${item.snippet.title}</h4>
            </div>
          </li>
        `;
      });

      output += "</ul>"

      playlistContainer.innerHTML = output
    } else {
      playlistContainer.innerHTML = "No packages available"
    }
  });

  /*return gapi.client.youtube.playlists.list({
    part: "snippet",
    mine: true
  })
    .then(function (response) {
      // Handle the results here (response.result has the parsed body).
      console.log("Response Playlists", response);
    },
      function (err) { console.error("Execute error", err); });*/
}

// Add commas to number
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function requestVideoPlaylist(playlistId) {
  getPlaylists();
  const requestOptions = {
    playlistId: playlistId,
    part: 'snippet',
    maxResults: 10
  };

  const request = gapi.client.youtube.playlistItems.list(requestOptions);

  request.execute(response => {
    console.log(response);
    const playListItems = response.result.items;
    if (playListItems) {
      let output = '<br><h4 class="center-align">Latest Videos</h4>';

      // Loop through videos and append output
      playListItems.forEach(item => {
        const videoId = item.snippet.resourceId.videoId;

        output += `
          <div class="col s3">
          <iframe width="100%" height="auto" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          </div>
        `;
      });

      // Output videos
      videoContainer.innerHTML = output;
    } else {
      videoContainer.innerHTML = 'No Uploaded Videos';
    }
  });
}