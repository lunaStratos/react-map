import {createAction, handleActions} from 'redux-actions'

const SETGRIDMAP = "map/SETGRIDMAP";
const SETGIRDBUYGRIDMAP = "map/SETGIRDBUYGRIDMAP";
const SETSELECTPOSITION = "map/SETSELECTPOSITION";
const SETSELECTPOSITIONRESULT = "map/SETSELECTPOSITIONRESULT";

const SETSELECTMULTIGRID = "map/SETSELECTMULTIGRID";
const SETCENTERLATLNG = "map/SETCENTERLATLNG";
const SETSELECTADDRESS = "map/SETSELECTADDRESS";
const SETSEARCHADDRESS = "map/SETSEARCHADDRESS";


const initialState = {
    gridMap : [],
    gridBuyMap : [],
    selectPosition: {lat: 37.553067, lng: 126.608257}, 
    selectPositionResult: {
        country: "ko",
        land: true,
        water: false
    }, 
    selectMultiGrid: [],
    centerLatLng: {
        latitude: "",
        longitude: ""
    },
    selectAddress: { // 최초 선택 그리드의 주소 얻어오기
        address: "",
        shortAddress: "",
        latitude: "",
        longitude: "",
        isReal : true
    },
    searchAddress : { // 검색시 사용 주소
        address: "",
        shortAddress: "",
        latitude: "",
        longitude: "",
        isReal : true
    }
}

export const setGridMap = createAction(SETGRIDMAP);
export const setGridBuyMap = createAction(SETGIRDBUYGRIDMAP);
export const setSelectPosition = createAction(SETSELECTPOSITION);
export const setSelectPositionResult = createAction(SETSELECTPOSITIONRESULT);
export const setSelectMultiGrid = createAction(SETSELECTMULTIGRID);
export const setCenterLatLng = createAction(SETCENTERLATLNG);
export const setSelectAddress = createAction(SETSELECTADDRESS);
export const setSearchAddress = createAction(SETSEARCHADDRESS);



const MapStore = handleActions(
    {
        [setGridMap]: (state, {payload : gridMap}) => ({...state, gridMap: gridMap}),
        [setGridBuyMap]: (state, {payload : gridBuyMap}) => ({...state, gridBuyMap: gridBuyMap}),
        [setSelectPosition]: (state, {payload : selectPosition}) => ({...state, selectPosition: selectPosition}),
        [setSelectPositionResult]: (state, {payload : selectPositionResult}) => ({...state, selectPositionResult: selectPositionResult}),
        [setSelectMultiGrid]: (state, {payload : selectMultiGrid}) => ({...state, selectMultiGrid: selectMultiGrid}),
        [setCenterLatLng]: (state, {payload : centerLatLng}) => ({...state, centerLatLng: centerLatLng}),
        [setSelectAddress]: (state, {payload : selectAddress}) => ({...state, selectAddress: selectAddress}),
        [setSearchAddress]: (state, {payload : searchAddress}) => ({...state, searchAddress: searchAddress}),
    },
    initialState
);
export default MapStore;
