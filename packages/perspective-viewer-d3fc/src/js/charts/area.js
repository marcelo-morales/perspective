/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import {axisFactory} from "../axis/axisFactory";
import {chartSvgFactory} from "../axis/chartFactory";
import {axisSplitter} from "../axis/axisSplitter";
import {AXIS_TYPES} from "../axis/axisType";
import {areaSeries} from "../series/areaSeries";
import {seriesColors} from "../series/seriesColors";
import {splitAndBaseData} from "../data/splitAndBaseData";
import {colorLegend} from "../legend/legend";
import {filterData} from "../legend/filter";
import withGridLines from "../gridlines/gridlines";

import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";

function areaChart(container, settings) {
    const data = splitAndBaseData(settings, filterData(settings));

    const color = seriesColors(settings);
    const legend = colorLegend()
        .settings(settings)
        .scale(color);

    const series = fc.seriesSvgRepeat().series(areaSeries(settings, color).orient("vertical"));

    const xAxis = axisFactory(settings)
        .excludeType(AXIS_TYPES.linear)
        .settingName("crossValues")
        .valueName("crossValue")(data);
    const yAxisFactory = axisFactory(settings)
        .settingName("mainValues")
        .valueName("mainValue")
        .excludeType(AXIS_TYPES.ordinal)
        .orient("vertical")
        .include([0])
        .paddingStrategy(hardLimitZeroPadding());

    // Check whether we've split some values into a second y-axis
    const splitter = axisSplitter(settings, data).color(color);

    const yAxis1 = yAxisFactory(splitter.data());

    // No grid lines if splitting y-axis
    const plotSeries = splitter.haveSplit() ? series : withGridLines(series).orient("vertical");

    const chart = chartSvgFactory(xAxis, yAxis1)
        .axisSplitter(splitter)
        .plotArea(plotSeries);

    chart.yNice && chart.yNice();

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xAxis.scale);

    const toolTip = nearbyTip()
        .settings(settings)
        .xScale(xAxis.scale)
        .yScale(yAxis1.scale)
        .color(color)
        .data(data);

    if (splitter.haveSplit()) {
        // Create the y-axis data for the alt-axis
        const yAxis2 = yAxisFactory(splitter.altData());
        chart.altAxis(yAxis2);
        // Give the tooltip the information (i.e. 2 datasets with different scales)
        toolTip.data(splitter.data()).altDataWithScale({yScale: yAxis2.scale, data: splitter.altData()});
    }

    // render
    container.datum(splitter.data()).call(zoomChart);
    container.call(toolTip);
    container.call(legend);
}
areaChart.plugin = {
    type: "d3_y_area",
    name: "Y Area Chart",
    max_size: 25000
};

export default areaChart;