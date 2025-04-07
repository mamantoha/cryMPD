class MPDClient
  getter client

  def initialize(@sockets : Array(HTTP::WebSocket), mpd_host : String, mpd_port : Int32)
    MPD::Log.level = :error
    MPD::Log.backend = ::Log::IOBackend.new

    @client = MPD::Client.new(mpd_host, mpd_port, with_callbacks: true)
    # @client = MPD::Client.new("/run/mpd/socket", with_callbacks: true)
    @client.callbacks_timeout = 100.milliseconds

    set_callbacks
  end

  private def set_callbacks
    client.on_callback do |event, state|
      case event
      when .song?
        if song = client.currentsong
          data = {"action" => "song", "song" => song}

          SOCKETS.each(&.send(data.to_json))
        end
      when .state?, .random?, .single?, .repeat?
        data = {"action" => event.to_s.downcase, "state" => state}

        SOCKETS.each(&.send(data.to_json))
      when .time?
        time = state.split(':')
        data = {"action" => "time", "position" => time[0], "duration" => time[1]}

        SOCKETS.each(&.send(data.to_json))
      when .volume?
        data = {"action" => "volume", "volume" => state}

        SOCKETS.each(&.send(data.to_json))
      when .playlist?
        data = {"action" => "playlist"}

        SOCKETS.each(&.send(data.to_json))
      when .playlistlength?
        data = {"action" => "playlist"}

        SOCKETS.each(&.send(data.to_json))
      end
    end
  end

  def toggle_play_pause
    status.try do |status|
      case status["state"]
      when "play"
        pause
      when "pause", "stop"
        play
      end
    end
  end

  def toggle_mode(mode)
    status.try do |status|
      state = status[mode] == "0"
      case mode
      when "random"
        random(state)
      when "repeat"
        repeat(state)
      when "single"
        single(state)
      else
        nil
      end
    end
  end

  # `relative` - from 0 to 1
  def set_song_position(relative : Float64)
    if current_song = client.currentsong
      time = current_song["Time"].to_i
      seekcur((time * relative).to_i)
    end
  end

  forward_missing_to @client
end
