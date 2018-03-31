/* Notifications mechanism for flightradar24.
 *
 * Licensed under the MIT license.
 *
 * Copyright (c) 2018 Tomasz Gorochowik
 *                    t@gorochowik.com
 *                    https://github.com/tgorochowik
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
 * OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var notifyZoneActivated = false;
var notifyZoneAltitudeLimitEnabled = false;
var notifyZoneAltitudeLimit = 8000;
var notificationsSent = {};

var notifyZone = new google.maps.Rectangle({
          strokeColor: '#000000',
          strokeOpacity: 1,
          strokeWeight: 1,
          fillColor: '#000000',
          fillOpacity: 0.3,
          map: map,
          bounds: {
            north: 0,
            south: 0,
            east:  0,
            west:  0
          },
          editable: true,
          draggable: true,
        });

function notifyZoneSet() {
  var mapNorth = map.getBounds().getNorthEast().lat();
  var mapSouth = map.getBounds().getSouthWest().lat();
  var mapEast  = map.getBounds().getNorthEast().lng();
  var mapWest  = map.getBounds().getSouthWest().lng();

  var mapLatMargin = Math.abs(mapNorth - mapSouth)/3.0;
  var mapLngMargin = Math.abs(mapEast  - mapWest )/3.0;

  notifyZone.setOptions(
    {
      bounds: {
        north: mapNorth - mapLatMargin,
        south: mapSouth + mapLatMargin,
        east:  mapEast  - mapLngMargin,
        west:  mapWest  + mapLngMargin,
      },
    });

  /* Disable lock */
  notifyZone.setOptions({draggable: true, editable: true});

  if (notifyZoneActivated === false) {
    /* Add timer for the checker */
    window.setInterval(notifyZoneChecker, 1000);

    /* Add timer for the remover */
    window.setInterval(notifyZoneRemover, 10000);

    notifyZoneActivated = true;
  };
}

function notifyZoneLockToggle() {
  el = document.getElementById('tk_zone_lock');
  if (notifyZone.getEditable() === true) {
    notifyZone.setOptions({draggable: false, editable: false});
    el.classList.add("selected");
  } else {
    notifyZone.setOptions({draggable: true, editable: true});
    el.classList.remove("selected");
  }
}

function notifyZoneAltitudeLimitToggle() {
  el = document.getElementById('tk_alt_limit');
  if (notifyZoneAltitudeLimitEnabled === true) {
    notifyZoneAltitudeLimitEnabled = false;
    el.classList.remove("selected");
  } else {
    notifyZoneAltitudeLimitEnabled = true;
    el.classList.add("selected");
  }
}

/* Menu construction */
function addFrMenuEntry(html) {
  var frMenu = document.getElementById('fr24_ViewsDropdown');
  frMenu.innerHTML = frMenu.innerHTML + html;
}

function addFrMenuHeader(text) {
  addFrMenuEntry('<li class="heading"><h4>' + text + '</h4></li>');
}

function addFrMenuMethod(text, callback, id) {
  addFrMenuEntry('<li class="grid-mapviews-5"> <a id="' + id + '" onclick="' + callback + '">' + text + '</a></li>');
}

/* Add header */
addFrMenuHeader("Notify Zone");
addFrMenuMethod("Set here", "notifyZoneSet()", "tk_sethere");
addFrMenuMethod("Lock", "notifyZoneLockToggle()", "tk_zone_lock");
addFrMenuMethod("Altitude Limit", "notifyZoneAltitudeLimitToggle()", "tk_alt_limit");

/* Make it visible what is selected and what is not */
menuDiv = document.getElementById('fr24_ViewsDropdownContainer');

function updateToggleEntries() {
  el = document.getElementById('tk_alt_limit');
  if (notifyZoneAltitudeLimitEnabled === true) {
    el.classList.add("selected");
  } else {
    el.classList.remove("selected");
  }

  el = document.getElementById('tk_zone_lock');
  if (notifyZone.getEditable() === true) {
    el.classList.remove("selected");
  } else {
    el.classList.add("selected");
  }
};
menuDiv.onclick = updateToggleEntries;

/* Actual notifications code */
if (Notification.permission !== "granted")
  Notification.requestPermission();

function notifyZoneChecker() {
  Object.keys(planes_array).forEach(function(key) {
    if (notifyZoneActivated !== true)
      return false;

    var plane = planes_array[key];

    if (notificationsSent[key] === true)
      return;

    if (notifyZone.getBounds().contains(plane.position) !== true) {
      return;
    }

    if (notifyZoneAltitudeLimitEnabled === true) {
      if (plane.alt > notifyZoneAltitudeLimit)
        return;
    }

    new Notification('Attention', {
      body: planes_array[key].callsign + " enters your zone!",
    });

    notificationsSent[key] = true;
  });
};

function notifyZoneRemover() {
  Object.keys(notificationsSent).forEach(function(key) {
    var plane = planes_array[key];

    if (!plane) {
      delete notificationsSent[key];
      return;
    }

    if (notifyZone.getBounds().contains(plane.position) !== true) {
      delete notificationsSent[key];
      return;
    }
  });
};
