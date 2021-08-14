import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_API_KEY;

/**
 * 지도 메인
 * */
export default function MapboxGrid(props) {

    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(126.812776); // eslint-disable-line no-unused-vars
    const [lat, setLat] = useState(37.571586); // eslint-disable-line no-unused-vars
    const [zoom, setZoom] = useState(15); // eslint-disable-line no-unused-vars
    const [flag, setFlag] = useState(false);
    const [start, setStart] = useState(false);
    const [selectPoint, setSelectPoint] = useState();
    const [selectMultiGrid, setSelectMultiGrid] = useState([]);
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
            squareGrid.features[i].properties.density = 0.2; // 타일 불투명도 지정
            squareGrid.features[i].properties.id = i; //id
            
            //중앙 점 넣기 
            const itemPoint = turf.points(
                squareGrid.features[i].geometry.coordinates[0]
            );
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



                        // 마우스 이벤트 켜기
                        map.current.on("click", onClickGridEvent);

                        //지도 안으로 행군하라!
                        map.current.on('mousemove', function(e) {
                            var features = map.current.queryRenderedFeatures(e.point, { layers: ['mainMap'] });
                            if(features[0] != undefined){
                                const selectIndex = features[0].id;
                                //                    console.log('A mousemove event has occurred.' + selectIndex);
                            }

                        });
                        //지도 밖으로 행군하라!
                        map.current.on('mouseover', function() {
                            console.log('A mouseover event has occurred.');
                        });
                    }


                    setStart(true);

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

                    setStart(false);


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

        /**
         * 클릭시 이벤트 발생 로직  
         */
        const onClickGridEvent = (e) =>{

            var features = map.current.queryRenderedFeatures(e.point, { layers: ['mainMap'] });
            console.log('features', features);

            const convertJson = JSON.parse(features[0].properties.centerLngLat);
            const point = map.current.project([convertJson.lng, convertJson.lat]);
            console.log('point', point);

            var featuresBuilding = map.current.queryRenderedFeatures(point, { layers: ['building'] });
            const featuresWater = map.current.queryRenderedFeatures(point, { layers: ['water'] });
            var featuresPoi_label = map.current.queryRenderedFeatures(point, { layers: ['poi-label'] });
            var featureslanduse = map.current.queryRenderedFeatures(point, { layers: ['landuse'] });
            var featureswaterway = map.current.queryRenderedFeatures(point, { layers: ['waterway'] });
            var featuresplacelabel = map.current.queryRenderedFeatures(point, { layers: ['settlement-label'] });




            /**
             * isEmpty or featuresBuilding[0].properties
             *
             */
            console.log('featuresBuilding', featuresBuilding);
            console.log('featuresPoi_label', featuresPoi_label);
            console.log('featuresLand', featureslanduse);
            console.log('featureswaterway', featureswaterway);
            console.log('featuresplacelabel', featuresplacelabel);
            console.log('featuresWater', featuresWater);
            console.log('map.getStyle().layers', map.current.getStyle().layers);

            var feature = features[0];

            // 외부지도 클릭시 반응하지 않기
            if(features[0] == undefined) return;
            // grid 클릭
            const selectIndex = feature.id;
            setSelectPoint(selectIndex);

        }

    }



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
                        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom} | click : {flag+""}
                    </div>
                    <div ref={mapContainer} className="map-container" style={{height: '100vh'}} />
                </div>
            </div>
        </>
    );

}
