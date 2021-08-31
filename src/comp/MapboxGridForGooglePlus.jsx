import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import axios from 'axios';
import tilebelt from '@mapbox/tilebelt';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import SphericalMercator from '@mapbox/sphericalmercator';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_API_KEY;

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
});

// By default, precomputes up to z30
var sm = new SphericalMercator({
    size: 256
});

/**
 * 지도 메인
 * */
export default function MapboxGridForGooglePlus(props) {

    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lngLat, setLngLat] = useState([126.608257, 37.553067]);
    const [zoom, setZoom] = useState(18); // eslint-disable-line no-unused-vars
    const [start, setStart] = useState(false);
    const [selectPoint, setSelectPoint] = useState();
    const [selectMultiGrid, setSelectMultiGrid] = useState([]);

    const mapCellIdList = useRef([]);        // 맵상의 셀 아이디 리스트, 맵에 표시되어 있는 셀을 항상 가지고 있어야 함



    const connPlusCodeJsonGrid = async (zoom, x, y) =>{
        const linkAddress = ['https://grid.plus.codes/grid/wms/', zoom, '/', x, '/', y, '.json?zoomadjust=2'].join('');
        const responseData = await axios.get(linkAddress);
    
        let cellList = "";
    
        //Cell에 기초데이터 및 중복검사
        responseData.data.features.map(item =>{
          item.geometry.coordinates[0][4] = item.geometry.coordinates[0][0];
          const centerTurf = turf.center(turf.points(item.geometry.coordinates[0]));
          item.properties.centerLngLat = {lng: centerTurf.geometry.coordinates[0], lat: centerTurf.geometry.coordinates[1]};
          item.properties.sellStatus = "01";
    
          const searchResult = mapCellIdList.current.findIndex(cellItem => cellItem === item.properties.global_code);
          if(searchResult === -1) {
            cellList += item.properties.global_code + ","
            mapCellIdList.current.push(item.properties.global_code);
            item.properties.duplicate = 0;
          }else{
            //중복 표시
            item.properties.duplicate = 1;
          }
          return item;
        });
        // 중복되는 것들 지우기
        let filteringData = responseData.data.features.filter(item2 => item2.properties.duplicate !== 1);
        responseData.data.features = filteringData;
        console.log("responseData.data", responseData.data)
        return responseData.data;
        
       }

    const lon2tile = (lon,zoom) => { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
    const lat2tile = (lat,zoom) =>  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }


    const initMap = () =>{
        if (map.current) return;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/outdoors-v11',
            center: lngLat,
            zoom: zoom,
            scrollZoom: true
        });


     
        map.current.on('load', () => {


            map.current.addSource('raster-tiles', {
                'type': 'raster',
                'tiles': [
                'https://grid.plus.codes/grid/wms/19/{x}/{y}.png'
                ],
                'tileSize': 256
                });


            
            console.log(map.current.getSource('raster-tiles'));

            map.current.addLayer(
                {
                    'id': 'simple-tiles',
                    'type': 'raster',
                    'source': 'raster-tiles',
                    'minzoom': 0,
                    'maxzoom': 22,
                    'paint': {
                        'raster-opacity': 0.50
                    }
                }
            );
            
            const minLat = 37.55171351970851
            const minLng = 126.6069635197085
            const maxLng = 37.5544114802915
            const maxLat = 126.6096614802915
var bbox = [minLng, minLat, maxLng, maxLat]
var poly = turf.bboxPolygon(bbox);

console.log(poly)

             map.current.addSource('grid-source', {
                         'type': "geojson",
                        'data': poly,
                        'generateId': true
            });

            map.current.addLayer(
                {
                    'id': 'mainMap',
                    'type': 'fill',
                    'source': 'grid-source',
                    'layout': {},
                    'paint': {
                        'fill-color': '#088',
                        'fill-opacity': 0.5
                    }
                }
            );

            //줌이 끝났을때 동작
            map.current.on('zoomend', async function() {

                // 줌 레벨 17 이하에서만 동작
                if(map.current.getZoom() >= 19){
                    console.log('zoom Level 19 in');
                   
                    const getCenter =  map.current.getCenter();
                    const getBound =  map.current.getBounds();
                    var minLon = getBound.getNorthEast();
                    var maxLon = getBound.getSouthWest();
                    const googleY = lat2tile(getCenter.lat, 19);
                    const googleX = lon2tile(getCenter.lng, 19);

                    const coordinates = map.current.project([getCenter.lng, getCenter.lat]);
                    console.log("coordinates", coordinates)

                    const returnData = await connPlusCodeJsonGrid(19, googleX, googleY);

                    
                    


                    // if(typeof map.current.getLayer('mainMap') == 'undefined'){


                    //     map.current.addSource('grid-source', {
                    //         'type': 'vector',
                    //         'tiles': [
                    //         'https://grid.plus.codes/grid/wms/19/{x}/{y}.json?zoomadjust=2'
                    //         ],
                    //         'minzoom': 6,
                    //         'maxzoom': 14
                    //     });

                    //     // map.current.addSource('grid-source', {
                    //     //     'type': "geojson",
                    //     //     'data': returnData,
                    //     //     'generateId': true
                    //     // });

                    //     map.current.addLayer(
                    //         {
                    //             'id': 'mainMap',
                    //             'type': 'fill',
                    //             'source': 'grid-source',
                    //             'layout': {},
                    //             'paint': {
                    //                 'fill-color': '#088',
                    //                 'fill-opacity': 0.50
                    //             }
                    //         }
                    //     );

                    //     //선택 그리드
                    //     map.current.addLayer(
                    //         {
                    //             'id': 'mainMap-highlighted',
                    //             'type': 'fill',
                    //             'source': 'grid-source',
                    //             'paint': {
                    //                 'fill-outline-color': '#484896',
                    //                 'fill-color': '#6e599f',
                    //                 'fill-opacity': 0.50
                    //             },
                    //             'filter': ['==', ['get', 'id'], -1]
                    //         },
                    //         'settlement-label'
                    //     );



                    //     // 마우스 이벤트 켜기
                    //     //map.current.on("click", onClickGridEvent);

                    //     //지도 안으로 행군하라!
                    //     map.current.on('mousemove', function(e) {
                    //         var features = map.current.queryRenderedFeatures(e.point, { layers: ['mainMap'] });
                    //         if(features[0] != undefined){
                    //             const selectIndex = features[0].id;
                    //         }

                    //     });
                    //     //지도 밖으로 행군하라!
                    //     map.current.on('mouseover', function() {
                    //         console.log('A mouseover event has occurred.');
                    //     });
                    // }

                    setStart(true);

                }else{
                    // 이벤트 끄기
                    console.log('zoom Level 17 out');


                    setStart(false);


                }
                setZoom(map.current.getZoom());
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

        /**
         * 클릭시 이벤트 발생 로직  
         */
        const onClickGridEvent = (e) =>{

            

        }

    }

    
    /**
     * 시작점
     */
    useEffect(() => {
        initMap();
        // Clean up on unmount
        //return () => map.current.remove();
    }, []);


    useEffect(() => {
        if (map.current) return;
        if(start){
            /**
             * 줌 인 이벤트 
             * */  
            console.log('selectMultiGrid', selectMultiGrid);
            const filter = ['match', ['number', ['get', 'id']], selectMultiGrid , true, false];
            map.current.setFilter('mainMap-highlighted', filter);  
        }else{
            /**
             * 줌 아웃 이벤트로 인한 해제 
             * */    
            const filter = ['==', ['number', ['get', 'id']], -1];
            map.current.setFilter('mainMap-highlighted', filter);
            setSelectMultiGrid([]);
        }
    }, [start]);

    useEffect(() => {
        if (selectPoint === undefined) return;
        const searchX = selectMultiGrid.findIndex(item => item === selectPoint);
        console.log('searchX', searchX, selectMultiGrid);

        //없음 === -1
        if (searchX === -1){
            setSelectMultiGrid(item => ([...item, selectPoint]));
        }else{
            const arr = selectMultiGrid.filter(item => item !== selectPoint );
            console.log('arr', arr);
            setSelectMultiGrid(arr);
        }
     
    }, [selectPoint]);

    useEffect(() => {
        if (selectPoint ===undefined) return;

        console.log('searchX', selectMultiGrid);
        if(selectMultiGrid.length >0){
            const filter = ['match', ['number', ['get', 'id']], selectMultiGrid , true, false];
            map.current.setFilter('mainMap-highlighted', filter);
        }else{
            const filter = ['==', ['number', ['get', 'id']], -1];
            map.current.setFilter('mainMap-highlighted', filter);
        }
       
     
    }, [selectMultiGrid]);



    return (
        <>
            <div className="map_bak_layer">
                <div>
                    <div>
                        <button onClick={() => {
                            setSelectMultiGrid([]);
                        }}>
                            선택 초기화
                        </button>
                    </div>
                    <div className="sidebar">
                        Longitude: {lngLat[1]} | Latitude: {lngLat[0]} | Zoom: {zoom} 
                    </div>
                    <div ref={mapContainer} className="map-container" style={{height: '100vh'}} />
                </div>
            </div>
        </>
    );

}
