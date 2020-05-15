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
    if response = mpd_client.albumart(current_song["file"])
      send_file env, response.to_slice, "image/jpeg"
    end
  else
    send_file env, "./public/images/record_placeholder.jpg", "image/jpeg"
  end
rescue
  send_file env, "./public/images/record_placeholder.jpg", "image/jpeg"
end

ws "/mpd" do |socket|
  # Add the client to SOCKETS list
  SOCKETS << socket

  socket.on_message do |message|
    json = JSON.parse(message)

    case json["action"]
    when "nextSong"
      mpd_client.next
    when "prevSong"
      mpd_client.previous
    when "togglePlayPause"
      mpd_client.toggle_play_pause
    when "toggleRandom"
      mpd_client.toggle_mode("random")
    when "toggleRepeat"
      mpd_client.toggle_mode("repeat")
    when "toggleSingle"
      mpd_client.toggle_mode("single")
    when "seek"
      mpd_client.set_song_position(json["data"].as_f)
    when "volume"
      mpd_client.setvol(json["data"].as_i)
    else
      nil
    end
  end

  # Remove clients from the list when it's closed
  socket.on_close do
    SOCKETS.delete(socket)
  end
end

Kemal.run
