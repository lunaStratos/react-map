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
            <p></p>
            <Link to="/MapboxGridForGooglePlus"> MapboxGridForGooglePlus</Link> - 맵박스, 구글 플러스 코드 적용
            <p></p>
            <Link to="/MapboxPoi"> MapboxPoi</Link> - 맵박스, poi 정보 콘솔

            <p></p>
            <Link to="/MapMapbox"> MapMapbox</Link> - 맵박스, 박스선텍, 선택지우기, 10M 단위로 Grid 그리기, 그룹선택 
            
            
            
        </div>
    );
};

export default Home;