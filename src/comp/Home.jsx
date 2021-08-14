import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div>
            <h2>
                React Map Test 
            </h2>
            <p></p>
            <Link to="/googleMapGrid">googleMap</Link> - googleMap Grid 그리기
            <p></p>
            <Link to="/mapboxGrid">Mapbox</Link> - Mapbox Grid 그리기
            <p></p>
            <Link to="/googleMapPlusCodeGrid"> googleMap + plusCode </Link> - plusCode를 이용한 그리드 자동 그리기 
            <p></p>
            <Link to="/d3AreaGraph"> D3AreaGraph</Link> - D3 Graph 바
        </div>
    );
};

export default Home;