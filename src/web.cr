require "json"
require "kemal"
require "crystal_mpd"
require "./mpd_client"

SOCKETS = [] of HTTP::WebSocket

mpd_client = MPDClient.new(SOCKETS)

get "/" do
  render "views/index.ecr"
end

get "/current_song" do
  mpd_client.current_song
end

get "/status" do
  mpd_client.status.to_json
end

get "/albumart" do |env|
  if current_song = mpd_client.currentsong
    response = mpd_client.albumart(current_song["file"])

    if response
      send_file env, response.to_slice, "image/jpeg"
    end
  end
rescue
  send_file env, "./public/images/record_placeholder.jpg", "image/jpeg"
end

ws "/mpd" do |socket|
  # Add the client to SOCKETS list
  SOCKETS << socket

  socket.on_message do |message|
    case message
    when "nextSong"
      mpd_client.next
    when "prevSong"
      mpd_client.previous
    when "togglePlayPause"
      if status = mpd_client.status
        case status["state"]
        when "play"
          mpd_client.pause
        when "pause", "stop"
          mpd_client.play
        else
          # unknown state
        end
      end
    when "toggleRandom"
      toggle_mode(mpd_client, "random")
    when "toggleRepeat"
      toggle_mode(mpd_client, "repeat")
    when "toggleSingle"
      toggle_mode(mpd_client, "single")
    else
      # nothing
    end
  end

  # Remove clients from the list when it's closed
  socket.on_close do
    SOCKETS.delete(socket)
  end
end

def toggle_mode(mpd_client, mode)
  mpd_client.status.try do |status|
    state = status[mode] == "0" ? true : false
    case mode
    when "random"
      mpd_client.random(state)
    when "repeat"
      mpd_client.repeat(state)
    when "single"
      mpd_client.single(state)
    else
      # nothing
    end
  end
end

Kemal.run
