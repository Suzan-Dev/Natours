/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1Ijoic3V6YW4tZGV2IiwiYSI6ImNrazR0cjByNzA2Mmoydm50am1xcXBtcXYifQ.pT9uUKYHMGgoJxrS9FBOIQ';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/suzan-dev/ckk4uffv25r0u17lnnsdd5lrm',
    scrollZoom: false,
    // interactive: false,
    // center: [85.302637, 27.676191],
    // zoom: 11,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((location) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(location.coordinates)
      .addTo(map);

    // Add Popup
    new mapboxgl.Popup({
      offset: 40,
    })
      .setLngLat(location.coordinates)
      .setHTML(`<p>Day ${location.day} : ${location.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current locations
    bounds.extend(location.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 250,
      bottom: 150,
      left: 25,
      right: 25,
    },
  });
};
