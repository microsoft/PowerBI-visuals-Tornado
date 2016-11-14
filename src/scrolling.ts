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

module powerbi.extensibility.visual {

    // d3
    import Selection = d3.Selection;
    import UpdateSelection = d3.selection.Update;

    import SVGUtil = powerbi.visuals.SVGUtil;
    import IMargin = powerbi.visuals.IMargin;

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
        private scrollYBrush: any = d3.svg.brush();

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

        public renderY(data: TornadoChartDataView, onScroll: () => {}): void {
            this.isYScrollBarVisible = this.isScrollable
                && this.getPrefferedHeight() > this.viewport.height
                && this.viewport.height > 0
                && this.viewport.width > 0;

            this.brushGraphicsContextY = this.createOrRemoveScrollbar(this.isYScrollBarVisible, this.brushGraphicsContextY, 'y brush');

            if (!this.isYScrollBarVisible) {
                onScroll.call(this, jQuery.extend(true, {}, data), 0, 1);
                return;
            }

            let scrollSpaceLength: number = this.viewport.height;
            let extentData: any = this.getExtentData(this.getPrefferedHeight(), scrollSpaceLength);

            let onRender = (wheelDelta: number = 0) => {
                let position: number[] = this.scrollYBrush.extent();
                if (wheelDelta !== 0) {

                    // Handle mouse wheel manually by moving the scrollbar half of its size
                    let halfScrollsize: number = (position[1] - position[0]) / 2;
                    position[0] += (wheelDelta > 0) ? halfScrollsize : -halfScrollsize;
                    position[1] += (wheelDelta > 0) ? halfScrollsize : -halfScrollsize;

                    if (position[0] < 0) {
                        let offset: number = -position[0];
                        position[0] += offset;
                        position[1] += offset;
                    }
                    if (position[1] > scrollSpaceLength) {
                        let offset: number = position[1] - scrollSpaceLength;
                        position[0] -= offset;
                        position[1] -= offset;
                    }

                    // Update the scroll bar accordingly and redraw
                    this.scrollYBrush.extent(position);
                    this.brushGraphicsContextY.select('.extent').attr('y', position[0]);
                }
                let scrollPosition: number[] = extentData.toScrollPosition(position, scrollSpaceLength);
                onScroll.call(this, jQuery.extend(true, {}, data), scrollPosition[0], scrollPosition[1]);
                this.setScrollBarSize(this.brushGraphicsContextY, extentData.value[1], true);
            };

            let scrollYScale: d3.scale.Ordinal<any, any> = d3.scale.ordinal().rangeBands([0, scrollSpaceLength]);
            this.scrollYBrush.y(scrollYScale).extent(extentData.value);

            this.renderScrollbar(
                this.scrollYBrush,
                this.brushGraphicsContextY,
                this.viewport.width,
                onRender);

            onRender();
        }

        private createOrRemoveScrollbar(isVisible, brushGraphicsContext, brushClass) {
            if (isVisible && this.isScrollable) {
                return brushGraphicsContext || this.root.append("g").classed(brushClass, true);
            }

            return brushGraphicsContext ? void brushGraphicsContext.remove() : undefined;
        }

        private renderScrollbar(brush: d3.svg.Brush<any>,
            brushGraphicsContext: Selection<any>,
            brushX: number,
            onRender: (number) => void): void {

            brush.on("brush", () => window.requestAnimationFrame(() => onRender(0)));
            this.root.on('wheel', () => {
                if (!this.isYScrollBarVisible) return;
                let wheelEvent: any = d3.event; // Casting to any to avoid compilation errors
                onRender(wheelEvent.deltaY);
            });

            brushGraphicsContext.attr({
                "transform": SVGUtil.translate(brushX, 0),
                "drag-resize-disabled": "true" /*disables resizing of the visual when dragging the scrollbar in edit mode*/
            });

            brushGraphicsContext.call(brush); /*call the brush function, causing it to create the rectangles   */
            /* Disabling the zooming feature */
            brushGraphicsContext.selectAll(".resize").remove();
            brushGraphicsContext.select(".background").remove();
            brushGraphicsContext.selectAll(".extent").style({
                "fill-opacity": TornadoChartScrolling.ExtentFillOpacity,
                "cursor": "default",
            });
        }

        private setScrollBarSize(brushGraphicsContext: Selection<any>, minExtent: number, isVertical: boolean): void {
            brushGraphicsContext.selectAll("rect").attr(isVertical ? "width" : "height", TornadoChart.ScrollBarWidth);
            brushGraphicsContext.selectAll("rect").attr(isVertical ? "height" : "width", minExtent);
        }

        private getExtentData(svgLength: number, scrollSpaceLength: number): any {
            let value: number = scrollSpaceLength * scrollSpaceLength / svgLength;

            let scaleMultipler: number = TornadoChartScrolling.ScrollBarMinLength <= value
                ? TornadoChartScrolling.DefaultScaleMultipler
                : value / TornadoChartScrolling.ScrollBarMinLength;

            value = Math.max(value, TornadoChartScrolling.ScrollBarMinLength);

            let toScrollPosition = (extent: number[], scrollSpaceLength: number): number[] => {
                let scrollSize: number = extent[1] - extent[0];
                let scrollPosition: number = extent[0] / (scrollSpaceLength - scrollSize);

                scrollSize *= scaleMultipler;

                let start: number = (scrollPosition * (scrollSpaceLength - scrollSize));
                let end: number = (start + scrollSize);

                return [start / scrollSpaceLength, end / scrollSpaceLength];
            };

            return { value: [0, value], toScrollPosition: toScrollPosition };
        }

        public clearData(): void {
            if (this.brushGraphicsContextY)
                this.brushGraphicsContextY.selectAll("*").remove();
        }
    }
}
