import React, {useRef, useEffect, useState} from 'react';
import * as d3 from 'd3';
import { select, curveBasis} from 'd3';
import '../assets/css/D3AreaGraph.css'
import styled from 'styled-components';

const Wrapper = styled.svg`
    background-color: white;
  `;

function D3AreaGraph(){


      const [nowX, setNowX] = useState("")
      const [now, setNow] = useState("")
      
      var series = ["2017"];
   
      var dataset = [ 
          {'1': 9, '2':19, '3':29, '4':39, '5':29, '6':19, '7':9, '8':7, '9':17, '10':27, '11':17, '12':7},
          {'1':17, '2':27, '3':37, '4':27, '5':17, '6':7,  '7':9, '8':19, '9':29, '10':19, '11':9, '12':0}];

      var keys = [1,2,3,4,5,6,7,8,9,10,11, 12]

      const searchNearNumber = (data, target) =>{
        var near = 0; 
        var min = 100; // 해당 범위에서 가장 큰 값 
        var abs = 0; // 여기에 가까운 수 '20'이 들어감 
        var index = 0;
        for (var i = 0; i < data.length; i++) { 
            abs = ((data[i] - target) < 0) ? -(data[i] - target) : (data[i] - target); 
            if (abs < min) { 
                min = abs; //MIN 
                near = data[i] // 가까운 값 
                index = i
            } 
        } 
        console.log(target + ' 가까운 값: ' + near + ' / index: '+index); // 21 가까운 값: 20
        return index
      }




      var data = [];

      dataset.forEach(function(d, i) {
        data[i] = keys.map(function(key) { return {x: key, y: d[key]}; })
      });

      var margin = {left: 20, top: 10, right: 10, bottom: 20};

      const svgRef = useRef();
      const resultRef = useRef()

      var width  = 1000 - margin.left - margin.right;
      var height = 200 - margin.top  - margin.bottom;

      var xScale = d3.scalePoint()//scaleBand() scaleOrdinal
        .domain(keys)
        .rangeRound([0, width]);

      var yScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, function(d) { return d3.max(keys, function(key) { return d[key];});})])
        .nice()
        .range([height, 0]);

      var colors = d3.scaleOrdinal(d3.schemeCategory10);


      useEffect(() => {

        const svg = select(svgRef.current);
        const svgG = svg.append("g").join(
          enter => enter.append("g").attr("class", "new")
        ).attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
         
        svgG.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale)
            
        );

        svgG.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .ticks(5)
           
           );

        const line = d3.area()
        .x(function(d) { 
          console.log("=> "+d)
          return xScale(d.x); })    // → x축 
        .y1(function(d) { return yScale(d.y); })   // ↑ y축 최고 
        .y0(yScale(0))                            // y축 바닥
        //.curve(curveBasis)

        const line2 = d3.area()
        .x(function(d) { 
          console.log("=> "+d)
          return xScale(d.x); })    // → x축 
        .y1(function(d) { return yScale(d.y); })   // ↑ y축 최고 
        .y0(yScale(0))                            // y축 바닥
        .curve(curveBasis)

        const area = d3.area()
        .x(function(d) {
            return xScale(d.x)
        })
        .y1(function(d) {
            return yScale(d.y); 
        })
        .y0(yScale(0));

        

        // 툴팁
        var tooltip = d3.select("body")
        .append("div")
        .attr("class", "toolTip")
        .style("display", "none");


        //==============

        const lineG2 = svgG.append("g")
          .selectAll("g") 
          .data([data[1]])
          .style("fill", "#666B6E")
          .enter().append("g");

        // 선그리기 
        lineG2.append("path")
        .attr("class", "lineAreaChart1")
        .style("stroke", function(d, i) { return colors( series); })
        .attr("d", function(d, i) {return line2(d); })
        .style("fill", "#7BA0B5")
        .style("opacity", "0.5")
        
        

        //======================

        
        const lineG = svgG.append("g")
          .selectAll("g") 
          .data([data[0]])
          .style("fill", "#666B6E")
          .enter().append("g");

        // 선그리기 
        lineG.append("path")
        .attr("class", "lineAreaChart1")
        .style("stroke", function(d, i) { return colors( series); })
        .attr("d", function(d, i) {return line(d); })
        .style("fill", "#7BA0B5")
        .style("opacity", "0.5")

        // 점찍기 
        lineG.selectAll("dot")
        .data(function(d) {return d })
        .enter().append("circle")
            .attr("r", 3)
            .attr("cx", function(d) { return xScale(d.x) })
            .attr("cy", function(d) { return yScale(d.y);})
            .attr('fill', '#8CC1FF')
            .on("mouseover", function() { tooltip.style("display", null); })
            .on("mouseout",  function() { tooltip.style("display", "none"); })
            .on("click",  function(d) { 
                d3.select("line")
                .attr("x1", xScale(d.x)) //
                .attr("y1", 0)
                .attr("x2", xScale(d.x)) //
                .attr("y2", 170)
            })
            .on("mousemove", function(event, d) {
                tooltip.style("left", (event.pageX+10)+"px");
                tooltip.style("top",  (event.pageY-10)+"px");
                tooltip.html("month. " + d.x + "<br/>" + "data value : " + d.y);
            });        

        //====================================


        //라인바
        const border = 2;
          //바
          var lines = svgG.append("rect")
          .attr("x1", xScale(border)) //
          .attr("y1", 0)
          .attr("x2", xScale(border)) //
          .attr("y2", 170)
          .style("width", "20")
          .style("height", "170")
          .style("fill", "#FFFFFF")
          .style("stroke", "#ACACAC")
          .style("stroke-width", "3px")
          .style("box-shadow", "shadow")
          .style("opacity", "0.7")
          .attr("rx", 5)         
          .attr("ry", 5)
          .attr("transform", "translate(" + xScale(border) + "," + 0 + ")")

        //===================================

        // 마우스 드래그 
        var dragHandler = d3.drag()
        .on("drag", function (event) {
          
            //스크롤 제한 
            if (xScale(1) <= event.x && event.x <=xScale(12)){
              console.log(event)
                d3.select(this)
                .attr("x1", event.x)
                .attr("x2", event.x)
                .attr("transform", "translate(" + event.x + "," + 0 + ")")
                //searchNearNumber
                //좌표계
                console.log()
                

                const coordinater = d3.pointer(event)

                var domain = xScale.domain(); 
                console.log(' / '+domain)
                var range = xScale.range();
                console.log(range)
                var rangePoints = d3.range(range[0], range[1], xScale.step())
                console.log(rangePoints)
                const nowIndex = searchNearNumber(rangePoints, parseInt(event.x))

                const idx = domain[nowIndex]
                setNowX(dataset[0][idx])
                setNow(idx)
         

                tooltip.style("left", coordinater[0] +"px");
                tooltip.style("top",  coordinater[1]+"px");
                tooltip.html("month. " + "" + "<br/>" + "data value : " + "");
                tooltip.style("display", null);
            }
      
          
        })
        .on("end", function(event) {
          tooltip.style("display", "none");
        });

        dragHandler(svg.selectAll("rect"));

        

      }, []);
      


    return (
        <>
        <h3>SVG 영역</h3>
           <Wrapper width="1000" height="200" ref={svgRef}></Wrapper>
           <p></p>
           x축 값 : <span>{nowX}</span>
           <p></p>
           x index 값 : <span>{now}</span>
        </>
    )
}

export default D3AreaGraph