import {round} from "@turf/turf";

/**
 * 전체 액수 계산
 * 모든 선택된 Grid를 넘기면 안의 price를 더한다.
 */
export const allPrice = (data)=> {

    let price = 0;

    data.map(item => {
       if(item.sellStatus == "01"){
           price += item.price;
       }else if(item.sellStatus == "03"){
           price += item.sellPrice;
       }
    });
    price = price.toFixed(2)
    return price;
}

/**
 * SwNe계산기
 * */
export const calLatLngSwNe = (json)=> {

    const minLat = Math.min(json.start.lat, json.end.lat);
    const minLng = Math.min(json.start.lng, json.end.lng);
    const maxLat = Math.max(json.start.lat, json.end.lat);
    const maxLng = Math.max(json.start.lng, json.end.lng);

    const returnJson = {
        sw : {
            lat: minLat,
            lng: minLng
        },
        ne : {
            lat: maxLat,
            lng: maxLng
        }
    }
    return returnJson;
}


/**
 * SwNe계산기
 * */
export const latLngSwNe = (start, end)=> {
    //low  0,1
    //high 1,2
    console.log("SwNe계산기", start.bbox[0], end.bbox[0]);
    const minLat = Math.min(start.bbox[0][1], end.bbox[0][1]);
    const minLng = Math.min(start.bbox[0][0], end.bbox[0][0]);
    const maxLat = Math.max(start.bbox[0][3], end.bbox[0][3]);
    const maxLng = Math.max(start.bbox[0][2], end.bbox[0][2]);

    const returnJson = {
        sw : {
            lat: minLat,
            lng: minLng
        },
        ne : {
            lat: maxLat,
            lng: maxLng
        }
    }
    return returnJson;
}

/**
 * min max return
 * for
 * */
export const calMinMax = (start, end)=> {

    const minX = Math.min(start.tile[0], end.tile[0]);
    const minY = Math.min(start.tile[1], end.tile[1]);
    const maxX = Math.max(start.tile[0], end.tile[0]);
    const maxY = Math.max(start.tile[1], end.tile[1]);

    const returnJson = {
        x : {
            min: minX,
            max: maxX
        },
        y : {
            min: minY,
            max: maxY
        }
    }
    return returnJson;
}


/**
 * 첫 클릭 주소지 얻기
 * 1번 값이 있을 경우만 사용, 0이면 아예 표시 x
 */
export const firstCellAddress = (selectCellList) =>{
    if(selectCellList.length === 0) return;
    let resultAddress = selectCellList[0].locationInfo.address;
    return resultAddress;
}

/**
 * 선택 주소지 판매중/판매아님/빈땅 표시
 */
export const CellStatusAndOwner = (selectGrid) =>{
    let resultStr = "";
    let owner = "";
    switch (selectGrid.sellStatus) {
        case "01":
            resultStr = "상태 : 빈땅 / 소유자 : 없음"
            break;
        case "02":
            owner = selectGrid.sellOwner.substring(0,4) + Array(selectGrid.sellOwner.length - 4).join("*");
            resultStr = "상태 : 판매아님 / 소유자 : "+ owner
            break;
        case "03":
            owner = selectGrid.sellOwner.substring(0,4) + Array(selectGrid.sellOwner.length - 4).join("*");
            resultStr = "상태 : 판매중 / 소유자 : "+ owner
            break;
    }
    return resultStr;
}


/**
 * cell id 리스트 전체 얻기
 */
export const cellIdListStr = (selectCellList) =>{
    let textList = "";
    for(let i = 0; i < selectCellList.length ; i++){
        textList += selectCellList[i].cellId +" ";
    }
    return textList;
}


/**
 * json maker
 */
export const setGeometryJson = (coordinates) =>{
    return {
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            geometry: {
                type: "MultiPolygon",
                coordinates: coordinates
            },
        }]
    };
}

/**
 * json maker2
 */
export const setGeometryJsonMultiPoint = (coordinates) =>{
    return {
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            geometry: {
                type: "MultiPoint",
                coordinates: coordinates
            },
        }]
    };
}

/**
 * cell id 리스트 전체 얻기
 */
export const cellIdList = (selectCellList) =>{
    let textList = "";
    for(let i = 0; i < selectCellList.length ; i++){
        textList += selectCellList[i] +" ";
    }
    return textList;
}

/**
 * cell id + 위경도 리스트 전체 얻기
 */
export const cellIdAndLatLngListStr = (selectCellList) =>{
    let textList = "";
    for(let i = 0; i < selectCellList.length ; i++){
        textList += selectCellList[i].cellId +" [" +round(selectCellList[i].latitude, 6) +","+ round(selectCellList[i].longitude, 6) +"]\n";
    }
    return textList;
}

/**
 * [가격계산기]
 * 가격계산 = 셀 가격 * 국가코드 가중치
 * @param getCell, landPriceList(가격표)
 * @return int price
 */
export const cellTypePrice = (getCell, countryCode, landPriceList, landusePriceList, countryPriceList) =>{
    let calCellPrice = "";

    //물 혹은 땅 구분은 true false
    if(getCell.water){
        const it = landPriceList.find(item => item.cellCode === "water");
        calCellPrice = parseFloat(it.cellPrice);
    }else{
        const it = landPriceList.find(item => item.cellCode === "land");
        const landuse = getCell.landuse === "" ? 0 : landusePriceList.find(item => item.cellCode === getCell.landuse).cellPrice;
        const waterProof = countryCode === "WATER" ? 0 : countryPriceList.find(item => item.countryCode === countryCode).weight;
        calCellPrice = (parseFloat(it.cellPrice) + parseFloat(landuse)) + waterProof  ;
    }
    return calCellPrice;
}
