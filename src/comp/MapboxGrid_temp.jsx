import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl'; 
import * as turf from '@turf/turf'

require("dotenv").config();

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_API_KEY;

/**
 * 37.571179, 126.967615
 * 37.584443, 126.983064
 * 37.456489, 126.595630
 * river: 37.568155, 126.865939
 * crop: 35.207540, 127.126806
 * airport : 37.556357, 126.799464
 * 37.571586, 126.812776
*/
function MapboxGrid() {


  console.log(process.env.REACT_APP_MAPBOX_API_KEY);
  
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(126.812776); // eslint-disable-line no-unused-vars
  const [lat, setLat] = useState(37.571586); // eslint-disable-line no-unused-vars
  const [zoom, setZoom] = useState(17); // eslint-disable-line no-unused-vars
  const [flag, setFlag] = useState(false); 
  const [start, setStart] = useState(false); 
  const [selectPoint, setSelectPoint] = useState([]);
  const [count, setCount] = useState(0);

  const initMap = () =>{
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [lng, lat],
      zoom: zoom,
      scrollZoom: true
    });

    const bounds = map.current.getBounds();

    console.log(`bounds:`, bounds);

    const NE = bounds.getNorthEast();
    const SW = bounds.getSouthWest();
    
    var cellSide = 0.01;
    var squareGrid = turf.squareGrid([lng, lat, lng + 0.005, lat + 0.005], cellSide, 'kilometers');

    // Set all features to highlighted == 'No'
    for (let i = 0; i < squareGrid.features.length; i++) {
      squareGrid.features[i].properties.density = 0.1;
      squareGrid.features[i].properties.id = i;

      const itemPoint = turf.points(
        squareGrid.features[i].geometry.coordinates[0]
      );
      
      //console.log(turf.center(itemPoint));

      const centerTurf = turf.center(itemPoint);
      const lngCenter = centerTurf.geometry.coordinates[0];
      const latCenter = centerTurf.geometry.coordinates[1];
      squareGrid.features[i].properties.centerLngLat = {lng: lngCenter, lat: latCenter};
      
    }

      map.current.on('load', () => {
        
        //줌이 끝났을때 동작 
      map.current.on('zoomend', function() {
          
        setZoom(map.current.getZoom());
        console.log('zoomLevel', map.current.getZoom());
        console.log(map.current.getLayer('mainMap'));

        // 줌 레벨 17 이하에서만 동작 
        if(map.current.getZoom() >= 17){
          console.log('zoom Level 17 in');

          if(typeof map.current.getLayer('mainMap') == 'undefined'){
            map.current.addSource('grid-source', {
              'type': "geojson",
              'data': squareGrid,
              'generateId': true
            });
            
            map.current.addLayer({
            'id': 'mainMap',
            'type': 'fill',
            'source': 'grid-source',
            'layout': {},
            'paint': {
                'fill-color': '#088',
                'fill-opacity': [
                "interpolate", ["linear"], ["get", "density"],
                0, 0.3,
                1, 1
                ]
            }
            });

            //선택 그리드 
            map.current.addLayer(
                {
                'id': 'mainMap-highlighted',
                'type': 'fill',
                'source': 'grid-source',
                'paint': {
                    'fill-outline-color': '#484896',
                    'fill-color': '#6e599f',
                    'fill-opacity': 0.50
                },
                'filter': ['==', ['get', 'id'], -1]
                },
                'settlement-label'
            ); 

            /**
             * 이미지 넣기
             * 
            map.current.loadImage(
                'https://docs.mapbox.com/mapbox-gl-js/assets/cat.png',
                function (error, image) {
                if (error) throw error;
                
                map.addImage('cat', image);
                
                map.addSource('point', {
                'type': 'geojson',
                'data': {
                'type': 'FeatureCollection',
                'features': [
                {
                'type': 'Feature',
                'geometry': {
                'type': 'Point',
                'coordinates': [ 126.976838, 37.575744]
                }
                },{
                'type': 'Feature',
                'geometry': {
                'type': 'Point',
                'coordinates': [ 126.979520, 37.575744]
                }
                }
                ]
                }
                });
                
                map.addLayer({
                'id': 'points',
                'type': 'symbol',
                'source': 'point', 
                'layout': {
                'icon-image': 'cat',
                'icon-size': 0.25
                }
                });
                }
            );

            */
            
            
            // 마우스 이벤트 켜기
            map.current.on("click", setSelectPointInsertData);
            
            //지도 안으로 행군하라!
            map.current.on('mousemove', function(e) {
                var features = map.current.queryRenderedFeatures(e.point, { layers: ['mainMap'] });
                if(features[0] != undefined){
                    const selectIndex = features[0].id;
    //              console.log('A mousemove event has occurred.' + selectIndex);
                }
                
            });
            //지도 밖으로 행군하라!
            map.current.on('mouseover', function() {
                console.log('A mouseover event has occurred.');
            });
          }
          
          

            
        }else{
            // 이벤트 끄기
            console.log('zoom Level 17 out');

            map.current.off('click', onClickGridEvent);
            if(typeof map.current.getLayer('mainMap') !== 'undefined') {
                map.current.removeLayer('mainMap');
            }
            if(typeof map.current.getLayer('points') !== 'undefined'){
                map.current.removeLayer('points');
            }
            if(typeof map.current.getLayer('mainMap-highlighted') !== 'undefined'){
                map.current.removeLayer('mainMap-highlighted');
            }
            if(typeof map.current.getSource('grid-source') !== 'undefined') {
              map.current.removeSource('grid-source');
            }

        }
    });

    //지도 움직임 이벤트 
    map.current.on('moveend', function(eventData) {
                let sendAction = true;
                if (eventData && eventData.originalEvent && eventData.originalEvent.type === 'resize') {
                    sendAction = false;
                }

                if (sendAction) {
                    // do the thing
                    var moveXY = map.current.getBounds().toArray();
                    const minLongitude = moveXY[0][0];
                    const minLatitude = moveXY[0][1];
                    const maxLongitude = moveXY[1][0];
                    const maxLatitude = moveXY[1][1];
                    console.log('min', minLongitude, minLatitude);
                    console.log('max', maxLongitude, maxLatitude);
                }   
                
            });
    });

    const onClickGridEvent =  () => {
      console.log('onClickGridEvent', selectPoint);
      //클릭시 색상 변경하기
      const filter = ['match', ['number', ['get', 'id']], selectPoint , true, false];
      map.current.setFilter('mainMap-highlighted', filter);
  
      //const filter = ['==', ['number', ['get', 'id']], selectIndex];
      // const filter = ['==', ['number', ['get', 'id']], -1];
      // map.current.setFilter('mainMap-highlighted', filter);
  
    }

    const setSelectPointInsertData = (e) =>{



      var features = map.current.queryRenderedFeatures(e.point, { layers: ['mainMap'] });
      console.log('features', features[0].properties);
      
      const convertJson = JSON.parse(features[0].properties.centerLngLat);
      const point = map.current.project([convertJson.lng, convertJson.lat]);
      console.log('point', point);

      var featuresBuilding = map.current.queryRenderedFeatures(point, { layers: ['building'] });
      var x = map.current.getLayer('building');
      const featuresWater = map.current.queryRenderedFeatures(point, { layers: ['water'] });
      var featuresPoi_label = map.current.queryRenderedFeatures(point, { layers: ['poi-label'] });
      var featureslanduse = map.current.queryRenderedFeatures(point, { layers: ['landuse'] });
      var featuresAdmin = map.current.queryRenderedFeatures(point, { layers: ['admin'] });
      var featureswaterway = map.current.queryRenderedFeatures(point, { layers: ['waterway'] });
      var featuresplacelabel = map.current.queryRenderedFeatures(point, { layers: ['settlement-label'] });

      

      
      /**
       * isEmpty or featuresBuilding[0].properties
       * 
       */
      console.log('featuresBuilding', featuresBuilding);
      console.log('featuresPoi_label', featuresPoi_label);
      console.log('featuresLand', featureslanduse);
      console.log('featuresAdmin', featuresAdmin);
      console.log('featureswaterway', featureswaterway);
      console.log('featuresplacelabel', featuresplacelabel);

      console.log('featuresWater', featuresWater);
      console.log('x', x);
      console.log('map.getStyle().layers', map.current.getStyle().layers);

      var feature = features[0];
      
      // 외부지도 클릭시 반응하지 않기
      if(features[0] == undefined) return;

      // grid 클릭
      const selectIndex = feature.id;
      setSelectPoint(prevValues => [...prevValues, selectIndex]);
      console.log('insertData last', selectIndex, selectPoint);
      setStart(true);
      setFlag(true)
    }
    
  }



  useEffect(() => {
    initMap();
    // Clean up on unmount
    //return () => map.current.remove();
  }, []);

  useEffect(() => {
   
  }, []);


  useEffect(() => {
    console.log('selectPoint', selectPoint);
    if(start){
      if(flag){
        const filter = ['match', ['number', ['get', 'id']], selectPoint , true, false];
        map.current.setFilter('mainMap-highlighted', filter);    
      }else{
        const filter = ['==', ['number', ['get', 'id']], -1];
        map.current.setFilter('mainMap-highlighted', filter); 
      }
       
    }
  }, [selectPoint, start, flag]);



  return (
    <div>
      <div>
      <button onClick={() => setFlag(false)}>
        선택중지
      </button>
      <button onClick={() => {
        setFlag(false);

        setSelectPoint([]);
      }}>
        선택해제
      </button>
    </div>
      <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom} | click : {flag+""}
      </div>
      <div ref={mapContainer} className="map-container" style={{height: '100vh'}} />
    </div>
  );
}

export default MapboxGrid;