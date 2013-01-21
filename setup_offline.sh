mkdir -p public/offline
mkdir -p public/offline
rm -rf public/offline/*
curl http://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js > public/offline/jquery.min.js
curl http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.3/underscore-min.js > public/offline/underscore-min.js
curl http://netdna.bootstrapcdn.com/twitter-bootstrap/2.2.2/js/bootstrap.min.js > public/offline/bootstrap.min.js
curl http://netdna.bootstrapcdn.com/twitter-bootstrap/2.2.2/css/bootstrap-combined.min.css > public/offline/bootstrap-combined.min.css
curl http://mindmup.s3.amazonaws.com/lib/kinetic-v4.2.0-custom-min.js > public/offline/kinetic-v4.2.0-custom-min.js
