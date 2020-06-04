var circles = [];
var pins = [];
var map;

var GACategoryName = 'run-event';
var DEBUG = false;

function trackEvent(action, properties) {
  if (ga && !DEBUG) {
    ga('send', 'event', GACategoryName, action, properties);
  }
}
// setup the map and just put it's default location someplace.
function setupMap() {
  var mapOptions = {
    center: new google.maps.LatLng(-34.397, 150.644),
    zoom: 5,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };

  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
}


function drawCircles(distance, center, map) {
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

  if (DEBUG) {
    console.log("setting off cityRequest");
  }

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
      if (DEBUG) {
        console.log("found ", cities.length, " cities");
      }

      $.each(cities, function(_, city) {
          var location = new google.maps.LatLng(city.lat, city.lng);
          var distance = google.maps.geometry.spherical.computeDistanceBetween(location, center);

          if (distance <= distanceRan) {
            var cityPin = new MarkerWithLabel({
              map:map,
              draggable:false,
              animation: google.maps.Animation.DROP,
              position: location,
              title: city.name,
              labelContent: city.name,
              labelClass: 'city-name',
              labelAnchor: new google.maps.Point(20, 63)
            });
            pins.push(cityPin);
            google.maps.event.addListener(
              cityPin,
              'click',
              function(cityPin) {
                return function () { toggleName(cityPin); };
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
    }
  }).fail(function() {
    if (DEBUG) {
      console.log(cityRequest);
    }
  });
}

function toggleName(marker) {
  alert(marker.title);
}

google.maps.event.addDomListener(window, 'load', setupMap);

$(function() {
  $('.btn.current-location').click(function() {
    trackEvent('get-current-location');
    navigator.geolocation.getCurrentPosition(function(position) {
      var coordinates = position.coords;
      $('.location').val(coordinates.latitude.toFixed(4)+','+coordinates.longitude.toFixed(4));
      var newCenter =  new google.maps.LatLng(coordinates.latitude, coordinates.longitude);
      map.setCenter(newCenter);
      map.setZoom(12);
      $('.location-coordinates').val(newCenter);
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
        map.setZoom(12);
        $('.location-coordinates').val(result.geometry.location);
      } else {
        alert("Failed to find that address");
      }
    });
    }, 100);
  });

  $("form").bind('submit', function(e) {
    var distance = $('form .distance').val();
    if (!!!distance) {
      alert("Please fill in a distance");
      return false;
    }

    $("#input-box").hide();
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
    var center = $(".location-coordinates").val().replace('(', '').replace(')', '');

    trackEvent('calculate-distance',
      {
        'distance': distance,
        'center': center
      });
    center = new google.maps.LatLng(center.split(',')[0], center.split(',')[1]);
    drawCircles(distance, center, map);
    return false;
  });
});

// EXTRA COMMENTS AT THE END. 
// Yahhhh


