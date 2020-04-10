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
      if status = mpd_client.status
        case status["random"]
        when "0"
          mpd_client.random(true)
        when "1"
          mpd_client.random(false)
        else
          # unknown state
        end
      end
    when "toggleRepeat"
      if status = mpd_client.status
        case status["repeat"]
        when "0"
          mpd_client.repeat(true)
        when "1"
          mpd_client.repeat(false)
        else
          # unknown state
        end
      end
    else
      # nothing
    end
  end

  # Remove clients from the list when it's closed
  socket.on_close do
    SOCKETS.delete(socket)
  end
end

Kemal.run
