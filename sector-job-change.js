//sector grid
const sectorGrid = d3.select("#sectorGrid");
const sectorGridWidth = sectorGrid.attr("width");
const sectorGridHeight = sectorGrid.attr("height");
const sectorGridMargin = {top: 70, right: 10, bottom: 10, left: 50};
const sectorChartWidth = sectorGridWidth - sectorGridMargin.left - sectorGridMargin.right;
const sectorChartHeight = sectorGridHeight - sectorGridMargin.top - sectorGridMargin.bottom;
const sectorChartAxisOffset = 10;
const changeSqaureSize = 5.5;
const changeSqaureRound = 2;

const sectorGridAnnotations = sectorGrid.append("g").attr("id","sectorGridAnnotations")
const sectorBackCol = sectorGrid.append("g").attr("id","sectorBackCol")
                                .attr("transform",`translate(${sectorGridMargin.left},${sectorGridMargin.top})`);
const sectorChartArea = sectorGrid.append("g").attr("id","sectorChart")
                                .attr("transform",`translate(${sectorGridMargin.left},${sectorGridMargin.top})`);
                                
sectorChartArea.append("rect").attr("x",-changeSqaureSize*2).attr("y",0)
                .attr("width",sectorChartWidth+changeSqaureSize*2)
                .attr("height",sectorChartHeight+changeSqaureSize*2)
                .attr("fill","#000")
                .attr("opacity",0.03);



//compete animation
const sectorComp = d3.select("#sectorCompete");
const sectorCompWidth = sectorComp.attr("width");
const sectorCompHeight = sectorComp.attr("height");
const sectorCompMargin = {top: 40, right: 50, bottom: 10, left: 50};
const sectorBarWidth = sectorCompWidth - sectorCompMargin.left - sectorCompMargin.right;
const sectorBarHeight = sectorCompHeight - sectorCompMargin.top - sectorCompMargin.bottom;
const sectorBarAxisOffset = 10;

const sectorBarAnnotations = sectorComp.append("g").attr("id","sectorBarAnnotations")
const sectorBarGrids = sectorComp.append("g").attr("id","sectorBarGrids")
                                .attr("transform",`translate(${sectorCompMargin.left},${sectorCompMargin.top})`);
const sectorBarArea = sectorComp.append("g").attr("id","sectorBar")
                                .attr("transform",`translate(${sectorCompMargin.left},${sectorCompMargin.top})`);


