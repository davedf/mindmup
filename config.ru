require File.dirname(__FILE__)+'/web.rb'
$stdout.sync = true
 use Rack::Session::Cookie,  :expire_after => 2678400, # In seconds
                             :secret => 'not a secret'
run Sinatra::Application
