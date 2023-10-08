$(document).ready(function () {
  connect();
  updatePlaylist();
  bindEvents();
});

function bindEvents() {
  $(".dropdown-menu.playlist-menu").on("click", function (event) {
    event.stopPropagation();
  });

  $("#playlistMenu").on("show.bs.dropdown", function () {
    scrollToCurentSong();
  });
}

function updatePlaylist() {
  let playlist = $("#playlistMenu #playlistTable");
  let playlistBody = playlist.find("tbody");

  $.get("/playlist", function (songs, _textStatus, _jqXHR) {
    if (songs) {
      playlistBody.html("");

      songs.forEach(function (song) {
        let songPos = parseInt(song["pos"]) + 1;
        let row = $(`
          <tr class="playlistSong" id="${song["pos"]}">
            <td>${songPos}</td>
            <td>${song["artist"]}</td>
            <td>${song["title"]}</td>
            <td>${song["duration"]}</td>
          </tr>
        `);
        playlistBody.append(row);
        row.on("click", playHandler);
      });
    }
  });
}

function connect() {
  url = `ws://${location.host}/mpd`;
  ws = new WebSocket(url);

  ws.onopen = function () {
    console.log(`Connected to socket ${url}`);
    bindWsEvents(ws);
    $.get("/current_song", function (song, _textStatus, _jqXHR) {
      if (song) {
        changeCurrentSong(song);
      } else {
        $(document).prop("title", "MPD Web Client");
      }

      changeAlbumArt();
    });
    $.get("/status", function (mpd_status, textStatus, jqXHR) {
      changeFavicon(mpd_status.state);
      changeButtonState(mpd_status.state);
      changeRandomButtonState(mpd_status.random);
      changeRepeatButtonState(mpd_status.repeat);
      changeSingleButtonState(mpd_status.single);
      changeVolume(mpd_status.volume);

      if (mpd_status.time) {
        time = mpd_status.time.split(":");
        position = parseInt(time[0]);
        duration = parseInt(time[1]);
        changeTimeProgress(position, duration);
      }
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
    ws.onclose = function () {}; // disable onclose handler first
    ws.close();
  };

  ws.onmessage = function (e) {
    data = JSON.parse(e.data);

    switch (data.action) {
      case "song":
        changeCurrentSong(data.song);
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
      case "time":
        position = parseInt(data.position);
        duration = parseInt(data.duration);
        changeTimeProgress(position, duration);
        break;
      case "volume":
        volume = data.volume;
        changeVolume(volume);
        break;
      case "playlist":
        updatePlaylist();
      default:
      // nothing
    }
  };
}

function bindWsEvents(ws) {
  $("button#nextSong").on("click", function (e) {
    message = JSON.stringify({
      action: "nextSong",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("button#prevSong").on("click", function (e) {
    message = JSON.stringify({
      action: "prevSong",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("button#togglePlayPause").on("click", function (e) {
    message = JSON.stringify({
      action: "togglePlayPause",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("button#toggleRandom").on("click", function (e) {
    message = JSON.stringify({
      action: "toggleRandom",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("button#toggleRepeat").on("click", function (e) {
    message = JSON.stringify({
      action: "toggleRepeat",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("button#toggleSingle").on("click", function (e) {
    message = JSON.stringify({
      action: "toggleSingle",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("input#progressBar").on("change", function () {
    handleChangeProgressInput(this);
  });

  $("input#volumeRange").on("input", function () {
    handleChangeVolumeInput(this);
  });

  $("#updateDB").on("click", function () {
    $.post("/update");
  });

  $("#exampleModal").on("show.bs.modal", function () {
    modal = $(this);

    $.get("/stats", function (stats, _textStatus, _jqXHR) {
      modal_body = modal.find(".modal-body");

      modal_body.find("#mpdInfo_version").text(stats.mpd_version);
      modal_body.find("#mpdstats_artists").text(stats.artists);
      modal_body.find("#mpdstats_albums").text(stats.albums);
      modal_body.find("#mpdstats_songs").text(stats.songs);
      modal_body.find("#mpdstats_dbPlaytime").text(stats.db_playtime);
      modal_body.find("#mpdstats_dbUpdated").text(stats.db_update);
      modal_body.find("#mpdstats_uptime").text(stats.uptime);
      modal_body.find("#mpdstats_playtime").text(stats.playtime);
    });
  });
}

function unbindEvents() {
  $("button#nextSong").off("click");
  $("button#prevSong").off("click");
  $("button#togglePlayPause").off("click");
  $("button#toggleRandom").off("click");
  $("button#toggleRepeat").off("click");
  $("button#toggleSingle").off("click");
  $("input#volumeRange").off();
}

function handleChangeProgressInput(progressInput) {
  clickedValue = parseInt(progressInput.value) / 1000;

  message = JSON.stringify({
    action: "seek",
    data: clickedValue,
  });

  ws.send(message);
}

function handleChangeVolumeInput(volumeInput) {
  message = JSON.stringify({
    action: "volume",
    data: parseInt(volumeInput.value),
  });

  ws.send(message);
}

function changeCurrentSong(song) {
  pageTitle = `${song["Artist"]} - ${song["Title"]}`;
  $(document).prop("title", pageTitle);

  $("#currentSong #artist").html(song["Artist"]);
  $("#currentSong #title").html(song["Title"]);
  $("#currentSong #album").html(song["Album"]);
  $("#currentSong #date").html(song["Date"]);

  $("#playlistTable tr").removeClass("table-primary");
  $("#playlistTable tr#" + song["Pos"]).addClass("table-primary");
}

function changeAlbumArt() {
  newSrc = `/albumart?timestamp=${new Date().getTime()}`;
  $("#albumCover").attr("src", newSrc);
}

function changeButtonState(state) {
  togglePlayPauseButton = $("button#togglePlayPause");

  switch (state) {
    case "play":
      togglePlayPauseButton.html(
        "<i class='material-icons pause_circle_filled'></i>"
      );
      disablePrevNextButtons(false);
      break;
    case "pause":
      togglePlayPauseButton.html(
        "<i class='material-icons play_circle_fill'></i>"
      );
      disablePrevNextButtons(true);
      break;
    case "stop":
      togglePlayPauseButton.html(
        "<i class='material-icons play_circle_fill'></i>"
      );
      disablePrevNextButtons(true);
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

function disablePrevNextButtons(disabled) {
  $("button#prevSong").attr("disabled", disabled);
  $("button#nextSong").attr("disabled", disabled);
}

function changeTimeProgress(position, duration) {
  progressBar = $("input#progressBar")[0];
  progressBar.value = (position / duration) * 1000;
  $(".timestamp").html(`${toMMSS(position)} / ${toMMSS(duration)}`);
}

function toMMSS(totalSeconds) {
  minutes = Math.floor(totalSeconds / 60);
  seconds = totalSeconds % 60;
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return `${minutes}:${seconds}`;
}

function changeVolume(volume) {
  $("span#volumePrct").html(`${volume} %`);
  $("input#volumeRange").val(volume);
}

function playHandler(event) {
  songPos = event.currentTarget.id;
  playSong(songPos);
}

function playSong(songPos) {
  $.get(`/play/${songPos}`);
}

function scrollToCurentSong() {
  $.get("/current_song", function (song, _textStatus, _jqXHR) {
    if (song) {
      scrollToSong(song);
    }
  });
}

function scrollToSong(song) {
  $("tr#" + song["Pos"])
    .get(0)
    .scrollIntoView();
}
