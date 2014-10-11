var circles = [];
var pins = [];
var map;

// setup the map and just put it's default location someplace.
function setupMap() {
  var mapOptions = {
    center: new google.maps.LatLng(-34.397, 150.644),
    zoom: 5,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };

  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
}


function drawCircles(distance, map) {
  var center = map.getCenter();

  //converts to meters
  var distanceRan = distance * 1000;

  var circleOptions = {
    radius: distanceRan,
    center: center,
    map: map,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2
  };

  var circle = new google.maps.Circle(circleOptions);

  // TODO: this state is ugly!
  circles.push(circle);
  map.fitBounds(circle.getBounds());

  var bounds = circle.getBounds();
  var NE = bounds.getNorthEast();
  var SW = bounds.getSouthWest();
  var north = NE.lat();
  var east = NE.lng();
  var south = SW.lat();
  var west = SW.lng();

  var URL = "/locations?"+"n="+north+"&s="+south+"&e="+east+"&w="+west;

  console.log("setting off cityRequest");
  var cityRequest = $.ajax({
    url: URL,
    contentType: "application/json",
    dataType: 'json',
    type: "GET",
    tryCount: 1,
    retryLimit: 5
  }).success(function(response) {
    if (response.success) {
      var cities = response.cities;
      console.log("found ", cities.length, " cities");
      $.each(cities, function(_, city) {
          var location = new google.maps.LatLng(city.lat, city.lng);
          var distance = google.maps.geometry.spherical.computeDistanceBetween(location, center);
          if (distance <= distanceRan) {
            var cityPin = new google.maps.Marker({
              map:map,
              draggable:false,
              animation: google.maps.Animation.DROP,
              position: location,
              title: city.name
            });
            pins.push(cityPin);
            google.maps.event.addListener(
              cityPin,
              'click',
              function(cityPin) {
                return function () { toggleName(cityPin) }
              }(cityPin)
            );
          }
      });
    } else {
      if (this.tryCount <= this.retryLimit) {
        this.tryCount++;
        $.ajax(cityRequest);
      } else {
        alert("Could not retrieve nearby locations. Try loading later");
      }
      console.log("response fail");
    }
  }).fail(function() {
    console.log(cityRequest);
  }).done(function() {
    console.log("done");
  });
}

function toggleName(marker) {
  alert(marker.title);
}

google.maps.event.addDomListener(window, 'load', setupMap);

$(function() {
  $('.btn.current-location').click(function() {
    navigator.geolocation.getCurrentPosition(function(position) {
      var coordinates = position.coords;
      $('.location').val(coordinates.latitude.toFixed(4)+','+coordinates.longitude.toFixed(4));
      var newCenter =  new google.maps.LatLng(coordinates.latitude, coordinates.longitude);
      map.setCenter(newCenter);
    });
  });

  var locationTimeout;
  $("input.location").bind('change', function(e) {
    clearTimeout(locationTimeout);
    var $input = $(event.target);
    var location = $input.val();
    locationTimeout = setTimeout(function() {
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode( { 'address': location}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var result = results[0];
        map.setCenter(result.geometry.location);
      } else {
        alert("Failed to find that address");
      }
    });
    }, 300);

  });
  $("form").bind('submit', function(e) {
    var distance = $('form .distance').val();
    var distanceType = $('.distance-type').val();
    if (distanceType == 'miles') {
      distance = distance * 1.60934;
    }

    $.each(circles, function(i, circle) {
      circle.setMap(null);
    });
    $.each(pins, function(i, pin) {
      pin.setMap(null);
    });

    circles = [];
    drawCircles(distance, map);
    return false;
  });
});


