var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// tooltipの処理
const tooltip = d3.select('#main')
    .append("div")
    .classed("tooltip", true)
    .style("opacity", 0) // start invisible

var simulation = d3.forceSimulation()
    .velocityDecay(0.4)
    .force("link",
        d3.forceLink()
        // id( )でインデックスにするkey名を指定する．
        .id(function (d) {
            return d.id;
        })
        // リンクの長さ
        .distance(function (d) {
            return 100;
        }))
    // ノード間のクーロン力(非接触作用力)
    .force("charge", d3.forceManyBody().strength(-160))
    // 全てのノードの質量中心の座標
    .force("center", d3.forceCenter(width / 2, height / 2))

    .force("collision", d3.forceCollide(30));

//"svg"にZoomイベントを設定
var zoom = d3.zoom()
    .scaleExtent([1 / 4, 4])
    .on('zoom', SVGzoomed);

svg.call(zoom);

//"svg"上に"g"をappendしてdragイベントを設定
var g = svg.append("g")
    .call(d3.drag()
        .on('drag', SVGdragged))

function SVGzoomed() {
    g.attr("transform", d3.event.transform);
}

function SVGdragged(d) {
    d3.select(this).attr('cx', d.x = d3.event.x).attr('cy', d.y = d3.event.y);
};

// jsonのデータをグローバルに
var jsondata;
var node_g;
// ブランドのリスト
// var brandlist = [];

// jsonファイルの読み込み
d3.json("./data/idea_data.json")
    .then(function (graph) {
        // jsondata = graph;
        // 通常処理（グラフの描画など）
        var link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
            .attr("stroke", "#999") //輪郭線の色指定追加
            .attr("stroke-width", function (d) {
                return Math.sqrt(d.value);
            })
            .call(d3.drag() //無いとエラーに
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        var node = g.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(graph.nodes)
            .enter().append("g")

            // .on('click', set_sidedata)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // node circleの定義
        node.append('circle')
            .attr('r', 20)
            // .attr('fill', '#4ea1d3')
            .attr("fill", function(d) { return d3.schemePastel1[d.group]; })
            //カーソルが合ったら色を変える
            .on('mouseover', function(d) {
                d3.select(this).style('opacity', '0.8')
                // tooltip
                // tooltip.transition()
                //     .duration(300)
                //     .style("opacity", 1); // show the tooltip
                // tooltip.html("【cluster: " + d.cluster_id + "】<br>" + cluster_info[d.cluster_id][0] + "<br>" + cluster_info[d.cluster_id][1]+ "<br>" + cluster_info[d.cluster_id][2])
                // .style("left", (d3.event.pageX - d3.select('.tooltip').node().offsetWidth - 5) + "px")
                // .style("top", (d3.event.pageY - d3.select('.tooltip').node().offsetHeight) + "px");
            })
            //カーソルが外れたら元の色に
            .on('mouseout', function () {
                // d3.select(this).attr("fill", function(d) { return color(d.cluster_id); }).style('opacity', '1.0')
                // tooltip
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
            })
            .on("click", clicked);
            
        // ノードのグローバル化
        node_g = node;
        //node textの定義
        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('fill', 'black')
            .style('pointer-events', 'none')
            .attr('font-size', function (d) {
                return '12px';
            })
            .text(function (d) {
                return d.id;
            });
        

        simulation
            .nodes(graph.nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(graph.links);

        function ticked() {
            link
                .attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            node
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                })
                .attr('transform', function (d) {
                    return 'translate(' + d.x + ',' + d.y + ')'
                }) //nodesの要素が連動して動くように設定
        }

        // 入力補完候補の単語リスト
        // jsondata.nodes.filter(function (d) {
        //     brandlist.push(d.id);
        // })
    })
    .catch(function (error) {
        // エラー処理
        console.log("Not found");
    });

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function transform(d) {
    return d3.zoomIdentity
        .translate(0.8 * width / 2, height / 2) //一旦中央に
        .scale(1.5) //1.5倍でZoomIn
        .translate(-d.x, -d.y); //指定nodeの座標
}

// nodeクリックで色を変える処理
function clicked(d) {

    d3.selectAll(".selected").classed("selected", false);
    d3.selectAll(".conected").classed("conected", false);
    d3.selectAll("line").classed("linkSelected", false);

    d3.select(this).classed("selected", true);

}
