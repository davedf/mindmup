rm -rf public/offline

mkdir -p public/offline/fortawesome

for c in `cat views/scripts.erb | tr -d '\n'  | grep -o '"//[^"]*"' | tr -d \" `; do curl http:$c > public/offline/${c##[a-z/]*/}; done
		
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/FontAwesome.otf > public/offline/fortawesome/FontAwesome.otf
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/font-awesome.min.css > public/offline/fortawesome/font-awesome.min.css
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/fontawesome-webfont.eot > public/offline/fortawesome/fontawesome-webfont.eot
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/fontawesome-webfont.svg > public/offline/fortawesome/fontawesome-webfont.svg
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/fontawesome-webfont.ttf > public/offline/fortawesome/fontawesome-webfont.ttf
curl http://mindmup.s3.amazonaws.com/lib/fortawesome/fontawesome-webfont.woff > public/offline/fortawesome/fontawesome-webfont.woff
curl http://mindmup.s3.amazonaws.com/map/default.json > public/offline/default.json
