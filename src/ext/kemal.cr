module Kemal
  # TODO https://github.com/kemalcr/kemal/pull/568
  class WebSocketHandler
    def call(context : HTTP::Server::Context)
      return call_next(context) unless context.ws_route_found? && websocket_upgrade_request?(context)
      context.websocket.call(context)
    end
  end
end
