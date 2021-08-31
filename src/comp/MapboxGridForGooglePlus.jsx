import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_API_KEY;

/**
 * 지도 메인
 * */
export default function MapboxGridForGooglePlus(props) {

    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lngLat, setLngLat] = useState([126.608257, 37.553067]);
    const [zoom, setZoom] = useState(18); // eslint-disable-line no-unused-vars
    const [start, setStart] = useState(false);

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
                'https://grid.plus.codes/grid/wms/{z}/{x}/{y}.png'
                ],
                'tileSize': 256
            });

            map.current.addLayer(
                {
                    'id': 'simple-tiles',
                    'type': 'raster',
                    'source': 'raster-tiles',
                    'minzoom': 18,
                    'maxzoom': 20,
                    'paint': {
                        'raster-opacity': 0.50
                    }
                }
            );

            //줌이 끝났을때 동작
            map.current.on('zoomend', async function() {

                // 줌 레벨 17 이하에서만 동작
                if(map.current.getZoom() >= 19){
                    console.log('zoom Level 19 in');
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

    }

    
    /**
     * 시작점
     */
    useEffect(() => {
        initMap();
        // Clean up on unmount
        //return () => map.current.remove();
    }, []);


    return (
        <>
            <div className="map_bak_layer">
                <div>
                    <div>
                   
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