const getSectorData = async ()=>{
    //load data
    const sectorData = await d3.csv("./sector_employment_data.csv");

    let allYear = []
    let sectorChangeData = [];
    let allSectors=[];
    let getSectorName = false;
    for(let i=1; i<sectorData.length; i++){

        let d = sectorData[i];
        let dashPos = d["Month"].indexOf("-");
        let year = Number(d["Month"].slice(0, dashPos))+2000;
        let monthName = d["Month"].slice(dashPos+1);
        let date = new Date(Date.parse(monthName  +" 1, "+year ));

        allYear.push(date)
    
        let dPrev = sectorData[i-1]
        let sectorChange = []
        
        for(let[key,value] of Object.entries(d)){
            
            if(key.includes("Total")) continue;
            if(key != "Month"){
                value = (Number(d[key].replace(",",""))-Number(dPrev[key].replace(",","")))
                        /Number(d[key].replace(",",""));
                sectorChange.push({
                    "name" :key, 
                    "change": value.toFixed(4)*100,
                    "value":Number(d[key].replace(",",""))
                });  
                if(!getSectorName )allSectors.push(key)
            }
        }
        getSectorName=true;

        //sort the change rate
        sectorChange.sort(function(a,b){
            return a.change -b.change ;
        })
        
        //find the item closest to zero
        let firstAboveZero= sectorChange.length;
        let found = false;
        sectorChange.forEach((item,index)=>{
            if(!found && item.change>=0){
                firstAboveZero = index;
                found = true;
            }
            
        })
        sectorChange.forEach((d,i)=>{
            sectorChangeData.push({
                "absoluteRank":i,
                "date":date,
                "sector": d.name, 
                "change":d.change, 
                "rank":i-firstAboveZero,
                "value":d.value
            })
        })
    }


    /* grid
    --------------------------------------------------------------------------------------------------------
    */
    const yearExtent = d3.extent(sectorChangeData, d=>d.date)
    const yearScale = d3.scaleTime().domain(yearExtent).range([0,sectorChartWidth]);

    const topYearAxis = d3.axisTop(yearScale)
    const annualBottomGridlines = d3.axisTop(yearScale)
                                    .tickSize(-sectorChartWidth -sectorChartAxisOffset)
                                    .tickFormat("");
    sectorGridAnnotations.append("g")
                        .attr("class", "year sector-axis")
                        .attr("transform",`translate(${sectorGridMargin.left-sectorChartAxisOffset},${sectorGridMargin.top})`)
                        .call(topYearAxis)
    sectorGridAnnotations.append("g")
                        .attr("class", "year sector-grid")
                        .attr("transform",`translate(${sectorGridMargin.left-sectorChartAxisOffset},${sectorGridMargin.top})`)
                        .call(annualBottomGridlines)
    sectorGridAnnotations.append("text")
                        .attr("class", "sector-grid-label")
                        .text("Year")
                        .attr("alignment-baseline","baseline")
                        .attr("text-anchor","end")
                        .attr("transform",`translate(${sectorGridWidth-sectorGridMargin.right},${sectorGridMargin.top-8})`)
    sectorGridAnnotations.append("text")
                        .attr("class", "sector-grid-label")
                        .text("#Ranking")
                        .attr("alignment-baseline","baseline")
                        .attr("text-anchor","start")
                        .attr("transform",`translate(${sectorChartAxisOffset},${sectorGridMargin.top-8})`)
                      

    const rankExtent = [-20,20]
    const rankScale = d3.scaleLinear().domain(rankExtent).range([sectorChartHeight,0]);
    const leftChangeAxis = d3.axisLeft(rankScale)
    sectorGridAnnotations.append("g")
                        .attr("class", "rank sector-axis")
                        .attr("transform",`translate(${sectorGridMargin.left-sectorChartAxisOffset},${sectorGridMargin.top})`)
                        .call(leftChangeAxis)

    let allChange = [];
    sectorChangeData.forEach(d=>{
        allChange.push(d["change"])  
    })
                  
    const rankColors = ["#5c74eb","#49c2ff","#e3da3d","#ffaf4d","#ff6f56","#df3b82"]
    const rankColorscale = d3.scaleQuantile()
                                .domain(allChange)
                                .range( rankColors)
    // draw color legend
    const sectorColorLegend = rankColorscale.quantiles();
    sectorGridAnnotations.append("text")
                        .text("Change rate of number of jobs")
                        .attr("font-size","15px")
                        .attr("x", 1200)
                        .attr("y",15)
                        .attr("text-anchor", "end")
 
    rankColors.forEach((d,i)=>{
        sectorGridAnnotations.append("rect")
                            .attr("x", 1250+i*50)
                            .attr("y",0)
                            .attr("width",15)
                            .attr("height",15)
                            .attr("fill",d)
        sectorGridAnnotations.append("text")
                            .attr("font-size","11px")   
                            .text(()=>{
                            if(i==0) return ("< "+sectorColorLegend[0])
                            else if(i==sectorColorLegend.length)
                                return ("> "+sectorColorLegend[sectorColorLegend.length-1])
                            else return (sectorColorLegend[i-1]+"-"+sectorColorLegend[i])
                            })
                            .attr("x",1250+i*50)
                            .attr("y",30)
                            .attr("text-anchor", "middle")
                                            
    })

    
    //back column
    sectorBackCol.selectAll("rect.changeCol").data(allYear)
                .join("rect")
                .attr('class',"changeCol")
                .attr("fill", "#eaeaea")
                .attr("x", d => yearScale(d))
                .attr("y", 0)
                .attr("width", changeSqaureSize)
                .attr("height", sectorChartHeight)
                .attr("rx",changeSqaureRound)
                .attr("transform",`translate(${-changeSqaureSize*1.5},0)`)
                .attr("opacity",0)
                .on("mouseover", hoverSectorCol)
                .on("mouseout", leaveSectorCol) 

    sectorChartArea.selectAll("rect.changeSquare").data(sectorChangeData)
                .join("rect")
                .attr('class',"changeSquare")
                .attr("fill", d=>d["change"] == 0? "#979797": rankColorscale(d["change"]))
                .attr("stroke","#000")
                .attr("stroke-width",0)
                .attr("x", d => yearScale(d["date"]))
                .attr("y", d => rankScale(d["rank"]))
                .attr("width", changeSqaureSize)
                .attr("height", changeSqaureSize)
                .attr("rx",changeSqaureRound)
                .attr("transform",`translate(${-changeSqaureSize*1.5},${-changeSqaureSize})`)
                .on("mouseover", hoverSectorSqu)  
                .on("mouseout", leaveSectorSqu)  
    
    let sectorTextLayer = sectorGrid.append("g")
                                    .attr("id", "sectorTextBox")
                                    .attr("transform",`translate(${sectorGridMargin.left},${sectorGridMargin.top})`);
    let sectorTitleBox = sectorTextLayer.append("rect")
                                        .attr("id", "sectorSquareBox")
                                        .attr("height", 18)
                                        .style("fill", "#fff")
                                        .style("opacity", 0);
    let sectorSubBox = sectorTextLayer.append("rect")
                                        .attr("id", "sectorSquareBox")
                                        .attr("height", 60)
                                        .style("fill", "#000")
                                        .style("opacity", 0);

    let label1 = sectorTextLayer.append("text").attr("class", "sectorTitlelabel");
    let label2 = sectorTextLayer.append("text").attr("class", "sectorSublabel");
    let label3 = sectorTextLayer.append("text").attr("class", "sectorSublabel");
    let label4 = sectorTextLayer.append("text").attr("class", "sectorSublabel");
    sectorTextLayer.selectAll("text.sectorTitlelabel")
                    .style("fill", "#000")
                    .attr("alignment-baseline", "middle");
    sectorTextLayer.selectAll("text.sectorSublabel")
                    .style("fill", "#fff")
                    .attr("alignment-baseline", "middle");

    let boxWidth = 0;

    //set tooptip text
    //first line is sector
    //second line is race
    function setLabelText(d, x, y) {
        const sector = label1.text(d.sector);
        label2.text("Month: " + (d.date.getMonth()+1) +"/"+d.date.getFullYear());
        label3.text("Total jobs: " + d.value);
        label4.text("Changed: " + (d.change).toFixed(2) +"%");

        //set box width based on string length
        let len = sector.text().length  > 20 ? sector.text().length : 20;
        boxWidth = len * 8;d

        //handle edge case so that tooltips for dots close to boundary don't get cropped
        let offsetY = y < 40 ? 40 : 10;
        let offsetX = x > 1500 ? -180 : 10;

        label1.attr("x",5).attr("y", 10);
        label2.attr("x", 5).attr("y", 30);
        label3.attr("x", 5).attr("y", 48);
        label4.attr("x", 5).attr("y", 66);

        sectorTitleBox.attr("x",  0)
                        .attr("y", 0)
                        .attr("width", boxWidth)
                        .style("opacity", 0.8);
        sectorSubBox.attr("x",  0)
                        .attr("y", 18)
                        .attr("width", boxWidth)
                        .style("opacity", 0.8);

        sectorTextLayer.attr("transform",
            `translate(${x+offsetX+sectorGridMargin.left},
            ${y+offsetY+sectorGridMargin.top})`);
    }

    // remove tooltip
    function clearTooptip() {
        sectorTitleBox.style("opacity", 0);
        sectorSubBox.style("opacity", 0);
        label1.text("");
        label2.text("");
        label3.text("");
        label4.text("");
    }

    
    function hoverSectorCol(event,d){
        d3.select(this)
            .transition()
            .duration(200)
            .attr("opacity", 1)
    }
    function leaveSectorCol(event,d){
        d3.select(this)
            .transition()
            .duration(200)
            .attr("opacity", 0)
    }

    function hoverSectorSqu(event,d){
        points=[]
        d3.selectAll("rect.changeSquare")
            .join("rect")
            .attr("stroke-width",otherSqu=>{
                if(d.sector == otherSqu.sector){
                    points.push(otherSqu)
                    return 2
                }
                else return 0
            })

        let lineGen = d3.line()
                        .x( d => yearScale(d["date"]) )
                        .y( d => rankScale(d["rank"]))
                        .curve(d3.curveLinear);

        sectorChartArea.append("path")
            .attr("class","sectorLine")
            .datum(points)
            .attr("fill", "none")   // using attr here, style would work too
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", lineGen)
            .attr("transform",`translate(${-changeSqaureSize},${-changeSqaureSize/2})`);
                        

        const backCol = d3.selectAll("rect.changeCol")
        .join("rect")
        .attr("opacity",d=>
            yearScale(d) == d3.select(this).attr("x") ?
            1:0
        );

        let x = Number(d3.select(this).attr("x"));
        let y = Number(d3.select(this).attr("y"));
        setLabelText(d, x, y)
    }

    function leaveSectorSqu(event,d){
        d3.selectAll(".sectorLine").remove()
        d3.selectAll("rect.changeSquare").attr("stroke-width",0)

        clearTooptip();
    }

    /* bar animation
    --------------------------------------------------------------------------------------------------------
    */
    const sectorColors = ["#9eadf3","#49c2ff","#e3da3d","#ffaf4d","#ff6f56","#f3bad2",
                            "#d5e2a3","#d5caee","#eb7cc7","#b7d0ff","#9fe0ff","#b6e9e1","#c2eeb3",
                            "#c2e33e","#f1dda9","#f2c89d","#ffafa2","#f3bad2","#e9b6f8"]
    const sectorScale = d3.scaleOrdinal().domain(allSectors).range(sectorColors);
    
    //left ranking axis
    const racingRankExtent = [1,allSectors.length];
    const racingRankScale = d3.scaleLinear().domain(racingRankExtent).range([sectorBarHeight,0]);
    const leftAbsRankAxis = d3.axisLeft(racingRankScale).tickFormat(d => allSectors.length-d);
    sectorBarAnnotations.append("g")
                        .attr("class", "change bar-axis")
                        .attr("transform",`translate(${sectorCompMargin.left-sectorBarAxisOffset},${sectorCompMargin.top})`)
                        .call(leftAbsRankAxis)
                        
 
    //axis label
    sectorBarAnnotations.append("text")
                        .attr("class", "bar-axis-label")
                        .text("Monthly Change Rate")
                        .attr("text-anchor", "end")
                        .attr("alignment-baseline","hanging")
                        .attr("transform",`translate(${ sectorCompWidth-sectorGridMargin.right-sectorBarAxisOffset},${10})`)
    sectorBarAnnotations.append("text")
                        .attr("class", "bar-axis-label")
                        .text("#Ranking")
                        .attr("text-anchor", "start")
                        .attr("alignment-baseline","hanging")
                        .attr("transform",`translate(${0},${10})`)
    
    //animation interval
    const interval = 1200;
    const intervalPause = 600;

    let sectorRacingData={};
    
    allSectors.forEach(d=>{
        sectorRacingData[d]=[];
    })

    sectorChangeData.forEach(d=>{
        (sectorRacingData[d.sector]).push(d)
    })

    let currentDate =0;
    let currentChangeData=[];


    function updateChangeScale(currentChangeData){
        let changeExtent = d3.extent(currentChangeData, d=>d.change)
        let min = Math.floor(changeExtent [0]*10)/10;
        let max = Math.ceil(changeExtent [1]*10)/10;
        let changeScale = d3.scaleLinear().domain([min,max]).range([0,sectorBarWidth-sectorBarAxisOffset]);
        return changeScale;
    }

    function updateChangeAxis(changeScale){
        //vertical grid
        let changeDomain = changeScale.domain();
        let changeLabel = [];
        changeLabel.push(changeDomain[0]);
        if(-0.2>changeDomain[0]) changeLabel.push(-0.2);
        changeLabel.push(0);
        if(0.2<changeDomain[1]) changeLabel.push(0.2);
        changeLabel.push(changeDomain[1]);

        sectorBarGrids.selectAll("line.change-bar-axis").data(changeLabel)
            .join( enter => enter.append('line')
                            .attr('class','change-bar-axis')
                            .style("stroke", "#dddddd")
                            .style("stroke-width", 1)
                            .attr("x1", d=>changeScale(d))
                            .attr("y1", 10)
                            .attr("x2",  d=>changeScale(d))
                            .attr("y2", sectorBarHeight+20)
                            .attr("opacity", 0)
                            .call( enter => enter.transition().attr('opacity',1) ),
                update => update.call( update => update.transition().duration(interval-intervalPause)
                                .attr("x1", d=>changeScale(d))
                                .attr("x2",  d=>changeScale(d))
                    ),
        exit => exit.call( exit => exit.transition().attr('opacity',0).remove() ) ); 
        
        //vertical grid labels
        sectorBarGrids.selectAll("text.change-bar-label").data(changeLabel)
            .join( enter => enter.append('text')
                            .attr('class','change-bar-label')
                            .text(d=>d+'%')
                            .attr("x", d=>changeScale(d))
                            .attr("y", 0)
                            .attr("opacity", 0)
                            .attr("text-anchor","middle")
                            .call( enter => enter.transition()
                                                .attr('opacity',1) ),
                update => update.call( update => update.transition().duration(interval-intervalPause)
                                .text(d=>d+'%')
                                .attr("x", d=>changeScale(d))
                            ),
                exit => exit.call( exit => exit.transition().attr('opacity',0).remove() ) ); 
    }

    function updateRaceYear(currentChangeData){
        sectorBarAnnotations.selectAll("text.racing-year-label").data([currentChangeData[0]])
        .join( 
        enter => enter.append('text')
                    .attr('class','racing-year-label')
                    .text(d=>d.date.getMonth()+1+"/"+d.date.getFullYear())
                    .attr("x", sectorCompWidth-sectorGridMargin.right-sectorBarAxisOffset)
                    .attr("y", sectorCompHeight-10)
                    .attr("opacity", 0)
                    .attr("text-anchor","end")
                    .call( enter => enter.transition()
                                        .attr('opacity',1) ),
        update => update.call( update => update.transition().duration(interval-intervalPause)
                        .text(d=>d.date.getMonth()+1+"/"+d.date.getFullYear())
                    ),
        exit => exit.call( exit => exit.transition().attr('opacity',0).remove() ) ); 
    }

    function updateBars(changeScale,currentChangeData){
        //racing bars
        sectorBarArea.selectAll("rect.racingBar").data(currentChangeData)
        .join( enter => enter.append('rect')
                            .attr('class','racingBar')
                            .attr("fill", d=>sectorScale(d.sector))
                            .attr("x", 0)
                            .attr("y", d=> racingRankScale (d["absoluteRank"]))
                            .attr("height",  20)
                            .attr("width", d=>changeScale(d["change"]))
                            .attr("opacity", 0.7)
                            .attr("transform", `translate(0,-10)`)
                            .call( enter => enter.transition().duration(interval-intervalPause)
                            ),
                update => update.call( update => update.transition().duration(interval-intervalPause)
                                .attr("y", d=> racingRankScale (d["absoluteRank"]))
                                .attr("width", d=>changeScale(d["change"]))
                            ),
                exit => exit.call( exit => exit.transition().attr('opacity',0).remove() ) ); 

          //sector name labels
          sectorBarArea.selectAll("text.sector-name-label").data(currentChangeData)
          .join( enter => enter.append('text')
                            .attr('class','sector-name-label')
                            .text(d=>d["sector"])
                            .attr("x", 10)
                            .attr("y", d=> racingRankScale (d["absoluteRank"]))
                            .attr("opacity", 0)
                            .attr("text-anchor","start")
                            .attr("alignment-baseline","central")
                            .call( enter => enter.transition()
                                                .attr('opacity',1) ),
                update => update.call( update => update.transition().duration(interval-intervalPause)
                                .text(d=>d["sector"])
                                .attr("y", d=> racingRankScale (d["absoluteRank"]))
                            ),
                exit => exit.call( exit => exit.transition().attr('opacity',0).remove() ) ); 

      //sector job number labels
      sectorBarArea.selectAll("text.sector-num-label").data(currentChangeData)
      .join( enter => enter.append('text')
                        .attr('class','sector-num-label')
                        .text(d=>d3.format(',')(d["value"]))
                        .attr("x", d=>changeScale(d["change"])+5)
                        .attr("y", d=> racingRankScale (d["absoluteRank"]))
                        .attr("opacity", 0)
                        .attr("text-anchor","start")
                        .attr("alignment-baseline","central")
                        .call( enter => enter.transition().duration(interval-intervalPause)
                                            .attr('opacity',1) ),
            update => update.call( update => update.transition()
                            .text(d=>d3.format(',')(d["value"]))
                            .attr("x", d=>changeScale(d["change"])+5)
                            .attr("y", d=> racingRankScale (d["absoluteRank"]))
                        ),
            exit => exit.call( exit => exit.transition().attr('opacity',0).remove() ) ); 
    }                    

    
    
    let yearRange = [yearExtent[0].getFullYear(),yearExtent[1].getFullYear()];
    for(let y=yearRange[0];y<=yearRange[1];y++){
        if(y%5==0) {
            d3.select("div#sector-compete-btn")
            .append("button")
            .text( y )
            .on("click", function(){updateBarsToYear( y )})
        }
    }

    d3.select("div#sector-compete-btn")
            .append("button")
            .text( "Reset" )
            .on("click", function(){reset()})

    let tick = function(){
        currentDate ++;
        update();
    }
    let changeRacing = setInterval( tick, interval );

    function updateBarsToYear(year){
        currentDate = (year - yearExtent[0].getFullYear()-1)*12+1;
        update();
        window.clearTimeout(changeRacing);
        changeRacing= setInterval( tick, interval )
    }

    function update(){
        currentChangeData=[];
        if(currentDate>=sectorData.length) clearInterval(changeRacing);
        allSectors.forEach((d,i)=>{
            currentChangeData.push(sectorRacingData[allSectors[i]][currentDate]);
        })
        let changeScale = updateChangeScale(currentChangeData);
        updateBars(changeScale,currentChangeData);
        updateChangeAxis(changeScale);
        updateRaceYear(currentChangeData);
    }

    function reset(){
        currentDate = 0;
        update();
    }

}

getSectorData();
