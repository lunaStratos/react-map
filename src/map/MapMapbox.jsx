import {React, useEffect, useLayoutEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import ioFlag from '../assets/flag/io.png';
import koFlag from '../assets/flag/kr.png';
import usFlag from '../assets/flag/us.png';
import adFlag from '../assets/flag/ad.png';
import {calMinMax,
  setGeometryJson,
  setGeometryJsonMultiPoint
} from "./MapUtility";
import mapboxgl from "mapbox-gl";                               
import tilebelt from "@mapbox/tilebelt";
import MapInfoPopupMapbox from "./MapInfoPopup";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_API_KEY;    // key

/**
 * 지도 맵
 * mapbox 맵 기반으로 제작
 */
export default function MapMapbox() {

  /**
   * [Redux Module]
   */
   const dispatch = useDispatch();

  const mapContainer = useRef(null);
  const map = useRef(null);

  /**
   * [셀 선택, 해제 여부]
   * @tileClick : 아직 팔리지 않은 타일 클릭
   * @groupClick : 그룹으로 묶인 것 클릭
   * */
  const selectTile = useRef({
    tileClick : false,
    groupClick: false
  });

  /**
   * [선택한 셀 정보]
   * @return selected : 화면상의 선택한 셀들
   * @return onSelect : 선택중인 셀들
   * @return onDelete : 삭제중인 셀들
   * @return mode : 모드 선택, delete select none
   * */
  const onSelect = useRef({
    mode: "select",
    selected :{     // 화면상에 선택
      quadKeys: [],
      coordinates : []
    },
    onSelect : {    // 선택중인 셀
      start: {} ,
      end: {} ,
      quadKeys: [],
      coordinates : []
    },
    onDelete: {     // 삭제중인 셀
      start: {} ,
      end: {} ,
      quadKeys: [],
      coordinates : []
    },
    onGroupSelect: { // 그룹 셀렉트
      id : -1,
      quadKeys: [],
      coordinates : []
    }
  });

  /**
   * 화면상의 id와 타일
   * @return quadKeys : 화면상의 선택한 타일 아이디들
   * @return coordinates : 화면상의 선택한 타일 좌표들
   * @return onBuyed : 화면상의 구입된 타일들
   * @return countryList : 화면상의 구입된 타일들의 국기 리스트
   * */
  const onScreen = useRef({
    quadKeys: [],
    coordinates : [],
    onBuyed:  [],
    countryList : []
  });
  const tileStart = useRef(false);


  const [lngLat, setLngLat] = useState([127.146493, 37.529473]);
  const [zoomLevel, setZoomLevel] = useState(process.env.REACT_APP_START_ZOOMLEVEL);
  const [change , setChange] = useState(new Date().getMilliseconds());                      // 변화 있을때 사용
  const [selectMode , setSelectMode] = useState({
    mode: "select" // select or delete
  });
  const [selectedCellList , setSelectedCellList] = useState({
    boxSelect : {
      isBoxSelect: false, quadKeys: [], coordinates: []
    },
    groupSelect :{
      isGroupSelect: false, groupId : -1, quadKeys : [], coordinates: []
    }
  });

  const selectMapType = useSelector(state => state.MapReducer.selectMapType);     // 맵 타입

  /**
   * 화면 리사이즈시 사이즈 변경
   * */
  const [width, height] = useWindowSize();
  function useWindowSize() {
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
      function updateSize() {
        setSize([window.innerWidth, window.innerHeight]);
      }
      window.addEventListener('resize', updateSize);
      updateSize();
      return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
  }

  //===========================================================================================================
  //=============================================[API AREA]====================================================
  //===========================================================================================================

  /**
   * 지도 부르는 API
   * 국가명은 국기파일명과 같게 한다
   * */
  const callBuyedMap = async (quadKeys) =>{
    const buyedQuadKeys = [
      {quadKey: "132110320130303202312", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303203200", country : "kr", owner : "a", id: 228322},
      {quadKey: "132110320130303202311", country : "kr", owner : "b", id: 493923},
      {quadKey: "132110320130303202313", country : "ad", owner : "c", id: 583922},
      {quadKey: "132110320130303202310", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303202130", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303202112", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303202110", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200332", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200330", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200312", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200310", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200132", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200130", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200112", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200110", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303022332", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303022330", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303202132", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303020312", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303020332", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022112", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022132", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303020313", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303020333", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022113", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022133", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022313", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303021220", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023000", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023020", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023200", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022312", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303020330", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022110", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022130", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022310", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303020331", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022111", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022131", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022311", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303021202", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303021222", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023002", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023022", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023202", country : "us", owner : "g", id: 493999},
    ];
    return buyedQuadKeys;
  }

  /**
   * 임시 클릭시 데이터
   * */
  const callBuyedMapClick = async (id) =>{
    const buyedQuadKeys = [
      {quadKey: "132110320130303202312", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303203200", country : "kr", owner : "a", id: 228322},
      {quadKey: "132110320130303202311", country : "kr", owner : "b", id: 493923},
      {quadKey: "132110320130303202313", country : "ad", owner : "c", id: 583922},
      {quadKey: "132110320130303202310", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303202130", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303202112", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303202110", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200332", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200330", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200312", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200310", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200132", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200130", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200112", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303200110", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303022332", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303022330", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303202132", country : "kr", owner : "a", id: 282313},
      {quadKey: "132110320130303020312", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303020332", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022112", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022132", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303020313", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303020333", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022113", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022133", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022313", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303021220", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023000", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023020", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023200", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022312", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303020330", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022110", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022130", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022310", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303020331", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022111", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022131", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303022311", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303021202", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303021222", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023002", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023022", country : "us", owner : "g", id: 493999},
      {quadKey: "132110320130303023202", country : "us", owner : "g", id: 493999},
    ];

    buyedQuadKeys.map((item, i) => {
      // 동일 index 가져오기
      const tile = tilebelt.quadkeyToTile(item.quadKey);
      const coordinates = tilebelt.tileToGeoJSON(tile).coordinates;
      const bbox = tilebelt.tileToBBOX([tile[0]+.5, tile[1]+.5, tile[2]]) // bbox[0],bbox[3]
      item.center = [bbox[0],bbox[3]];
      item.coordinates = coordinates;
    });

    return buyedQuadKeys.filter(item => item.id === id);
  }

  //===========================================================================================================
  //=============================================[API AREA]====================================================
  //===========================================================================================================

  /**
   * 맵 로드
   * 계산식을 이용해서 Tile을 만든다.
   * issue: 스타일 변경시 재생성 타일 안나옴
   * */
  const setTile = async () => {
    tileStart.current = false;

    let onScreenJson = {
      quadKeys: [],
      coordinates: []
    };

    //브라우져 지도의 남서쪽, 북동쪽 좌표
    const ne = map.current.getBounds().getNorthEast();
    const sw = map.current.getBounds().getSouthWest();

    const tile = tilebelt.pointToTile(ne.lng, ne.lat, process.env.REACT_APP_ZOOMLEVEL);
    const bbox = tilebelt.tileToBBOX(tile);

    const offset = [bbox[2] - bbox[0], bbox[3] - bbox[1]];        // Tile 한변의 길이 구하는 부분

    // Grid 만드는 2중 for문
    for (let i = sw.lng - offset[0]; i <= ne.lng + offset[0]; i += offset[0]) {     // 0: longitude, 1: latitude
      for (let j = sw.lat - offset[1]; j <= ne.lat + offset[1]; j += offset[1]) {
        const _tile = tilebelt.pointToTile(i, j, process.env.REACT_APP_ZOOMLEVEL);
        const _geoJson = tilebelt.tileToGeoJSON(_tile).coordinates;
        onScreenJson.coordinates.push(_geoJson);
        onScreenJson.quadKeys.push(tilebelt.tileToQuadkey(_tile));
      }
    }

    const geometryJson = setGeometryJson(onScreenJson.coordinates);

    // 타일 라인 레이어 생성
    if (map.current.getSource("tileData") === undefined) {

      map.current.addSource("tileData", {
        type: "geojson",
        data: geometryJson
      });

      map.current.addLayer({
        id: "tile_layer",
        type: "line",
        source: "tileData",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#222222",
          "line-width": 1,
          "line-opacity": 0.3
        },
        minzoom: 17
      });

    } else { // map.current.getSource("tileData") !== undefined
      map.current.getSource("tileData").setData(geometryJson);
    }

    onScreen.current.quadKeys = onScreenJson.quadKeys;
    onScreen.current.coordinates = onScreenJson.coordinates;
    tileStart.current = true;
  } // ========== [setTile] ==========

  /**
   * 국기 리스트 draw
   * */
  const setFlag = async () =>{
    // TODO : api에서 지도 가져오기
    // TODO : 구매된 Tile이 저장하고 있어야 할 데이터 [groupId, grouplist, groupCnt, quadKey, coordinates, center, owner, prevPrice, sellPrice, sell_YN, create_dt, modify_dt]
    const buyedQuadKeys = await callBuyedMap(onScreen.current.quadKeys);

    let forOnBuyedScreen = []; // 스크린에 있는 구매한 타일 모음(센터추가)

    /** Center 만들기 **/
    buyedQuadKeys.map((item, i) => {
      // 동일 index 가져오기
      const idx = onScreen.current.quadKeys.findIndex(item2 => item2 === item.quadKey);
      const tile = tilebelt.quadkeyToTile(item.quadKey);
      const bbox = tilebelt.tileToBBOX([tile[0]+.5, tile[1]+.5, tile[2]]); // bbox[0],bbox[3]

      // 화면상에 있는 것만 저장
      if(idx !== -1) forOnBuyedScreen.push({quadKey : item.quadKey, country: item.country ,owner: item.owner, coordinates: onScreen.current.coordinates[idx], center: [bbox[0],bbox[3]], id: item.id });
    });

    /**
     * 구매땅에 구매 올리기
     * desc : Click 에 로직이 있음. 여기서는 데이터만 저장.
     * */
    onScreen.current.onBuyed = forOnBuyedScreen;

    /**
     * 구매땅에 국기 올리기
     * desc: 국기별로 center점 저장.
     * */
    //국가별로 묶기
    let groupByCountry = forOnBuyedScreen.reduce((result, current) => {
          result[current.country] = result[current.country] || [];
          result[current.country].push(current.center);
          return result;
        }, {});

    // 없는 국기 레이어 삭제
    // desc: 기존 국기 리스트에 없고 동시에 소스는 있을때
    Object.keys(groupByCountry).forEach(flagName => {
      if(!onScreen.current.countryList.includes(flagName) && map.current.getSource("flagData_".concat(flagName)) !== undefined){
        map.current.removeLayer("flag_layer_".concat(flagName));
        map.current.removeSource("flagData_".concat(flagName));
      }
    });

    onScreen.current.countryList = [];        // 국기 리스트 초기화

    /** 레이어 올리기, 기존 있는거는 레이어 데이터만 교체,
     * Warning! : 레이어 삭제후 다시 올리면 twinkling 현상 있음!
     * */
    Object.keys(groupByCountry).forEach(flagName => {
      const featuresData = setGeometryJsonMultiPoint( groupByCountry[flagName] );

      if(map.current.getSource('flagData_'.concat(flagName)) === undefined){
        map.current.addSource('flagData_'.concat(flagName), {
          type: 'geojson',
          data: featuresData
        });

        map.current.addLayer({
          id: 'flag_layer_'.concat(flagName),
          type: 'symbol',
          source: 'flagData_'.concat(flagName),
          minzoom: 17,
          layout: {
            'icon-image': flagName,
            'icon-size': 1.5,
            'icon-allow-overlap': true, // zoomLevel 17.18정도일때 합쳐짐 방지
          },
          paint: {
            'icon-opacity': 0.3
          }
        });

      }else{
        // 이미 레이어가 있는 경우는 features 만 교체
        map.current.getSource('flagData_'.concat(flagName)).setData(featuresData);
      }
      onScreen.current.countryList.push(flagName);     // 현재 화면상의 국가 리스트
    });
  } // setFlag

  /**
   * 국기 이미지 전부 부르기
   * desc: 미리 불러야 함.
   * */
  const _setFlagImage = async () => {
    const flagArr = [{name: "io", image: ioFlag}, {name: "kr", image: koFlag},{name: "us", image: usFlag},{name: "ad", image: adFlag}];
    flagArr.map(async (item) =>{
      console.log(map.current.hasImage(item.name))
      if (!map.current.hasImage(item.name)){
        await map.current.loadImage(
            item.image,
            (error, image) => {
              if (error) throw error;

              map.current.addImage(item.name, image);
            });
      }

    });
  }

  /**
   * [선택 영역 색칠 레이어]
   * desc: 스타일 변경시 타일 선택 재구성용
   * */
  const setClickTileSelectBoxStart = async () =>{
    const geometryJson = setGeometryJson(onSelect.current.selected.coordinates);

    if (map.current.getSource("selectData") === undefined) {

      map.current.addSource("selectData", {
        type: "geojson",
        data: geometryJson
      });

      map.current.addLayer({
        id: "select_layer",
        type: "fill",
        source: "selectData",
        'paint': {
          'fill-color': '#ffffff',
          'fill-opacity': 0.50
        },
        minzoom: 17
      });

    }else{
      map.current.getSource("selectData").setData(geometryJson);
    }

    // 블록정보 창을 위한 렌더링 정보
    setSelectedCellList({
      groupSelect :{
        isGroupSelect: false, groupId : -1, quadKeys : [], coordinates: []
      },
      boxSelect: {
        quadKeys: onSelect.current.selected.quadKeys,
        coordinates: onSelect.current.selected.coordinates,
        isBoxSelect: true
      }
    });

  }

  /**
   * [그룹선택 영역 색칠 레이어]
   * desc: 그룹 선택시 & 스타일 변경시 타일 선택 재구성용
   * */
  const setClickTileGroupStart = async (onGroupSelect) =>{

    const clickAreaTileFeatures = setGeometryJson(onGroupSelect.coordinates);
    const clickAreaFlagFeatures = setGeometryJsonMultiPoint(onGroupSelect.center);

    // 구매된 tile 레이어 올리기
    if(map.current.getSource("buyedData") === undefined){
      map.current.addSource("buyedData" , {
        'type': 'geojson',
        'data': clickAreaTileFeatures
      });

      map.current.addLayer({
        id: "buyed_layer",
        type: "fill",
        source: "buyedData",
        paint: {
          'fill-color': '#79da19',
          'fill-opacity': 0.50,
        },
        minzoom: 17,
        layout: {
          'visibility': 'visible'
        }
      });

    }else{
      map.current.getSource("buyedData").setData(clickAreaTileFeatures);

      //국기의 경우 이전 깃발사진으로 된 레이어가 남아있기 때문에 지우고 다시 만들어야 한다. 다시 만드는건 아랫줄에...
      map.current.removeLayer("buyedFlag_layer");
      map.current.removeSource("buyedFlagData");
    }

    // 국기 레이어 생성 및 재생성
    map.current.addSource("buyedFlagData" , {
      'type': 'geojson',
      'data': clickAreaFlagFeatures
    });

    map.current.addLayer({
      id: 'buyedFlag_layer',
      type: 'symbol',
      source: 'buyedFlagData',
      minzoom: 17,
      layout: {
        'icon-image': onGroupSelect.country,
        'icon-size': 1.3,
      },
      paint: {
        'icon-opacity': 1
      }
    });

    setSelectedCellList(prevState => ({
      ...prevState, groupSelect: {
        quadKeys: onGroupSelect.quadKeys, coordinates : onGroupSelect.coordinates, isGroupSelect: true
      }
    }));

    onSelect.current.onGroupSelect = onGroupSelect;
    selectTile.current.groupClick = true;

  }

  /**
   * 맵 시작
   * */
  const initMap = async () =>{
    if (map.current) return;

    //맵 최초생성
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: lngLat,
      zoom: zoomLevel,
      scrollZoom: true
    });

    _setFlagImage();

    /**
     * ===================================================================================================
     * =============================================[지도 LOAD]============================================
     * ===================================================================================================
     * */
    map.current.on('load', () => {
      console.log('load');
      /**
       * 이미지 로드
       * desc: 로드할 이미지를 미리 부른다.
       * */

      /**
       * [줌 이벤트]
       * desc: 17레벨 이하에서만 작동
       * */
      map.current.on('zoomend', () => {
        setZoomLevel(map.current.getZoom());
        if(map.current.getZoom() < 17) return;
      });

      /**
       * [지도 움직임 이벤트]
       * desc: zoomLevel 17 이하에서만 동작 가능
       * */
      map.current.on('moveend', (event) => {
        let sendAction = true;
        if (event && event.originalEvent && event.originalEvent.type === 'resize') sendAction = false;
        if (!sendAction) return;
        if(map.current.getZoom() < 17) return;
        setTile();        // 타일
        setFlag();        // 국기

      }); // ======[moveend]======

      /**
       * [클릭 이벤트]
       * desc: Grid 선택 selectBox & 삭제 selectBox 에 사용
       * setClickTile, setClick
       * https://docs.mapbox.com/mapbox-gl-js/api/events/#mapmouseevent#type
       * */
      map.current.on("click",  async (event) => {
        if(!tileStart.current) return;

        const _self = {}
        if(map.current.getZoom() < 17) return;  // 줌 레벨 17이하 이벤트막기
        console.log("click mode : " + selectTile.current);

        const latLng = event.lngLat;
        const lng = latLng.lng, lat = latLng.lat;
        const tile = tilebelt.pointToTile(lng, lat , process.env.REACT_APP_ZOOMLEVEL);

        const quadKey = tilebelt.tileToQuadkey(tile);
        const coordinate = tilebelt.tileToGeoJSON(tile).coordinates;

        /**
         * [그룹 타일 클릭]
         * desc: 구매된 그룹 클릭시 작동
         * */
        _self.setClickTileGroupStart = async () =>{
          const findIndex = onScreen.current.onBuyed.findIndex(item => item.quadKey === quadKey);

          // 선택 레이어 삭제 == 모두 초기화후 시작
          if(map.current.getSource("selectData") !== undefined){
            onSelectedReset();
            selectTile.current.tileClick = false;
          }

          // TODO : 나중에 조회 api로 변경 == START
          let clickAreaJson = await callBuyedMapClick(onScreen.current.onBuyed[findIndex].id);
          // TODO : 나중에 조회 api로 변경 == END

          let onGroupSelect = {
            id: onScreen.current.onBuyed[findIndex].id ,
            quadKeys: [],
            coordinates: [],
            center: [],
            country : 'kr'
          };

          clickAreaJson.map( item => {
            onGroupSelect.coordinates.push(item.coordinates);
            onGroupSelect.quadKeys.push(item.quadKey);
            onGroupSelect.center.push(item.center);
            onGroupSelect.country = item.country;
          });

          await setClickTileGroupStart(onGroupSelect);

        }

        /**
         * [영역선택 - 시작]
         * 선택모드 => 클릭시
         * */
        _self.setClickTileSelectBoxStart = (quadKey, coordinate, tile) =>{

          const geometryJson = setGeometryJson([coordinate]);
          onSelect.current.onSelect.start =  { tile : tile };             // 최초 클릭시 타일 저장

          // 선택모드 => 클릭시 => 새로운 레이어생성
          if (map.current.getSource("selectData") === undefined) {

            map.current.addSource("selectData", {
              type: "geojson",
              data: geometryJson
            });

            map.current.addLayer({
              id: "select_layer",
              type: "fill",
              source: "selectData",
              'paint': {
                'fill-color': '#ffffff',
                'fill-opacity': 0.50
              },
              minzoom: 17
            });

            onSelect.current.selected.quadKeys.push(quadKey);                   // id값
            onSelect.current.selected.coordinates.push(coordinate);             // geojson

            map.current.getSource("selectData").setData(geometryJson);

          }else{
            /**
             * 선택모드 => 클릭시 => 소스 있을때
             * 소스가 있다 === 아직 레이어 선택중 임을 인지
             * map.current.getSource("selectData") !== undefined
             * */
            // 100개 넘어가면 true
            const isMax = onSelect.current.selected.quadKeys.length >= process.env.REACT_APP_MAXTILE;
            // 기존 맵에 없는지 체크
            const isExist = (onSelect.current.selected.quadKeys).findIndex(item => item === quadKey) !== -1
            // 이미 구입된 맵에 있는지 체크
            const isBuyedTile = onScreen.current.onBuyed.findIndex(item => item.quadKey === quadKey) !== -1;

            if(!isMax && !isExist && !isBuyedTile){
              onSelect.current.selected.quadKeys.push(quadKey);                   // id값
              onSelect.current.selected.coordinates.push(coordinate);             // geojson
              const geometryJsonPlus = setGeometryJson(onSelect.current.selected.coordinates);
              map.current.getSource("selectData").setData(geometryJsonPlus);
            } //!isMax && isExist

          } // map.current.getSource("selectData") === undefined
        }

        /**
         * [영역선택 - 종료]
         * 선택모드 => 클릭종료시
         * desc: 선택정보를 선택에 저장후, 초기화 한다.
         * */
        _self.setClickTileSelectBoxEnd = () =>{
          onSelect.current.selected.quadKeys = onSelect.current.onSelect.quadKeys;
          onSelect.current.selected.coordinates = onSelect.current.onSelect.coordinates;

          // 블록정보 창을 위한 렌더링 정보
          setSelectedCellList({
            groupSelect :{
              isGroupSelect: false, groupId : -1, quadKeys : [], coordinates: []
            },
            boxSelect: {
              quadKeys: onSelect.current.selected.quadKeys,
              coordinates: onSelect.current.selected.coordinates,
              isBoxSelect: true
            }
          });

          // 초기화
          onSelect.current.onSelect.quadKeys = [];
          onSelect.current.onSelect.coordinates = [];
          onSelect.current.onSelect.start = {};
          onSelect.current.onSelect.end = {};
        }


        /**
         * [영역삭제 - 시작]
         * 삭제모드 => 클릭시
         * */
        _self.setClickTileDeleteBoxStart = (quadKey, coordinate, tile) =>{
          const geometryJson = setGeometryJson([coordinate]);

          onSelect.current.onDelete.start =  {tile : tile};

          map.current.addSource("deleteData", {
            type: "geojson",
            data: geometryJson
          });

          map.current.addLayer({
            id: "delete_layer",
            type: "fill",
            source: "deleteData",
            'paint': {
              'fill-outline-color': '#9e5296',
              'fill-color': '#ffb5cc',
              'fill-opacity': 0.50
            },
          });

          onSelect.current.onDelete.quadKeys.push(quadKey);
          onSelect.current.onDelete.coordinates.push(coordinate);

          map.current.getSource("deleteData").setData(geometryJson);
        }

        /**
         * [영역삭제 - 종료]
         * 삭제모드 => 클릭끝날때
         * */
        _self.setClickTileDeleteBoxEnd = () =>{
          let deleteIndex = [];

          //삭제할 index 추출
          onSelect.current.selected.quadKeys.map((item, i) => onSelect.current.onDelete.quadKeys.includes(item) === true ? deleteIndex.push(i) : "" )

          //index 번호로 포함되지 않는 것만 뺀다. 삭제되고 나머지만 추출한다.
          let onDeletedQuadKeys = onSelect.current.selected.quadKeys.filter((item, idx) => !deleteIndex.includes(idx));
          let onDeletedCoordinates = onSelect.current.selected.coordinates.filter((item, idx) => !deleteIndex.includes(idx));

          onSelect.current.selected.quadKeys = onDeletedQuadKeys;
          onSelect.current.selected.coordinates = onDeletedCoordinates;

          // 구매창 상태변화 용
          setSelectedCellList(prevState => ({
            ...prevState,
            boxSelect: {
              quadKeys: onSelect.current.selected.quadKeys,
              coordinates: onSelect.current.selected.coordinates,
              isBoxSelect: onSelect.current.selected.quadKeys.length !== 0 ? true : false
            }
          }));

          const geometryJson = setGeometryJson(onSelect.current.selected.coordinates);

          if(map.current.getSource("selectData") !== undefined) map.current.getSource("selectData").setData(geometryJson);

          onSelect.current.onDelete.quadKeys = [];
          onSelect.current.onDelete.coordinates = [];
          onSelect.current.onDelete.start = {};
          onSelect.current.onDelete.end = {};

          map.current.removeLayer("delete_layer");
          map.current.removeSource("deleteData");
        }

        /**
         * [클릭동작]
         * */
        _self.setClickTile = async (quadKey, coordinate, tile) =>{

          switch (onSelect.current.mode) {
            case "select": /** =================[선택모드]================= **/

              const isBuyedTile = onScreen.current.onBuyed.findIndex(item => item.quadKey === quadKey) !== -1;

              if(onScreen.current.onBuyed.length !== 0 && isBuyedTile){
                _self.setClickTileGroupStart();
                return;   // ===================구입된 그룹클릭이면 여기서 멈춤===================
              } //=============================================[그룹셀 클릭 종료]==========================================

              // 빈 타일 클릭인 경우 => 레이어 초기화하기
              if(map.current.getSource("buyedData") !== undefined){
                map.current.removeLayer("buyed_layer");
                map.current.removeSource("buyedData");
              }
              if(map.current.getSource("buyedFlagData") !== undefined){
                map.current.removeLayer("buyedFlag_layer");
                map.current.removeSource("buyedFlagData");
              }

              selectTile.current.groupClick = false;

              /**
               * 선택모드 => 클릭시
               * desc: 선택 레이어의 셀 Tile을 만든다.
               * */
              if(!selectTile.current.tileClick){
                setSelectedCellList({
                  boxSelect : {
                    isBoxSelect: false, quadKeys: [], coordinates: []
                  },
                  groupSelect :{
                    isGroupSelect: false, groupId : -1, quadKeys : [], coordinates: []
                  }
                });
                _self.setClickTileSelectBoxStart(quadKey, coordinate, tile);
              }else{
                _self.setClickTileSelectBoxEnd();
              }
              break;

            case "delete": /** =================[삭제모드]================= **/

              if(!selectTile.current.tileClick){
                _self.setClickTileDeleteBoxStart(quadKey, coordinate, tile);
              }else{
                _self.setClickTileDeleteBoxEnd();
              }

              break;
          }
          selectTile.current.tileClick = !selectTile.current.tileClick    // 클릭 or 클릭아님 모드 변경

        };

        // 로직 시작
        await _self.setClickTile(quadKey, coordinate, tile);

      }); // ======[click]======

      /**
       * [마우스오버 이벤트]
       * desc : 클릭 이후에 작동, selectBox 기능으로만 사용
       * 현재 위경도를 지속적으로 입력
       * https://docs.mapbox.com/mapbox-gl-js/api/events/#mapmouseevent#type
       * */
      map.current.on("mousemove", (event) => {
        const _self = {};
        if(map.current.getZoom() < 17) return;               // 줌레벨 17이하 이벤트막기
        if(selectTile.current.groupClick === true) return;   // 그룹 클릭상태는 막기
        if(selectTile.current.tileClick === false) return;   // 클릭안한 상태 이벤트 막기

        /**
         * 선택모드
         * */
        _self.setMouseMoveSelect = (_tile) =>{
          let onSelectTemp = {
            quadKeys: [],
            coordinates: []
          };
          let geometryJson, calMinMaxXY, rightMode;
          onSelect.current.onSelect.end = {tile: _tile}

          calMinMaxXY = calMinMax(onSelect.current.onSelect.start, onSelect.current.onSelect.end);            // x y 의 최소 최대값 반환
          rightMode = onSelect.current.onSelect.end.tile[0] > onSelect.current.onSelect.start.tile[0];        // 오른쪽 모드인지 체크

          for (let i = (rightMode ? calMinMaxXY.x.min : calMinMaxXY.x.max) ; rightMode ? i <= calMinMaxXY.x.max : i >= calMinMaxXY.x.min ; rightMode ? i++ : i--) {       // 가로
            for (let j = (rightMode ? calMinMaxXY.y.min : calMinMaxXY.y.max) ; rightMode ? j <= calMinMaxXY.y.max : j >= calMinMaxXY.y.min ; rightMode? j++ : j-- ) {     // 세로
              const _tile = [i, j, process.env.REACT_APP_ZOOMLEVEL];
              const _quadKey = tilebelt.tileToQuadkey(_tile);
              const _coordinate = tilebelt.tileToGeoJSON(_tile).coordinates;
              const _mergeQuadKeys = onSelect.current.selected.quadKeys.length + onSelectTemp.quadKeys.length;

              // 100개 넘어가면 선택불가
              const isMax = _mergeQuadKeys >= process.env.REACT_APP_MAXTILE;
              // 기존 맵에 있는지 체크
              const isExist = (onSelect.current.selected.quadKeys).findIndex(item => item === _quadKey) !== -1;
              // 이미 구입된 맵에 있는지 체크
              const isBuyedTile = onScreen.current.onBuyed.findIndex(item => item.quadKey === _quadKey) !== -1;

              if(!isExist && !isMax && !isBuyedTile) {
                onSelectTemp.quadKeys.push(_quadKey);                   // id값
                onSelectTemp.coordinates.push(_coordinate);             // geojson
              }

            }
          }

          // 기존 선택한 CELL들과 합치는 과정을 해야 한다.
          const mergeCoordinatesResult = [...onSelectTemp.coordinates, ...onSelect.current.selected.coordinates];
          const mergeQuadKeysResult = [...onSelectTemp.quadKeys, ...onSelect.current.selected.quadKeys];

          onSelect.current.onSelect.coordinates = mergeCoordinatesResult;
          onSelect.current.onSelect.quadKeys = mergeQuadKeysResult;

          geometryJson = setGeometryJson(mergeCoordinatesResult);
          map.current.getSource("selectData").setData(geometryJson);
        }

        /**
         * 삭제모드
         * */
        _self.setMouseMoveDelete = (_tile) =>{
          let onSelectTemp = {
            quadKeys: [],
            coordinates: []
          };
          let geometryJson, calMinMaxXY, rightMode;

          onSelect.current.onDelete.end = {tile: _tile}
          calMinMaxXY = calMinMax(onSelect.current.onDelete.start, onSelect.current.onDelete.end);            // x y 의 최소 최대값 반환
          rightMode = onSelect.current.onDelete.end.tile[0] > onSelect.current.onDelete.start.tile[0];        // 오른쪽 모드인지 체크

          for (let i = (rightMode ? calMinMaxXY.x.min : calMinMaxXY.x.max) ; rightMode ? i <= calMinMaxXY.x.max : i >= calMinMaxXY.x.min ; rightMode ? i++ : i--) {       // 가로
            for (let j = (rightMode ? calMinMaxXY.y.min : calMinMaxXY.y.max) ; rightMode ? j <= calMinMaxXY.y.max : j >= calMinMaxXY.y.min ; rightMode? j++ : j-- ) {     // 세로
              const _tile = [i, j, process.env.REACT_APP_ZOOMLEVEL];
              const _quadKey = tilebelt.tileToQuadkey(_tile);
              const _coordinates = tilebelt.tileToGeoJSON(_tile).coordinates;
              onSelectTemp.quadKeys.push(_quadKey);
              onSelectTemp.coordinates.push(_coordinates);
            }
          }

          geometryJson = setGeometryJson(onSelectTemp.coordinates);

          onSelect.current.onDelete.quadKeys = onSelectTemp.quadKeys;
          onSelect.current.onDelete.coordinates = onSelectTemp.coordinates;

          map.current.getSource("deleteData").setData(geometryJson);
        }


        const latLng = event.lngLat;
        const lng = latLng.lng, lat = latLng.lat;
        const _tile = tilebelt.pointToTile(lng, lat , process.env.REACT_APP_ZOOMLEVEL);         // xyz return

        switch (onSelect.current.mode) {
          case "select":
            _self.setMouseMoveSelect(_tile);
            break;
          case "delete":
            console.log();
            _self.setMouseMoveDelete(_tile);
            break;
        }
      }); // ======[mousemove]======


      map.current.on('style.load', () => {

        const waiting = async () => {
          if (!map.current.isStyleLoaded()) {
            setTimeout(waiting, 200);
          } else {
            await _setFlagImage();
            await setTile();
            await setFlag();

            console.log(onSelect.current.selected.quadKeys);
            if (onSelect.current.onGroupSelect.quadKeys.length !==0) await setClickTileGroupStart(onSelect.current.onGroupSelect);
            if (onSelect.current.selected.quadKeys.length !== 0) await setClickTileSelectBoxStart();
          }
        };
        waiting();
      });


    }); // ========================[map load]========================

  } //  initMap

  /**
   * [초기화]
   * 레이어와 소스를 날린다.
   * */
  const onSelectedReset = () =>{
    onSelect.current = {
      mode: "select",
      selected :{     // 화면상에 선택
        quadKeys: [],
        coordinates : []
      },
      onSelect : {    // 선택중인 셀
        start: {} ,
        end: {} ,
        quadKeys: [],
        coordinates : []
      },
      onDelete: {     // 삭제중인 셀
        start: {} ,
        end: {} ,
        quadKeys: [],
        coordinates : []
      },
      onGroupSelect: { // 그룹 셀렉트
        id : -1,      // 그룹 아이디
        quadKeys: [],
        coordinates : []
      }
    }

    //
    setSelectedCellList({
      boxSelect : {
        isBoxSelect: false, quadKeys: [], coordinates: []
      },
      groupSelect :{
        isGroupSelect: false, groupId : -1, quadKeys : [], coordinates: []
      }
    });

    // 레이어 삭제
    const _sourceArr = ["select", "delete", "buyed", "buyedFlag"];
    _sourceArr.map(item => {
      if (map.current.getSource(item.concat("Data")) !== undefined){
        map.current.removeLayer(item.concat("_layer"));
        map.current.removeSource(item.concat("Data"));
      }
    });

    selectTile.current.groupClick = false;
    selectTile.current.tileClick = false;

  }

  /**
   * 셀렉트 선택 모드 변경
   * */
  const onSelectedModeChange = (mode) =>{
    onSelect.current.mode = mode;
    
    if(selectTile.current.groupClick){

      // 그룹 레이어 삭제
      const _sourceArr = ["buyedFlag", "buyed" ];
      _sourceArr.map(item => {
        if (map.current.getSource(item.concat("Data")) !== undefined){
          map.current.removeLayer(item.concat("_layer"));
          map.current.removeSource(item.concat("Data"));
        }
      });

      onSelect.current.onGroupSelect = {
        id : -1,
        quadKeys: [],
        coordinates : []
      }
      selectTile.current = {
        tileClick : false,
        groupClick: false
      };
    }

    setSelectMode({
      mode: onSelect.current.mode
    });
  }

  /**
   * 줌 버튼
   * */
  const onMapZoomChange = (changeZoomValue) =>{
    switch (changeZoomValue){
      case "zoomIn":
        map.current.zoomIn();
          break;
      case "zoomOut":
        map.current.zoomOut();
        break;
    }
    setZoomLevel(map.current.getZoom());
  }

  //===========================================================================================================
  //=============================================[useEffect AREA]==============================================
  //===========================================================================================================

  /**
   * 시작
   */
  useEffect(() => {
    initMap();
    // Clean up on unmount
    // return () => map.current.remove();
  }, []);

  /**
   * 맵 타입 변경 [일반지도, 위성, 하이브리드]
   * desc - 맵 타입이 변경되면 작동한다
   * 맵 타입 리스트 - https://maplibre.org/maplibre-gl-js-docs/api/map/
   * */
  useEffect(async () =>{
    if (!map.current) return;
    map.current.setStyle('mapbox://styles/mapbox/'+ selectMapType);
    if(zoomLevel < 17) return;
    //window.location.reload();
    return () => {
      setChange(new Date().getMilliseconds());
    }
  }, [selectMapType]);


  //===========================================================================================================
  //=============================================[VIEW AREA]===================================================
  //===========================================================================================================

  return (
      <>
        <div className="map_bak_layer">
          <div>
            <div>
            </div>
            <div className="sidebar">
              Longitude: {lngLat[1]} | Latitude: {lngLat[0]} | zoomLevel: {zoomLevel}
              Window size: {width} x {height} /  {selectMode.mode} / {change}
            </div>
            <div ref={mapContainer} className="map-container" style={{height: '100vh'}} />
            {/*구매정보창(상시)*/}
            <MapInfoPopupMapbox
                selectedCellList ={selectedCellList}
                zoomLevel = {zoomLevel}
                onSelectedReset = {onSelectedReset}
                selectMode = {selectMode}
                onSelectedModeChange = {onSelectedModeChange}
                onMapZoomChange = {onMapZoomChange}
            />
          </div>
        </div>
      </>
  );
};