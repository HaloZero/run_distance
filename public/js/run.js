var circles = [];
var map;

function setupMap() {
  var mapOptions = {
    center: new google.maps.LatLng(-34.397, 150.644),
    zoom: 5,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };

  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

  $("form").bind('submit', function(e) {
    var distance = $('form .distance').val();
    $.each(circles, function(i, circle) {
      circle.setMap(null);
    });
    circles = [];
    distanceRan(distance, map);
    return false;
  });
}


function distanceRan(distance, map) {
  var center = map.getCenter();
  var distanceRan = distance * 1000;
 //converts to meters
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

  var URL = "/locations?"
  +"n="+north
  +"&s="+south
  +"&e="+east
  +"&w="+west;

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
      $('.location-coordinates').val(coordinates);
      $('.location').val(coordinates.latitude+','+coordinates.longitude);
      var newCenter =  new google.maps.LatLng(coordinates.latitude, coordinates.longitude);
      map.setCenter(newCenter);
    });
  });
});


