rm -rf public/offline

mkdir -p public/offline/fortawesome

curl http://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js > public/offline/jquery.min.js
curl http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.3/underscore-min.js > public/offline/underscore-min.js
curl http://netdna.bootstrapcdn.com/twitter-bootstrap/2.2.2/js/bootstrap.min.js > public/offline/bootstrap.min.js
curl http://netdna.bootstrapcdn.com/twitter-bootstrap/2.2.2/css/bootstrap-combined.min.css > public/offline/bootstrap-combined.min.css
curl http://mindmup.s3.amazonaws.com/lib/kinetic-v4.2.0-custom-min.js > public/offline/kinetic-v4.2.0-custom-min.js
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/FontAwesome.otf > public/offline/fortawesome/FontAwesome.otf
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/font-awesome.min.css > public/offline/fortawesome/font-awesome.min.css
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/fontawesome-webfont.eot > public/offline/fortawesome/fontawesome-webfont.eot
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/fontawesome-webfont.svg > public/offline/fortawesome/fontawesome-webfont.svg
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/fontawesome-webfont.ttf > public/offline/fortawesome/fontawesome-webfont.ttf
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/fontawesome-webfont.woff > public/offline/fortawesome/fontawesome-webfont.woff
curl http://mindmup.s3.amazonaws.com/lib/jquery-ui-1.10.0.custom.min.js > public/offline/jquery-ui-1.10.0.custom.min.js
curl http://mindmup.s3.amazonaws.com/lib/jquery-ui-1.10.0.custom.min.js > public/offline/jquery-ui-1.10.0.custom.min.js
curl http://mindmup.s3.amazonaws.com/map/default.json > public/offline/default.json
