/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import powerbiVisualsApi from "powerbi-visuals-api";
import * as d3 from "d3";
import * as jQuery from "jquery";

type Selection<T> = d3.Selection<any, T, any, any>;

import IViewport = powerbiVisualsApi.IViewport;

import * as SVGUtil from "powerbi-visuals-utils-svgutils";
import IMargin = SVGUtil.IMargin;
import translate = SVGUtil.manipulation.translate;

import { TornadoChartDataView } from "./interfaces";
import { TornadoChart } from "./TornadoChart";

export class TornadoChartScrolling {
    public isScrollable: boolean;
    public get scrollViewport(): IViewport {
        return {
            height: this.viewport.height,
            width: this.viewport.width
                - ((this.isYScrollBarVisible && this.isScrollable) ? TornadoChart.ScrollBarWidth : 0)
        };
    }

    private static ScrollBarMinLength: number = 15;
    private static ExtentFillOpacity: number = 0.125;
    private static DefaultScaleMultipler: number = 1;

    private isYScrollBarVisible: boolean;
    private brushGraphicsContextY: Selection<any>;
    private scrollYBrush: d3.BrushBehavior<any> = d3.brushY();

    private getRoot: () => Selection<any>;
    private getViewport: () => IViewport;
    private getPrefferedHeight: () => number;

    private get root(): Selection<any> {
        return this.getRoot();
    }

    private get viewport(): IViewport {
        return this.getViewport();
    }

    constructor(
        getRoot: () => Selection<any>,
        getViewport: () => IViewport,
        getMargin: () => IMargin,
        getPrefferedHeight: () => number,
        isScrollable: boolean) {

        this.getRoot = getRoot;
        this.getViewport = getViewport;
        this.isScrollable = isScrollable;
        this.getPrefferedHeight = getPrefferedHeight;
    }

    public renderY(data: TornadoChartDataView, onScroll: () => object): void {
        this.isYScrollBarVisible = this.isScrollable
            && this.getPrefferedHeight() > this.viewport.height
            && this.viewport.height > 0
            && this.viewport.width > 0;

        this.brushGraphicsContextY = this.createOrRemoveScrollbar(this.isYScrollBarVisible, this.brushGraphicsContextY, "y brush");
        if (!this.isYScrollBarVisible) {
            onScroll.call(this, jQuery.extend(true, {}, data), 0, 1);
            return;
        }

        const scrollSpaceLength: number = this.viewport.height;
        const extentData: any = this.getExtentData(this.getPrefferedHeight(), scrollSpaceLength);
        const getEvent = () => require("d3-selection").event;

        const onRender = (selection: any = getEvent() && getEvent().selection, wheelDelta: number = 0) => {
            const position = selection || extentData.value;

            if (wheelDelta !== 0) {
                // Handle mouse wheel manually by moving the scrollbar half of its size
                const halfScrollsize: number = (position[1] - position[0]) / 2;
                position[0] += (wheelDelta > 0) ? halfScrollsize : -halfScrollsize;
                position[1] += (wheelDelta > 0) ? halfScrollsize : -halfScrollsize;

                if (position[0] < 0) {
                    const offset: number = -position[0];
                    position[0] += offset;
                    position[1] += offset;
                }
                if (position[1] > scrollSpaceLength) {
                    const offset: number = position[1] - scrollSpaceLength;
                    position[0] -= offset;
                    position[1] -= offset;
                }
                // Update the scroll bar accordingly and redraw
                this.scrollYBrush.move(this.brushGraphicsContextY, position);
                this.brushGraphicsContextY.select(".selection").attr("y", position[0]);
            }

            const scrollPosition: number[] = extentData.toScrollPosition(position, scrollSpaceLength);
            onScroll.call(this, jQuery.extend(true, {}, data), scrollPosition[0], scrollPosition[1]);
        };

        this.scrollYBrush.extent([[0, 0], [TornadoChart.ScrollBarWidth, this.viewport.height]]);

        this.renderScrollbar(
            this.scrollYBrush,
            this.brushGraphicsContextY,
            this.viewport.width,
            extentData.value[1],
            onRender
        );

        onRender();
    }

    private createOrRemoveScrollbar(isVisible: boolean, brushGraphicsContext: Selection<any>, brushClass: string) {
        if (isVisible && this.isScrollable) {
            return brushGraphicsContext || this.root.append("g").merge(this.root).classed(brushClass, true);
        }

        return brushGraphicsContext ? void brushGraphicsContext.remove() : undefined;
    }

    private renderScrollbar(
        brush: d3.BrushBehavior<any>,
        brushGraphicsContext: Selection<any>,
        brushX: number,
        scrollbarHight: number,
        onRender: (d3Selection: any, value: number) => void
    ): void {

        const d3Event = () => require("d3-selection").event;
        brush.on("brush", () => {
            const d3Selection: Selection<any> = d3Event().selection;
            window.requestAnimationFrame(() => onRender(d3Selection, 0));
        });
        this.root.on("wheel", () => {
            const d3Selection: Selection<any> = d3Event().selection;

            if (!this.isYScrollBarVisible) return;
            const wheelEvent: any = d3Event(); // Casting to any to avoid compilation errors
            onRender(d3Selection, wheelEvent.deltaY);
        });

        brushGraphicsContext
            .attr("transform", translate(brushX, 0))
            .attr("drag-resize-disabled", "true");

        brushGraphicsContext
            .call(brush)
            .call(brush.move, [0, scrollbarHight]);

        // Disabling the zooming feature
        brushGraphicsContext
            .selectAll(".handle")
            .remove();

        brushGraphicsContext
            .select(".background")
            .remove();

        brushGraphicsContext
            .select(".overlay")
            .remove();

        brushGraphicsContext
            .selectAll(".selection")
            .style("fill-opacity", TornadoChartScrolling.ExtentFillOpacity)
            .style("cursor", "default")
            .style("display", null);
    }

    private getExtentData(svgLength: number, scrollSpaceLength: number): any {
        let value: number = scrollSpaceLength * scrollSpaceLength / svgLength;

        const scaleMultipler: number = TornadoChartScrolling.ScrollBarMinLength <= value
            ? TornadoChartScrolling.DefaultScaleMultipler
            : value / TornadoChartScrolling.ScrollBarMinLength;

        value = Math.max(value, TornadoChartScrolling.ScrollBarMinLength);

        const toScrollPosition = (extent: number[], scrollSpaceLength: number): number[] => {
            let scrollSize: number = extent[1] - extent[0];
            const scrollPosition: number = extent[0] / (scrollSpaceLength - scrollSize);

            scrollSize *= scaleMultipler;

            const start: number = (scrollPosition * (scrollSpaceLength - scrollSize));
            const end: number = (start + scrollSize);

            return [start / scrollSpaceLength, end / scrollSpaceLength];
        };

        return { value: [0, value], toScrollPosition: toScrollPosition };
    }

    public clearData(): void {
        if (this.brushGraphicsContextY) {
            this.brushGraphicsContextY
                .selectAll("*")
                .remove();
        }
    }
}
