$(document).ready(function () {
  connect();
});

function connect() {
  url = `ws://${location.host}/mpd`;
  ws = new WebSocket(url);

  ws.onopen = function () {
    console.log(`Connected to socket ${url}`);
    bindEvents(ws);
    $.get("/current_song", function (data, textStatus, jqXHR) {
      changeSongTitle(data);
      changeAlbumArt();
    });
    $.get("/status", function (data, textStatus, jqXHR) {
      mpd_status = JSON.parse(data);
      changeFavicon(mpd_status.state);
      changeButtonState(mpd_status.state);
      changeRandomButtonState(mpd_status.random);
      changeRepeatButtonState(mpd_status.repeat);
      changeSingleButtonState(mpd_status.single);
    });
  };

  ws.onclose = function (e) {
    console.log(
      "Socket is closed. Reconnect will be attempted in 1 second.",
      e.reason
    );
    unbindEvents();
    setTimeout(function () {
      connect();
    }, 1000);
  };

  window.onbeforeunload = function () {
    websocket.onclose = function () {}; // disable onclose handler first
    websocket.close();
  };

  ws.onmessage = function (e) {
    data = JSON.parse(e.data);

    switch (data.action) {
      case "song":
        changeSongTitle(data.song);
        changeAlbumArt();
        break;
      case "state":
        changeFavicon(data.state);
        changeButtonState(data.state);
        break;
      case "random":
        changeRandomButtonState(data.state);
        break;
      case "repeat":
        changeRepeatButtonState(data.state);
        break;
      case "single":
        changeSingleButtonState(data.state);
        break;
      default:
      // nothing
    }
  };
}

function bindEvents(ws) {
  $("button#nextSong").bind("click", function (e) {
    ws.send("nextSong");
    e.preventDefault();
  });

  $("button#prevSong").bind("click", function (e) {
    ws.send("prevSong");
    e.preventDefault();
  });

  $("button#togglePlayPause").bind("click", function (e) {
    ws.send("togglePlayPause");
    e.preventDefault();
  });

  $("button#toggleRandom").bind("click", function (e) {
    ws.send("toggleRandom");
    e.preventDefault();
  });

  $("button#toggleRepeat").bind("click", function (e) {
    ws.send("toggleRepeat");
    e.preventDefault();
  });

  $("button#toggleSingle").bind("click", function (e) {
    ws.send("toggleSingle");
    e.preventDefault();
  });
}

function unbindEvents() {
  $("button#nextSong").unbind("click");
  $("button#prevSong").unbind("click");
  $("button#togglePlayPause").unbind("click");
  $("button#toggleRandom").unbind("click");
  $("button#toggleRepeat").unbind("click");
  $("button#toggleSingle").unbind("click");
}

function changeSongTitle(data) {
  song = JSON.parse(data);

  pageTitle = `${song["Artist"]} - ${song["Title"]}`;
  $("#currentSong #artist").html(song["Artist"]);
  $("#currentSong #title").html(song["Title"]);
  $(document).prop("title", pageTitle);
}

function changeAlbumArt() {
  newSrc = `/albumart?timestamp=${new Date().getTime()}`
  $("#albumCover").attr("src", newSrc);
  $("#albumCover-preview").attr("src", newSrc);
}

function changeButtonState(state) {
  togglePlayPauseButton = $("button#togglePlayPause");

  switch (state) {
    case "pause":
      togglePlayPauseButton.html("<i class='fas fa-play'></i>");
      break;
    case "play":
      togglePlayPauseButton.html("<i class='fas fa-pause'></i>");
      break;
    case "stop":
      togglePlayPauseButton.html("<i class='fas fa-play'></i>");
      break;
    default:
    // unknown state
  }
}

function changeRandomButtonState(state) {
  toggleRandomButton = $("button#toggleRandom");

  switch (state) {
    case "0":
      toggleRandomButton.removeClass("active");
      break;
    case "1":
      toggleRandomButton.addClass("active");
      break;
    default:
    // unknown state
  }
}

function changeRepeatButtonState(state) {
  toggleRepeatButton = $("button#toggleRepeat");

  switch (state) {
    case "0":
      toggleRepeatButton.removeClass("active");
      break;
    case "1":
      toggleRepeatButton.addClass("active");
      break;
    default:
    // unknown state
  }
}

function changeSingleButtonState(state) {
  toggleSingleButton = $("button#toggleSingle");

  switch (state) {
    case "0":
      toggleSingleButton.removeClass("active");
      break;
    case "1":
      toggleSingleButton.addClass("active");
      break;
    default:
    // unknown state
  }
}

function changeFavicon(state) {
  $('link[rel="shortcut icon"]').attr("href", `/favicons/${state}.ico`);
}
