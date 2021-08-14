import {React, useEffect,useRef, useState} from "react";
import GoogleMapReact from "google-map-react";
import  * as turf from '@turf/turf';
import axios from 'axios';


const GoogleMapGrid = () => {
  console.log(process.env.REACT_APP_GOOGLE_API_KEY);
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  const [flag, setFlag] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [selectGrid, setSelectGrid] = useState([]);
  const [select, setSelect] = useState();

  const mapHandler = useRef(null);
  const mapGoogle = useRef(null);

  const connAPi = async (lng, lat) =>{
    console.log(lng, lat);
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&key=' + API_KEY);
    console.log(response.data);

    return response; 
  }

  /**
   * 그리드 그리는 모듈 turf.squareGrid 사용 
   */
  const drawGrid = (map) =>{
    var startCoord = [
      { lat: 37.574207, lng: 127 },
      { lat: 37.571717, lng: 126.970470 }, //minxy
      { lat: 37.586977, lng: 126.987530 }, //maxXY
      { lat: 37.574207, lng: 127 }
      ];

    var data = startCoord.map(coord => {
    return [coord.lng, coord.lat];
    });                
    const bbox = turf.bbox(turf.polygon([data]));

    let squareGrid = turf.squareGrid(bbox, 0.1, {bounds:'kilometers'});
    for (let i = 0; i < squareGrid.features.length; i++) {
      squareGrid.features[i].properties.opacity = 0.3;
      squareGrid.features[i].properties.id = i;
      squareGrid.features[i].properties.color = 'blue';
    }
    var stateLayer = map.current.data;

    //그리드 구글 맵 위에 추가 
    stateLayer.addGeoJson(squareGrid);

    //그리드 색상 스타일
    stateLayer.setStyle(function(feature) {
      let color = "#00FF00";

      if (feature.getProperty("isSelect")) {
        color = feature.getProperty("color");
      }

      return {
        fillColor: color,
        fillOpacity: 0.4,
        strokeColor: color,
        strokeWeight: 1,
        strokeOpacity: 1
        
      };
    });
  }


  /**
   * 그리드 선택 해제 
   */
  const dropGrid = () =>{
    setSelectGrid([]);
    mapHandler.current.data.forEach(function(feature) {
      feature.setProperty("isSelect", false);
   });
  }

  /**
   * 지도 시작 
   */
  useEffect(() => {
    if (!mapHandler.current) return;

    /**
     * Zoom change시 작동
    */
    mapHandler.current.addListener('zoom_changed', ()=>{
      console.log('zoom', mapHandler.current.getZoom());
      setZoomLevel(mapHandler.current.getZoom())

      if(mapHandler.current.getZoom() > 15){
        console.log('15 level in');
        
        /**
         * 일반클릭 이벤트 (그리드를 선택 안하면 이게 작동함) 
         */
        mapHandler.current.addListener('click', (event)=>{
         
        });
        /**
         * grid가 없는 경우 그림
         * 만약 Grid가 이미 있다면 안그림. 
         */
        mapHandler.current.data.toGeoJson(function(data){
          if(data.features.length == 0){
            drawGrid(mapHandler)
            
          }
        })
       
        

      }else{
        /**
         * 그리드 삭제 
         */
        console.log('move out');
        mapHandler.current.data.forEach(function(feature) {
          mapHandler.current.data.remove(feature);
        });
        setSelectGrid([]);


      }
    });
    
    return () => {
    }
  }, [flag]);

  /**
   * clickEvent 심기 
   * return 에서 zoomlevel이 변경되었을때 click이벤트를 제거해준다.
   */
  useEffect(() => {
    if (!mapHandler.current) return;

    console.log('GO!', zoomLevel);

    const clickEvent  = mapHandler.current.data.addListener('click', (event)=>{
      const position = {lat: event.latLng.lat(), lng: event.latLng.lng()}
      const selectId = event.feature.getProperty("id");
      const connResult = connAPi(position.lng, position.lat);
      console.log('connResult', connResult);

      console.log('position', position);
      console.log('selectId', selectId);
      
      //클릭인지 아닌지
      if(event.feature.getProperty("isSelect")){
        //클릭한 상태를 해제하는 경우 
        event.feature.setProperty("isSelect", false);
        setSelect(selectId);
      }else{
        //클릭안한 상태를 선택하는 경우 
        event.feature.setProperty("isSelect", true);
        setSelectGrid(item => ([...item, selectId]))
      }
  
    });
    return () =>{
      mapGoogle.current.maps.event.removeListener(clickEvent);
      console.log('zoomLevel return ', zoomLevel);
      
    } 
}, [zoomLevel]);



  const mapOptions = {
    styles: {
      fillOpacity: 0.1,
      fillColor: "#FF0000",
      strokeColor: '#00FF00',
      strokeWeight: 0.1,
      strokeOpacity: 0.1
    }
};

  return (
    <>
      <button onClick={()=>dropGrid()}>선택해제</button>
      <div>{selectGrid.map(item =>{
        return <b>{item},</b>
      })}</div>
     <div style={{ height: '100vh', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: API_KEY }}
        defaultCenter={{
          lat: 37.574207,
          lng: 127
        }}
        defaultZoom={zoomLevel}
        onGoogleApiLoaded={(googleApi) => {
          mapHandler.current = googleApi.map;
          mapGoogle.current = googleApi;
          setFlag(true);
        }}
        options={mapOptions}
        yesIWantToUseGoogleMapApiInternals
      />
    </div>
    </>
   
  )
};

export default GoogleMapGrid;