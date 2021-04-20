require "json"
require "kemal"
require "crystal_mpd"
require "./mpd_client"

SOCKETS = [] of HTTP::WebSocket

mpd_client = MPDClient.new(SOCKETS)

before_get ["/current_song", "/status", "/stats", "/playlist"] do |env|
  env.response.content_type = "application/json"
end

get "/" do
  render "views/index.ecr"
end

get "/current_song" do
  mpd_client.current_song
end

get "/status" do
  mpd_client.status.to_json
end

post "/update" do
  mpd_client.update
end

get "/stats" do
  stats = {} of String => String

  stats["mpd_version"] = mpd_client.version.to_s

  if mpd_stats = mpd_client.stats
    stats["artists"] = mpd_stats["artists"]
    stats["albums"] = mpd_stats["albums"]
    stats["songs"] = mpd_stats["songs"]
    stats["uptime"] = mpd_stats["uptime"].to_i.seconds.to_s
    stats["playtime"] = mpd_stats["playtime"].to_i.seconds.to_s
    stats["db_playtime"] = mpd_stats["db_playtime"].to_i.seconds.to_s
    stats["db_update"] = Time.unix(mpd_stats["db_update"].to_i).to_s
  end

  stats.to_json
end

get "/playlist" do
  songs = [] of Hash(String, String)

  if data = mpd_client.playlistinfo
    data.each do |song|
      time = Time::Span.new(seconds: song["Time"].to_i)

      songs << {
        "id"       => song["Id"],
        "pos"      => song["Pos"],
        "artist"   => song["Artist"]? || "",
        "title"    => song["Title"]? || "",
        "duration" => "#{time.minutes}:#{time.seconds.to_s.rjust(2, '0')}",
      }
    end
  end

  songs.to_json
end

get "/play/:songpos" do |env|
  songpos = env.params.url["songpos"].to_i

  mpd_client.play(songpos)
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
    end
  end

  # Remove clients from the list when it's closed
  socket.on_close do
    SOCKETS.delete(socket)
  end
end

Kemal.run
