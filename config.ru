require File.dirname(__FILE__)+'/web.rb'
$stdout.sync = true

run Sinatra::Application
