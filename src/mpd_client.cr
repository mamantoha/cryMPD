class MPDClient
  getter client

  def initialize(@sockets : Array(HTTP::WebSocket))
    MPD::Log.level = :error
    MPD::Log.backend = ::Log::IOBackend.new

    @client = MPD::Client.new("localhost", 6600, with_callbacks: true)
    # @client = MPD::Client.new("/run/mpd/socket", with_callbacks: true)
    @client.callbacks_timeout = 100.milliseconds

    set_callbacks
  end

  private def set_callbacks
    @client.on :song do |_song|
      if song = client.currentsong
        data = {"action" => "song", "song" => song}

        SOCKETS.each(&.send(data.to_json))
      end
    end

    @client.on :state do |state|
      data = {"action" => "state", "state" => state}

      SOCKETS.each(&.send(data.to_json))
    end

    @client.on :random do |random|
      data = {"action" => "random", "state" => random}

      SOCKETS.each(&.send(data.to_json))
    end

    @client.on :repeat do |repeat|
      data = {"action" => "repeat", "state" => repeat}

      SOCKETS.each(&.send(data.to_json))
    end

    @client.on :single do |single|
      data = {"action" => "single", "state" => single}

      SOCKETS.each(&.send(data.to_json))
    end

    @client.on :time do |time|
      time = time.split(':')
      data = {"action" => "time", "position" => time[0], "duration" => time[1]}

      SOCKETS.each(&.send(data.to_json))
    end

    @client.on :volume do |volume|
      data = {"action" => "volume", "volume" => volume}

      SOCKETS.each(&.send(data.to_json))
    end

    @client.on :playlist do
      data = {"action" => "playlist"}

      SOCKETS.each(&.send(data.to_json))
    end

    @client.on :playlistlength do
      data = {"action" => "playlist"}

      SOCKETS.each(&.send(data.to_json))
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
