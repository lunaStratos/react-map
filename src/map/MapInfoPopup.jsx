import React, {useEffect, useState} from 'react';
import {allPrice, cellIdList, cellIdListStr, CellStatusAndOwner, firstCellAddress} from "./MapUtility";
import Button from '@material-ui/core/Button';
import "../assets/css/MapInfo.css"
import {Delete, ZoomOut, ZoomIn, SelectAll} from "@material-ui/icons";
import {round} from "@turf/turf";

export default function MapInfoPopup(props) {

    const {
        selectedCellList,
        onSelectedReset,
        zoomLevel,
        selectMode,
        onSelectedModeChange,
        onMapZoomChange
    } = props;

    const textAreaStyle = {
        resize: 'none', /* 사용자 임의 변경 불가 */
    };

    return (
        <div>

            <div className="map-info">

                <h2><img src={require('../assets/icon/info.png').default} style={{width: '17px'}}/> Info </h2>

                <div className="address"> <img src={require('../assets/icon/address.png').default} style={{width: '18px'}}/> ADDRESS </div>
                <div style={{ whiteSpace: 'pre-wrap' }}></div>
                <div><img src={require('../assets/icon/compass.png').default} /> 위경도 : { selectedCellList.boxSelect.quadKeys.length !== 0 ?
                    round(parseFloat(selectedCellList.boxSelect.coordinates[0][0][0]), 6) : ""} / {selectedCellList.boxSelect.coordinates.length !== 0 ?  round(parseFloat(selectedCellList.boxSelect.coordinates[0][0][1]), 6): "0"}
                </div>
                <div><img src={require('../assets/icon/tile.png').default} /> selected tile cnt : {selectedCellList.boxSelect.quadKeys.length !== 0 ? selectedCellList.boxSelect.quadKeys.length : selectedCellList.groupSelect.quadKeys.length}</div>
                <div><img src={require('../assets/icon/dollar.png').default} /> selected tile price :  $</div>
                <div><img src={require('../assets/icon/tiles.png').default} /> selected tile ID</div>
                <div>
                    <textArea value="" rows="5" style={textAreaStyle} readOnly>
                        {cellIdList(selectedCellList.boxSelect.quadKeys.length !== 0 ? selectedCellList.boxSelect.quadKeys: selectedCellList.groupSelect.quadKeys)}
                    </textArea>
                </div>
                <div>
                    <img src={require('../assets/icon/dallor.png').default}/> selected tile price : {}$
                </div>
                <div>
                    <img src={require('../assets/icon/status.png').default} /> selected tile info

                </div>

                {/*초기화 버튼*/}
                { zoomLevel >= 17 && ((selectedCellList.boxSelect.quadKeys).length !== 0 || (selectedCellList.groupSelect.quadKeys).length !== 0) ?  <Button variant="contained" color="default" onClick={() => onSelectedReset()} startIcon={<Delete />}>초기화</Button> : <></>}
                {

                    {
                    "select" :<Button variant="contained" color="default" onClick={() => onSelectedModeChange("delete")} startIcon={<Delete />}>삭제하기</Button>,
                    "delete" :<Button variant="contained" color="default" onClick={() => onSelectedModeChange("select")} startIcon={<SelectAll />}>선택하기</Button>,
                    "none" : <></>
                    }[selectMode.mode]

                }
                {/*초기화 버튼*/}
                <Button variant="contained" color="default" onClick={() => onMapZoomChange("zoomOut")} startIcon={<ZoomOut />}>Zoom Out</Button>
                <Button variant="contained" color="default" onClick={() => onMapZoomChange("ZoomIn")} startIcon={<ZoomIn />}>Zoom In</Button>
            </div>

        </div>
    );
}
