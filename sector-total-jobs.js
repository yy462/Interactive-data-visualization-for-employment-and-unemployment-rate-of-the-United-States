const sectorLineChart = d3.select("#sectorLineChart");
const sectorWidth = sectorLineChart.attr("width");
const sectorHight = sectorLineChart.attr("height");
const sectorMargin = {top: 60, right: 10, bottom: 50, left: 50};
const chartWidth = sectorWidth - sectorMargin.left - sectorMargin.right;
const chartHeight = sectorHight - sectorMargin.top - sectorMargin.bottom;

const annotations = sectorLineChart.append("g").attr("id","annotations");
const chartArea = sectorLineChart.append("g").attr("id","points")
                .attr("transform",`translate(${sectorMargin.left},${sectorMargin.top})`);

//legend
const sectorLineChartLegend = d3.select("#sectorLineChartLegend");
const legendArea = sectorLineChartLegend.append("g").attr("id","legend")
                   
const getData = async () => {
const sectorData = await d3.csv("./sector_employment_data.csv");
    
    let allYear = []

    for(let i=0; i<sectorData.length; i++){
        let d = sectorData[i];
        let dashPos = d["Month"].indexOf("-");
        let year = Number(d["Month"].slice(0, dashPos))+2000;
        let monthName = d["Month"].slice(dashPos+1);
        let date = new Date(Date.parse(monthName  +" 1, "+year ));
        d["Month"] = date;
        allYear.push(date)
        
        for(let[key,value] of Object.entries(d)){
            if(key != "Month"){
                d[key] = Number(value.replace(",","") );
            }
        }
    }

    annotations.append("text")
                .text("Year")
                .attr("class", "job-label")
                .attr("text-anchor", "end")
                .attr("transform",`translate(${chartWidth + sectorMargin.left},
                    ${sectorMargin.top+chartHeight+sectorMargin.bottom})`)  
    annotations.append("text")
                .text("Job Number")
                .attr("class", "job-label")
                .attr("transform",`translate(${0},${sectorMargin.top-20})`)    

    //bottom year axis
    const dateExtent = d3.extent(sectorData, d => d["Month"]);
    const dateScale = d3.scaleTime().domain(dateExtent).range([0, chartWidth]);
    let bottomAxis = d3.axisBottom(dateScale)
    let bottomGridlines = d3.axisBottom(dateScale)
                            .tickSize(-chartHeight-10)
                            .tickFormat("")
    annotations.append("g") 
        .attr("class", "x axis")
        .attr("transform",`translate(${sectorMargin.left},${sectorMargin.top+chartHeight})`)
        .call(bottomAxis)
    annotations.append("g")
        .attr("class", "sector-grid")
        .attr("transform",`translate(${sectorMargin.left},${sectorMargin.top+chartHeight})`)    
        .call(bottomGridlines);

    //  left job number Axis
    let sectorExtent = [500,25000]
    let sectorScale = d3.scaleLinear().domain(sectorExtent).range([chartHeight, 0]);
    
    let leftAxis = d3.axisLeft(sectorScale)
    annotations.append("g") 
                .attr("class", "y axis")
                .attr("transform",`translate(${sectorMargin.left},${sectorMargin.top})`)
                .call(leftAxis)
    
    // sector name and color
    const allSectorName = Object.keys(sectorData[0]).filter(d=>d!="Month" && !d.includes("Total"));

    const sectorColors = ["#9eadf3","#49c2ff","#e3da3d","#ffaf4d","#ff6f56","#f3bad2",
    "#d5e2a3","#d5caee","#eb7cc7","#b7d0ff","#9fe0ff","#b6e9e1","#c2eeb3",
    "#c2e33e","#f1dda9","#f2c89d","#ffafa2","#f3bad2","#e9b6f8"]
    const sectorNameScale = d3.scaleOrdinal().domain(allSectorName).range(sectorColors);
    
    const verticalStart = 40
    const verticalGap = 25
    allSectorName.forEach((d,i)=>{
        legendArea.append("line")
                .attr("x1",0)
                .attr("x2",20)
                .attr("y1", verticalStart+i*verticalGap)
                .attr("y2", verticalStart+i*verticalGap)
                .attr("stroke-width",5)
                .attr("stroke",sectorNameScale (d))
        
        legendArea.append("text")
                .attr("class","sectorLine-legend")
                .attr("x",25)
                .attr("y", verticalStart+i*verticalGap)
                .text(d)
                .attr("alignment-baseline","central")
                

    })
    

    const mouseGroup = chartArea.append('g')
    const labelG = mouseGroup.append("g").attr("id","labelG")

    function showAll(){
        mouseGroup.selectAll("#activeRegion").remove()
        allSectorName.forEach(sector=>{
            const sectorKey = sector;
            let lineGen = d3.line().x(d=>dateScale(d["Month"])).y(d=>sectorScale(d[sectorKey]));
            chartArea.append("path")
                    .attr("d", lineGen(sectorData))
                    .attr("stroke", d=>sectorNameScale(sectorKey))
                    .attr("stroke-width", 2)
                    .attr("fill", "none");
        })
    }

    function showSelectedSector(sectorKey){
        let lineGen = d3.line().x(d=>dateScale(d["Month"])).y(d=>sectorScale(d[sectorKey]));
        chartArea.selectAll("path").remove();
        chartArea.selectAll('circle').remove();
        
        //polyline
        chartArea.append("path")
                .attr("d", lineGen(sectorData))
                .attr("stroke", sectorNameScale(sectorKey))
                .attr("stroke-width", 2)
                .attr("fill", "none");

        updateAnimated(sectorKey)
    }

    function updateAnimated(sectorKey){
        //hover vertical line
        mouseGroup.append("line")
                .attr("id","xMarker")
                .attr("fill","none")
                .attr("stroke","#bbb")
                .attr("stroke-width",0.7)
                .attr("y1",0)
                .attr("y2",chartHeight)
                .attr("opacity","0");

        //hover circle marker
        mouseGroup.append("circle")          
                    .attr("id","valueMarker")
                    .attr("fill",sectorNameScale(sectorKey))
                    .style("filter","brightness(0.6)")
                    .attr("r",5)
                    .attr("opacity","0");

        labelG.append("text")
                .attr("id","label-sector")
                .attr("x",0)
                .attr("y",0)               
                .attr("opacity","0");
        labelG.append("text")
                .attr("id","label-value")
                .attr("x",0)
                .attr("y",20)               
                .attr("opacity","0");
        labelG.append("text")
                .attr("id","label-date")
                .attr("x",0)
                .attr("y",40)               
                .attr("opacity","0");
                
        let activeRegion = mouseGroup.append("rect")
                                    .attr("id","activeRegion")
                                    .attr("width",chartWidth)
                                    .attr("height",chartHeight)
                                    .attr("fill","none")
                                    .attr("pointer-events","all");
        
        activeRegion.datum(sectorKey)
                    .on("mousemove", hoverData)  
                    .on("mouseout", leaveData);   
    }

    function hoverData(evt,sectorKey){
        let findDate = d3.bisector(d=>d["Month"]).right;
        let location = d3.pointer(evt);
        let x = location[0];
        let xDate = dateScale.invert(x);
        let index = findDate(sectorData, xDate);
        let d = sectorData[index];

        let xPos = dateScale(d["Month"]);
        let yPos = sectorScale(d[sectorKey]);

        mouseGroup.select("#xMarker").attr("x1",xPos).attr("x2",xPos).attr("opacity","1");
        mouseGroup.select("#valueMarker").attr("cx",xPos).attr("cy",yPos).attr("opacity","1");

        //set label position
        let offsetX = xPos > chartWidth/2 ? -20:20;
        let textAnchor = xPos > chartWidth/2 ? "end":"start";
        let offsetY = yPos < 80 ? 80:-60;
        mouseGroup.select("#labelG")
                  .attr("transform", `translate(${xPos+offsetX},${yPos+offsetY})`);

        //set label text
        labelG.select("#label-sector")
                  .attr("opacity","1")
                  .text(sectorKey )
                  .attr("text-anchor",textAnchor)
        labelG.select("#label-value")
                  .attr("opacity","1")
                  .text("Job Numbers: "+ d[sectorKey])
                  .attr("text-anchor",textAnchor)
        labelG.select("#label-date")
                  .attr("opacity","1")
                  .text("date: "+ (d["Month"].getMonth() + 1) + "/" + d["Month"].getFullYear())
                  .attr("text-anchor",textAnchor)
    }

    function leaveData(){
        mouseGroup.select("#xMarker").attr("opacity","0");
        mouseGroup.select("#valueMarker").attr("opacity","0");
        mouseGroup.select("#label-sector").attr("opacity","0");
        mouseGroup.select("#label-value").attr("opacity","0");
        mouseGroup.select("#label-date").attr("opacity","0");
    }

    // add "show all" button
    d3.select("div#button-bar")
        .append("button")
        .text("Show All")
        .attr("class","sector-name-button")
        .on('click', function(){
            d3.selectAll(".sector-name-button").style("background","none").style("color","#000");
            d3.select(this).style("background","#000").style("color","#fff");
            showAll();
        })
        .on("mouseover", function () {
            d3.select(this).style("background", "#000")
                            .style("color", "#fff");
        })

    // add buttons for each sector
    let sectorBtn =[];
    allSectorName.forEach(d=>{
        let sector = d3.select("div#button-bar")
                        .append("button")
                        .text(d)
                        .attr("class","sector-name-button")
                        .on('click', setBtnColor)
        sectorBtn.push(sector);
    });
 
    sectorBtn.forEach(d=>{
        d.on("mouseover", function () {
            let text = d3.select(this).text();
            d3.select(this).style("background", sectorNameScale(text))
                            .style("color", "#000");
        })
        d.on("mouseout", function () {
            d3.select(this).style("background", "none")
        })
    });

    function setBtnColor(){
        let text = d3.select(this).text();
        d3.selectAll(".sector-name-button")
            .style("background","none")
            .style("color","#000");
        d3.select(this)
            .style("background",sectorNameScale(text))
            showSelectedSector(text);
    }

    //set default view to be "show all"
    let firstBtn = d3.selectAll(".sector-name-button")
                        .filter((d, i)=> i == 0)
    firstBtn.style("background","#000").style("color","#fff");
    showAll();

    
}

getData();

