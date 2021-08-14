import {React, useEffect,useRef, useState} from "react";
import GoogleMapReact from "google-map-react";
import  * as turf from '@turf/turf';
import axios from 'axios';
import { setSelectMultiGrid, setSelectPosition} from "../store/MapStore";
import {useDispatch, useSelector} from "react-redux";
import MapboxForGoogleMap from "./MapboxForGoogleMap";
import { allPrice } from "../util/MapUtility";

/**
 * 구글 맵
 */
const GoogleMapPlusCodeGrid = () => {
  
  /**
   * [API_KEY]
   * .env 파일에 정의해서 사용 
   */
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  
  /**
   * [Redux Module]
   */
   const dispatch = useDispatch();
   const selectPositionResult = useSelector(state => state.MapReducer.selectPositionResult); // mapbox return 값
   const selectMultiGrid = useSelector(state => state.MapReducer.selectMultiGrid);            // 멀티셀렉트 (사용안함)
 
   /**
   * [Ref Module]
   * mapGoogle 만 사용한다.
   * {map, maps}
   * map = mapGoogle.current.map
   * maps = mapGoogle.current.maps
   * 으로 꺼내서 사용
   */
   const mapGoogle = useRef(null);

  /**
   * [setState Module]
   */
  const [startLngLat, setStartLngLat] = useState({lat: 37.553067, lng: 126.608257}); //지도 시작시 사용, 이후 사용안함 
  const [zoomLevel, setZoomLevel] = useState(18); // 지도 줌 레벨, 16으로 초기화 
  const [flag, setFlag] = useState(false); // 맵 시작시 true

  const [selectGrid, setSelectGrid] = useState([]); //선택한 타일들
  const [select, setSelect] = useState({lat: 37.553067, lng: 126.608257});
  const [unSelect, setUnSelect] = useState(null); // 선택해제한 타일

  const [feature, setFeature] = useState([]);
  const [featureCollection, setFeatureCollection] = useState([]);

  const [markerList, setMarkerList] = useState([]);
  const [center, setCenter] = useState({lat: 37.553067, lng: 126.608257});
  const [addressStr, setAddressStr] = useState("명일동"); // 주소지 검색 

  /**
   * 위경도 to Address
   * 위경도의 poi를 얻기 위해서 사용 
   * @return plusCode
   */
  const latLngToAddress = async (lng, lat) =>{
    console.log(lng, lat);
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng + '&key=' + API_KEY);
    console.log(response.data);
    return response.data; 
  }

  /**
   * 주소 to 위경도
   * 주소 검색시 사용
   */
  const addressToLatLng = async () =>{
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + addressStr + '&key=' + API_KEY);
    console.log('addressToLatLng results', response.data.results, addressStr);
    
    if(response.data.results.length == 0){
      alert("검색결과 주소가 없습니다.\n올바른 주소를 검색해 주세요.")
    }else{
      moveLocation(response.data.results[0].geometry.location)
    }
    return response.data; 

  }

  /**
   * 위경도 to Address
   * @return plusCode
   * 사용안함
   */
  const connPlusCodeJson = async (zoom, x, y) =>{
    var linkAddress = ['https://grid.plus.codes/grid/wms/', zoom, '/', x, '/', y, '.json'].join('')
    const response = await axios.get(linkAddress);
    var tempArr = [];
    response.data.features.map(item =>{
      tempArr.push(item);
    });
    setFeature(item =>[...item, ...tempArr]);
    setFeatureCollection(item =>[...item, ...tempArr])

    return response.data; 
  }

  /**
   * 위경도 to Address
   * @return plusCode
   */
   const connPlusCodeJsonGrid = async (zoom, x, y) =>{
    var linkAddress = ['https://grid.plus.codes/grid/wms/', zoom, '/', x, '/', y, '.json'].join('')
    const response = await axios.get(linkAddress);
    mapGoogle.current.map.data.setStyle(function(feature) {
      let color = "#00FF00";
 
      if (feature.getProperty("isSelect")) {
        color = {fillColor:"red", strokeColor: "red", fillOpacity : 0.5}
      } else{
        color = {fillColor:"black", strokeColor: "black" , fillOpacity: 0}

      }
      return {
        fillColor: color.fillColor,
        fillOpacity: color.fillOpacity,
        strokeColor: color.strokeColor,
        strokeWeight: 1,
        strokeOpacity: 1
      };
    });
    
   
    /**
     * 마지막 점이 0번과 일치하지 않으면 addGeoJson에서 에러가 남
     * 4번 index를 새로 만들어서 0번과 일치시키는 과정 
     * */
    response.data.features.map(item =>{
      item.geometry.coordinates[0][4] = item.geometry.coordinates[0][0];
      const itemPoint = turf.points(item.geometry.coordinates[0]);
      const centerTurf = turf.center(itemPoint);
      item.properties.centerLngLat = {lng: centerTurf.geometry.coordinates[0], lat: centerTurf.geometry.coordinates[1]};
    });
    
    mapGoogle.current.map.data.addGeoJson(response.data);

    return response.data; 
  }
 
  /**
   * 맵 메인 
   */

  const drawShapes = async () => {

    if (!mapGoogle.current.map) return;
 
    mapGoogle.current.map.addListener('zoom_changed', ()=>{
      console.log('zoomLevel', zoomLevel);

      // 19 레벨 이하에서 시작
      if(mapGoogle.current.map.getZoom() >= 19){

        /**
         * 그리드 그리기 
         */
          mapGoogle.current.map.data.toGeoJson(function(data){
          console.log('mapHandler.current.data.toGeoJson');
          console.log('data ', data.features.length);
            if(data.features.length != 0) return;

            var roadmapOverlay =  new mapGoogle.current.maps.ImageMapType({
              getTileUrl: function(coord, zoom) {
                console.log('==>', zoom, '/', coord.x, '/', coord.y)
                connPlusCodeJsonGrid(zoom, coord.x, coord.y);
                return ['https://grid.plus.codes/grid/wms/', zoom, '/', coord.x, '/', coord.y, '.png'].join('');
              },
              tileSize: new mapGoogle.current.maps.Size(256, 256),
              opacity: 0.2
            });

            mapGoogle.current.map.addListener('maptypeid_changed', () => {
              // new mapGoogle.current.maps.overlayMapTypes.pop();
              // new mapGoogle.current.maps.overlayMapTypes.push(roadmapOverlay);
              });
              
            mapGoogle.current.map.overlayMapTypes.setAt(0, roadmapOverlay);
                
        });
        
        
        flagOn(mapGoogle.current.map)

      }else{
        /***
        * 19레벨 아니면 작동안함 
        */
        mapGoogle.current.map.data.forEach(function(feature) {
          mapGoogle.current.map.data.remove(feature);
        });
        mapGoogle.current.map.overlayMapTypes.setAt(0, null);
        
        //선택한 그리드 없에기
        dropGrid();
        //깃발 삭제하기
        console.log('markerList', markerList);

      }

      //줌 레벨 보내기 
      setZoomLevel(mapGoogle.current.map.getZoom());

    });

    mapGoogle.current.map.addListener('dragend', ()=>{
      setCenter({lat: mapGoogle.current.map.getCenter().lat(), lng: mapGoogle.current.map.getCenter().lng()})
    });
    
    


  
};

  /**
   * 선택 초기화
   * 줌 아웃시, 선택초기화시 작동 
   */
  const dropGrid = () =>{
    setSelectGrid([]);
    mapGoogle.current.map.data.forEach(function(feature) {
      feature.setProperty("isSelect", false);
    });
  }


  //===========================================================================================
  //=======================================[use Effect]========================================
  //===========================================================================================

 /**
   * @param gridData
   * @return price
   */
  const gridPrice = (item) =>{
    if(item.water) return 1000;
    if(item.land) return 2000;
  } 
  useEffect(() => {
    if(!mapGoogle.current) return;
    drawShapes();
  }, [flag]);

  useEffect(() => {
    if (!mapGoogle.current || zoomLevel != 19) return;
    console.log('GO!', zoomLevel);

    var clickEvent = mapGoogle.current.map.data.addListener('click', async (event)=>{
      console.log('do it');
      const global_code = event.feature.getProperty("global_code");
      console.log('Click global_code', global_code);
      console.log('Click selectMultiGrid', selectMultiGrid);

      //클릭인지 아닌지
      if(event.feature.getProperty("isSelect")){
        //클릭한 상태를 해제하는 경우 
        event.feature.setProperty("isSelect", false);
        setUnSelect(global_code);
        const deleteItem = selectGrid.filter((item)=> item.id !== global_code);

        await dispatch(setSelectMultiGrid(deleteItem));
      }else{
        //클릭안한 상태를 선택하는 경우 
        event.feature.setProperty("isSelect", true);
        const centerLngLat = event.feature.getProperty("centerLngLat");
       
        let position = {lat: centerLngLat.lat, lng: centerLngLat.lng};

        //mapbox 얻기 
        await dispatch(setSelectPosition(position));
        position.id = global_code;
        setSelect(position);

      }
  
    });
    return () =>{
      console.log('zoomLevel return ', zoomLevel);
      markerList.map( item=> item.setMap(null));
      mapGoogle.current.maps.event.removeListener(clickEvent);
      
    } 
  }, [zoomLevel]);

  /**
   * 선택해제
   */
  useEffect(() => {
    const deleteItem = selectGrid.filter((item)=> item.id !== unSelect);
    setSelectGrid(deleteItem);
  }, [unSelect]);

  /**
   * 클릭후 mapbox에서 변경 값 받기
   * 땅/물 속성 받음
   * @returns selectPositionResult
   *  */
  useEffect(async () => {
    console.log('mapbox에서 변경 값', selectPositionResult);
    if (!mapGoogle.current) return;

    //API 땅정보 얻기 
    const clickPositonApi = await latLngToAddress(select.lng, select.lat);
    let buildingSearch = "";
    clickPositonApi.results[0].types.map(item =>{
      if (item.includes("cafe")) buildingSearch = item;
    })
    console.log('click potision', clickPositonApi);
    console.log('click buildingSearch', buildingSearch);

    console.log('selectGrid length', selectGrid);
    console.log('select', select);
    //가격정보 얻기 
    const price = gridPrice(selectPositionResult);
    console.log('price', price);
    console.log('==> ', select.id)
    setSelectGrid(item => ([...item, {id : select.id , status: selectPositionResult, price: price, position: select, locationInfo: clickPositonApi, building: buildingSearch } ]));
    //await dispatch(setSelectMultiGrid([...selectMultiGrid, {id : select.id , status: selectPositionResult, price: price, position: select} ]))
  }, [select]);

 
  


  /**
   * 구매 지도 깃발 표시 
   */
  const flagOn = (map) =>{

    const image = {
      url: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
      // This marker is 20 pixels wide by 32 pixels high.
      size: new mapGoogle.current.maps.Size(20, 32),
      // The origin for this image is (0, 0).
      origin: new mapGoogle.current.maps.Point(0, 0),
      // The anchor for this image is the base of the flagpole at (0, 32).
      anchor: new mapGoogle.current.maps.Point(0, 32),
    };
  
    const shape = {
      coords: [1, 1, 1, 20, 18, 20, 18, 1],
      type: "poly",
    };  

    var temp = [];

    [{lng: 126.60843749274967, lat: 37.55406249698375}, {lng: 126.60881249274966, lat: 37.55393749698375}].map(item =>{
      var marker = new mapGoogle.current.maps.Marker({
        position: item,
        map ,
        icon: image,
        shape: shape,
        zIndex: 1,
      });
      temp.push(marker);
    })   
    setMarkerList(item =>([...item, ...temp]));
  }


  /**
   * 맵 옵션 
   */
  const mapOptions = () => {
    return({
      styles: {
        fillOpacity: 0.1,
        fillColor: "#FF0000",
        strokeColor: '#00FF00',
        strokeWeight: 0.1,
        strokeOpacity: 0.1
      },
      maxZoom: 19
    })
  }

  /**
   * 초기 로딩 시작
   */
  const onGoogleApiLoad = async (google) => {
    mapGoogle.current = google;
    setFlag(true);
  }

  /**
   * 첫 클릭 주소지 얻기
   * 1번 값이 있을 경우만 사용, 0이면 아예 표시 x
  */
  const firstAddress = () =>{
    let resultAddress = "";
    
    if(selectGrid.length > 0){
      console.log('selectGrid[0].status', selectGrid[0].locationInfo);
      resultAddress = selectGrid[0].locationInfo.results[0].formatted_address;
    }else if(selectGrid.length == 0){
      resultAddress = "";
    }

    return resultAddress;
  }

  /**
   * 지도이동 기능
   * 향후 주소 검색후 받는 위치로 이동 
   */
  const moveLocation = (lat, lng) =>{
    const center = new mapGoogle.current.maps.LatLng(lat, lng);
    mapGoogle.current.map.panTo(center);
  }

 /**
  * 맵타입 https://developers.google.com/maps/documentation/javascript/maptypes
 */
  return (
    <>
    <button onClick={() => dropGrid()}>초기화</button>
    <input type="text" onChange={(e) => setAddressStr(e.target.value)} defaultValue="명일동"/> 
    <button onClick={() => addressToLatLng()}>검색 주소 가기</button>
    <p></p>
    <span>최초 클릭한 Grid의 주소 : {firstAddress()} / {selectGrid.map( item => {return <b>{item.building},</b>})}</span>
    <br></br>
    <div>
      <input type="radio" name="chk_maptype" onClick={() => mapGoogle.current.map.setMapTypeId("roadmap")}/>지도맵
      <input type="radio" name="chk_maptype" onClick={() => mapGoogle.current.map.setMapTypeId("satellite")}/>인공위성
      <input type="radio" name="chk_maptype" onClick={() => mapGoogle.current.map.setMapTypeId("hybrid")}/>하이브리드 
      <input type="radio" name="chk_maptype" onClick={() => mapGoogle.current.map.setMapTypeId("terrain")}/>지형 정보
      <button onClick={() => moveLocation(37.123, 127.2832)}>지도이동</button>
    </div>
    <br>
    
    </br>
    <br></br>
      <span>현재 zoomLevel : {zoomLevel}</span>
      <br></br>
      <span>현재 클릭한 LngLat : {select.lng} / {select.lat}</span>
      <br></br>
      <span>현재 중간 LngLat : {center.lng} / {center.lat} </span>
      <br></br>
      <span> water: {selectPositionResult.water ? "true" : "false"} / land : {selectPositionResult.land ? "true" : "false"} / {selectPositionResult.landType} </span>
      <span>현재 클릭한 plusCode: {selectGrid.map( item => {
        return <b>{item.id},</b>
      })}</span> / 현재 클릭한 갯수 : {selectGrid.length} 
      / 전체가격 {allPrice(selectGrid)} 
      
     <div style={{ height: '100vh', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: API_KEY }}
        defaultCenter={startLngLat}
        defaultZoom={zoomLevel}
        onGoogleApiLoaded={onGoogleApiLoad}
        options={mapOptions}
        yesIWantToUseGoogleMapApiInternals
      />
      <MapboxForGoogleMap/>
    </div>
    </>
   
  )
};
 
export default GoogleMapPlusCodeGrid;

