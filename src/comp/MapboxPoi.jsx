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
    const [resultData, setResultData] = useState({
        water : "",
        landuse : "",
        waterway : "",
    });

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
            // 마우스 이벤트 켜기
            map.current.on("click", onClickGridEvent);
            
        });

        /**
         * 클릭시 이벤트 발생 로직  
         */
        const onClickGridEvent = (e) =>{

           
            var featuresBuilding = map.current.queryRenderedFeatures(e.point, { layers: ['building'] });
            const featuresWater = map.current.queryRenderedFeatures(e.point, { layers: ['water'] });
            var featuresPoi_label = map.current.queryRenderedFeatures(e.point, { layers: ['poi-label'] });
            var featureslanduse = map.current.queryRenderedFeatures(e.point, { layers: ['landuse'] });
            var featureswaterway = map.current.queryRenderedFeatures(e.point, { layers: ['waterway'] });
            
            var placelabel = map.current.queryRenderedFeatures(e.point, { layers: ['place-label'] });
            var settleLabel = map.current.queryRenderedFeatures(e.point, { layers: ['settlement-label'] });
            var settleSubLabel = map.current.queryRenderedFeatures(e.point, { layers: ['settlement-subdivision-label'] });
            var countryLabel = map.current.queryRenderedFeatures(e.point, { layers: ['country-label'] });
            
            
            var naturalLineLabel = map.current.queryRenderedFeatures(e.point, { layers: ['natural-line-label'] });
            var naturalPointLabel = map.current.queryRenderedFeatures(e.point, { layers: ['natural-point-label'] });
            var naturalLabel = map.current.queryRenderedFeatures(e.point, { layers: ['natural-level'] });
            var naturalLevel = map.current.queryRenderedFeatures(e.point, { layers: ['natural-label'] });

            //https://docs.mapbox.com/vector-tiles/reference/mapbox-streets-v8/#natural_label



            /**
             * isEmpty or featuresBuilding[0].properties
             *
             */
            // console.log('featuresBuilding', featuresBuilding);
            // console.log('featuresPoi_label', featuresPoi_label);
            //console.log('placelabel', featuresplacelabel);
            console.log('naturalLineLabel', naturalLineLabel);
            console.log('naturalPointLabel', naturalPointLabel);
            console.log('naturalLabel', naturalLabel);
            console.log('naturalLevel', naturalLevel);
            console.log('map.getStyle().layers', map.current.getStyle().layers);
            console.log('placelabel', placelabel); // https://docs.mapbox.com/vector-tiles/reference/mapbox-streets-v8/

            console.log('settleLabel', settleLabel);
            console.log('settleSubLabel', settleSubLabel);
            console.log('countryLabel', countryLabel);

            

            console.log("물 여부 데이터", featuresWater.length === 0 ? "땅" : "물");
            console.log('Landuse 데이터', featureslanduse.length === 0 ? "데이터없음" : featureslanduse[0].properties.type);
            console.log('waterway 데이터', featureswaterway.length === 0 ? "데이터없음" : featureswaterway[0].properties.type);
            setResultData({
                water : featuresWater.length === 0 ? "땅" : "물",
                landuse : featureslanduse.length === 0 ? "데이터없음" : featureslanduse[0].properties.type,
                waterway : featureswaterway.length === 0 ? "데이터없음" : featureswaterway[0].properties.type,
            })



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
                    landuse: {resultData.landuse} | landuse: {resultData.water} | waterway: {resultData.waterway} 
                    </div>
                    {/* <div className="sidebar">
                        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom} | click : {flag+""}
                    </div> */}
                    <div ref={mapContainer} className="map-container" style={{height: '100vh'}} />
                </div>
            </div>
        </>
    );

}
