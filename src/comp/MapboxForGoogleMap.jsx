import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl'; 
import * as turf from '@turf/turf';
import {useDispatch, useSelector} from "react-redux";
import { setSelectPositionResult } from '../store/MapStore';
import {isEmptyCheck} from "../util/CommonUtility";

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
function MapboxForGoogleMap() {

  const selectPosition = useSelector(state => state.MapReducer.selectPosition);
  const dispatch = useDispatch();

  
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
    console.log('initMap start');
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [selectPosition.lng, selectPosition.lat],
      zoom: zoom,
      scrollZoom: true
    });
      map.current.on('load', () => {
       // 마우스 이벤트 켜기
       map.current.on("click", onClickGridEvent);
    });

    const onClickGridEvent = (e) =>{
      const point = e.point;
      console.log(e);
      const featuresWater = map.current.queryRenderedFeatures(point, { layers: ['water'] });

      console.log(isEmptyCheck(featuresWater), featuresWater);
      const gridData = {
          country: "ko",
          land: isEmptyCheck(featuresWater),
          water: !isEmptyCheck(featuresWater)
      }
      console.log('mapbox GridData', gridData);

      dispatch(setSelectPositionResult(gridData));

    }
    
  }



  useEffect(() => {
    initMap();
    // Clean up on unmount
    //return () => map.current.remove();
  }, []);

  useEffect(async () => {
    await map.current.flyTo({
      center: [
      selectPosition.lng,
      selectPosition.lat,
      ],
      essential: false // this animation is considered essential with respect to prefers-reduced-motion
    });

    var coords = {lng: selectPosition.lng, lat: selectPosition.lat};
    console.log(coords);
    map.current.fire("click", {lngLat: coords, point: map.current.project(coords)});
    
  }, [selectPosition]);


  useEffect(() => {
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
        Longitude: {selectPosition.lng} | Latitude: {selectPosition.lat} | Zoom: {zoom} | click : {flag+""}
      </div>
      <div ref={mapContainer} className="map-container" style={{height: '100px', width: '100px'}} />
    </div>
  );
}

export default MapboxForGoogleMap;