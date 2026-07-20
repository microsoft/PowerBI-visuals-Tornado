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

import DataView = powerbiVisualsApi.DataView;
import DataViewValueColumn = powerbiVisualsApi.DataViewValueColumn;
import DataViewValueColumns = powerbiVisualsApi.DataViewValueColumns;
import DataViewValueColumnGroup = powerbiVisualsApi.DataViewValueColumnGroup;

import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;

import { ClickEventType, assertColorsMatch, d3Click, renderTimeout } from "powerbi-visuals-utils-testutils";

import { TornadoData } from "./TornadoData";
import { TornadoChartBuilder } from "./TornadoChartBuilder";
import { areColorsEqual, isColorAppliedToElements, getRandomUniqueHexColors, getSolidColorStructuralObject } from "./helpers/helpers";
import { TornadoChartPoint, TornadoChartSeries, TornadoChartDataView } from "./../src/interfaces";
import { TornadoChartSettingsModel } from "../src/TornadoChartSettingsModel";

describe("TornadoChart", () => {
    let visualBuilder: TornadoChartBuilder,
        dataViewBuilder: TornadoData,
        dataView: DataView,
        MaxSeries: number = 2;
    const defaultAwaitTime = 2000;

    beforeEach(() => {
        visualBuilder = new TornadoChartBuilder(1000, 500);
        dataViewBuilder = new TornadoData();

        dataView = dataViewBuilder.getDataView();
    });

    describe("DOM tests", () => {
        it("svg element created", () => {
            expect(document.body.contains(visualBuilder.scrollable[0])).toBeTruthy();
        });

        it("update", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const renderedCategories: number = Array.from(visualBuilder.scrollable[0]
                    .querySelectorAll(".columns > *")).length / 2;

                expect(renderedCategories).toBeGreaterThan(0);
                expect(renderedCategories)
                    .toBeLessThan(dataView.categorical!.categories![0].values.length + 1);

                done();
            });
        });

        it("update with empty data", (done) => {
            dataView.categorical!.values![0].values = [];
            visualBuilder.updateRenderTimeout(dataView, () => {
                const renderedCategories: number = Array.from(visualBuilder.categories).length;
                expect(renderedCategories).toBe(0);
                done();
            });
        });

        it("Clear catcher covers the whole visual", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const clearCatcher: HTMLElement = visualBuilder.scrollable[0]
                    .firstElementChild!
                    .querySelector(".clearCatcher")!;

                expect(clearCatcher).toBeDefined();

                done();
            });
        });

        it("Categories tooltip is rendered correctly", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const categoriesTooltip1: Element = visualBuilder.scrollable[0].querySelectorAll(".category-title")![0];
                const categoriesTooltip2: Element = visualBuilder.scrollable[0].querySelectorAll(".category-title")![1];
                const categoriesTooltip3: Element = visualBuilder.scrollable[0].querySelectorAll(".category-title")![2];

                expect(categoriesTooltip1.textContent).toBe("Australia");
                expect(categoriesTooltip2.textContent).toBe("Canada");
                expect(categoriesTooltip3.textContent).toBe("France");

                done();
            });
        });

        it("Category labels should be tailored if their length is big", (done) => {
            const longText: string = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

            dataViewBuilder.valuesCategory = dataViewBuilder.valuesCategory.map(() => longText);

            dataView = dataViewBuilder.getDataView();

            visualBuilder.updateRenderTimeout(dataView, () => {
                Array.from(visualBuilder.categories).forEach((element: Element, i: number) => {
                    expect((<any>element).getBBox().width)
                        .toBeLessThan(visualBuilder.viewport.width / 3 * 2);
                
                    expect(element.querySelector("text.category-text")!.textContent).toContain("...");
                });

                done();
            });
        });

        it("Middle axis of Tornado should have correct position", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const axisRightPosition: number = Math.round(
                    visualBuilder.axis[0].getBoundingClientRect().right);

                const column1RightPosition: number = Math.round(
                    visualBuilder.columns[0].getBoundingClientRect().right);

                expect(axisRightPosition).toBe(column1RightPosition);

                done();
            });
        });

        it("Data labels should support different formats", (done) => {
            dataView.categorical!.values![0].source.format = "$#,0.00;($#,0.00);$#,0.00";
            dataView.categorical!.values![1].source.format = "0.00 %;-0.00 %;0.00 %";

            visualBuilder.updateRenderTimeout(dataView, () => {
                let labelsText = Array.from(visualBuilder.labels).flatMap((label) => Array.from(label.querySelectorAll("text.label-text")));

                let labelsTextWith$ = labelsText.filter((element) => element.textContent!.includes("$"));

                expect(labelsTextWith$.length).toEqual(labelsText.length / 2);

                let labelsTextWithPercent = labelsText.filter((element) => element.textContent!.includes("%"));

                expect(labelsTextWithPercent.length).toEqual(labelsText.length / 2);

                done();
            });
        });
    });

    describe("parseSeries", () => {
        beforeEach(() => {
            visualBuilder.update(dataView);
        });

        it("every argument is null", () => {
            callParseSeriesAndExpectExceptions(null, null, null, null, null);
        });

        it("every argument is undefined", () => {
            callParseSeriesAndExpectExceptions(undefined, undefined, undefined, undefined, undefined);
        });

        it("index is negative, other arguments are null", () => {
            callParseSeriesAndExpectExceptions(null, null, -5, null, null);
        });

        it("every argument is correct", () => {
            const index: number = 0,
                series: TornadoChartSeries = callParseSeriesAndExpectExceptions(
                    dataView,
                    dataView.categorical!.values!,
                    index,
                    true,
                    dataView.categorical!.values!.grouped()[index])!;

            expect(series.categoryAxisEnd).toBeDefined();
            expect(series.name).toBeDefined();

            expect(series.selectionId).toBeDefined();
            expect(series.selectionId).not.toBeNull();
            expect((<ISelectionId>series.selectionId).getKey()).toBeDefined();

            expect(series.categoryAxisEnd).toBeDefined();
        });

        function callParseSeriesAndExpectExceptions(
            dataView: DataView | null | undefined,
            dataViewValueColumns: DataViewValueColumns | null | undefined,
            index: number | null | undefined,
            isGrouped: boolean | null | undefined,
            columnGroup: DataViewValueColumnGroup | null | undefined): TornadoChartSeries | undefined {

            let series: TornadoChartSeries | undefined = undefined;
            expect(() => {
                series = visualBuilder.parseSeries(
                    dataView!,
                    dataViewValueColumns!,
                    index!,
                    isGrouped!,
                    columnGroup!);
            }).not.toThrow();

            return series;
        }
    });

    describe("Converter tests", () => {
        let tornadoChartDataView: TornadoChartDataView,
            tornadoChartSeries: TornadoChartSeries[];

        beforeEach(() => {
            visualBuilder.update(dataView);

            tornadoChartDataView = visualBuilder.converter(dataView, visualBuilder.instance.formattingSettings);
            tornadoChartSeries = tornadoChartDataView.series;
        });

        it("tornadoChartDataView is defined", () => {
            expect(tornadoChartDataView).toBeDefined();
            expect(tornadoChartDataView).not.toBeNull();
        });

        describe("DataPoints", () => {
            it("dataPoints are defined", () => {
                expect(tornadoChartDataView.dataPoints).toBeDefined();
                expect(tornadoChartDataView.dataPoints).not.toBeNull();
                expect(tornadoChartDataView.dataPoints.length).toBeGreaterThan(0);
            });

            it("identity is defined with key", () => {
                tornadoChartDataView.dataPoints.forEach((dataPoint: TornadoChartPoint) => {
                    expect(dataPoint.identity).toBeDefined();
                    expect(dataPoint.identity).not.toBeNull();

                    expect((<ISelectionId>dataPoint.identity).getKey()).toBeDefined();
                    expect((<ISelectionId>dataPoint.identity).getKey()).not.toBeNull();
                });
            });
        });

        describe("Series", () => {
            it("series are defined", () => {
                expect(tornadoChartSeries).toBeDefined();
                expect(tornadoChartSeries).not.toBeNull();
            });

            it("identity is defined with key", () => {
                tornadoChartSeries.forEach((series: TornadoChartSeries) => {
                    expect(series.selectionId).not.toBeNull();
                    expect((<ISelectionId>series.selectionId).getKey()).toBeDefined();
                });
            });
        });
    });

    describe("Format settings test", () => {
        describe("Data colors", () => {
            it("colors", (done) => {
                let colors: string[] = getRandomUniqueHexColors(dataView.categorical!.values!.length);

                dataView.categorical!.values!.forEach((column: DataViewValueColumn, index: number) => {
                    column.source.objects = {
                        dataPoint: {
                            fill: getSolidColorStructuralObject(colors[index])
                        }
                    };
                });

                visualBuilder.updateRenderTimeout(dataView, () => {
                    // Column fills are gradient references, so the configured color lives in the gradient stops
                    const stopColors: string[] = Array.from(visualBuilder.gradients)
                        .flatMap((gradient: SVGElement) => Array.from(gradient.querySelectorAll("stop")))
                        .map((stop: Element) => stop.getAttribute("stop-color") || "");

                    colors.forEach((color: string, index: number) => {
                        const colorApplied: boolean = stopColors.some((stopColor: string) => areColorsEqual(stopColor, color));

                        if (index < MaxSeries) {
                            expect(colorApplied).toBeTruthy();
                        } else {
                            expect(colorApplied).toBe(false);
                        }
                    });

                    done();
                });
            });
        });

        describe("Data labels", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    labels: {
                        show: true
                    }
                };
            });

            //Await usage
            it("show", () => {
                visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, async () => {
                    await delay(defaultAwaitTime);
                    visualBuilder.labelText.forEach((element) => {
                        expect(document.body.contains(element)).toBeTruthy();
                    });
                    (dataView.metadata.objects!).labels.show = false;
                });

                visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, async () => {
                    visualBuilder.update(dataView);
                    await delay(defaultAwaitTime);
                    visualBuilder.labelText.forEach((element) => {
                        expect(document.body.contains(element)).toBeFalsy();
                    });
                });
            });

            it("inside fill", () => {
                const color: string = "#AABBCC";

                dataViewBuilder.valuesValue1 = dataViewBuilder.valuesValue1.map(x => 0);
                dataViewBuilder.valuesValue2 = dataViewBuilder.valuesValue2.map(x => 1);
                dataViewBuilder.valuesValue3 = dataViewBuilder.valuesValue3.map(x => 2);
                dataView = dataViewBuilder.getDataView();

                dataView.metadata.objects = {
                    labels: {
                        insideFill: getSolidColorStructuralObject(color)
                    }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                let labelsOneSideLength: number = visualBuilder.labelText.length / 2;

                Array.from(visualBuilder.labelText).forEach((element: Element, index: number) => {
                    assertColorsMatch(
                        getComputedStyle(element).getPropertyValue("fill"),
                        color,
                        index < labelsOneSideLength);
                });
            });

            it("outside fill", () => {
                const color: string = "#ABCDEF";

                dataViewBuilder.valuesValue1 = dataViewBuilder.valuesValue1.map(() => 0);
                dataViewBuilder.valuesValue2 = dataViewBuilder.valuesValue2.map(() => 1);
                dataViewBuilder.valuesValue3 = dataViewBuilder.valuesValue3.map(() => 2);
                dataView = dataViewBuilder.getDataView();

                dataView.metadata.objects = {
                    labels: {
                        outsideFill: getSolidColorStructuralObject(color)
                    }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                let labelsOneSideLength: number = visualBuilder.labelText.length / 2;

                Array.from(visualBuilder.labelText).forEach((element: Element, index: number) => {
                    assertColorsMatch(
                        getComputedStyle(element).getPropertyValue("fill"),
                        color,
                        index >= labelsOneSideLength);
                });
            });

            it("font size", () => {
                const fontSize: number = 23,
                    fontSizeInPt: string = "30.6667px";

                (dataView.metadata.objects!).labels.fontSize = fontSize;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                Array.from(visualBuilder.labelText).forEach((element: Element) => {
                    expect(getComputedStyle(element).getPropertyValue("font-size")).toBe(fontSizeInPt);
                });
            });

            describe("displayFormat (label content)", () => {
                const getAllLabelTexts = (): string[] =>
                    Array.from(visualBuilder.labels)
                        .flatMap((label) => Array.from(label.querySelectorAll("text.label-text")))
                        .map((element) => element.textContent || "");

                beforeEach(() => {
                    // Use a plain numeric format so the value part never contains a "%"
                    dataView.categorical!.values!.forEach((column: DataViewValueColumn) => {
                        column.source.format = "#,0";
                    });
                });

                it("Value mode renders the value without a percentage", () => {
                    (dataView.metadata.objects!).labels.displayFormat = "value";
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const texts: string[] = getAllLabelTexts();
                    expect(texts.length).toBeGreaterThan(0);
                    texts.forEach((text: string) => expect(text).not.toContain("%"));
                });

                it("Percentage mode renders a percentage", () => {
                    (dataView.metadata.objects!).labels.displayFormat = "percentage";
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const texts: string[] = getAllLabelTexts();
                    expect(texts.length).toBeGreaterThan(0);
                    expect(texts.some((text: string) => text.trim().endsWith("%"))).toBeTrue();
                });

                it("Value (%) mode renders value and percentage together", () => {
                    (dataView.metadata.objects!).labels.displayFormat = "valueAndPercentage";
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const texts: string[] = getAllLabelTexts();
                    expect(texts.length).toBeGreaterThan(0);
                    expect(texts.some((text: string) => text.includes("(") && text.includes("%)"))).toBeTrue();
                });
            });
        });

        describe("Group", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    categories: {
                        show: true
                    }
                };
            });

            //Await usage
            it("show", async () => {
                visualBuilder.updateRenderTimeout(dataView, async () => {
                    await delay(defaultAwaitTime);
                    visualBuilder.categoryText.forEach((element) => {
                        expect(document.body.contains(element)).toBeTruthy();
                    });
                    (dataView.metadata.objects!).categories.show = false;
                });

                visualBuilder.updateRenderTimeout(dataView, async () => {
                    await delay(defaultAwaitTime);
                    visualBuilder.categoryText.forEach((element) => {
                        expect(document.body.contains(element)).toBeFalsy();
                    });
                });
            });

            it("color", () => {
                const color: string = "#ABCDEF";

                (dataView.metadata.objects!).categories.fill = getSolidColorStructuralObject(color);
                visualBuilder.updateFlushAllD3Transitions(dataView);

                Array.from(visualBuilder.categoryText).forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("fill"), color);
                });
            });
        });

        describe("Negative bars", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    negativeBars: {
                        show: true
                    }
                };
                // Ensure at least one negative value exists so negative-bar styling can be verified
                (<number[]>dataView.categorical!.values![0].values)[0] = -500;
            });

            it("show", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(dataView.metadata.objects!["negativeBars"].show).toBe(true);
                    // Negative bars are rendered, so all columns remain present
                    const renderedWhenShown: number = visualBuilder.columns.length;
                    expect(renderedWhenShown).toBeGreaterThan(0);
                    done();
                });
            });

            it("hidden when show is off", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const renderedWhenShown: number = visualBuilder.columns.length;

                (dataView.metadata.objects!).negativeBars.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // Hiding negative bars should render fewer columns than when they are shown
                expect(visualBuilder.columns.length).toBeLessThan(renderedWhenShown);
            });

            it("fill", (done) => {
                const color: string = "#AABB11";
                (dataView.metadata.objects!).negativeBars.fill = getSolidColorStructuralObject(color);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    // The negative bar's gradient should be painted with the configured fill color
                    const stopColorMatches: boolean = Array.from(visualBuilder.gradients)
                        .some((gradient: SVGElement) => Array.from(gradient.querySelectorAll("stop"))
                            .some((stop: Element) => areColorsEqual(stop.getAttribute("stop-color") || "", color)));
                    expect(stopColorMatches).toBe(true);
                    done();
                });
            });

            it("transparency", (done) => {
                (dataView.metadata.objects!).negativeBars.transparency = 50;

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(dataView.metadata.objects!["negativeBars"].transparency).toBe(50);
                    // At least one negative column should have its fill-opacity reduced to 0.5
                    const opacities: string[] = Array.from(visualBuilder.columns)
                        .map((element: Element) => getComputedStyle(element).getPropertyValue("fill-opacity"));
                    expect(opacities).toContain("0.5");
                    done();
                });
            });

            it("borderColor", (done) => {
                const color: string = "#112233";
                (dataView.metadata.objects!).negativeBars.borderColor = getSolidColorStructuralObject(color);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(dataView.metadata.objects!["negativeBars"].borderColor).toBeDefined();
                    // At least one negative column should use the configured border color as its stroke
                    const strokeMatches: boolean = Array.from(visualBuilder.columns)
                        .some((element: Element) => areColorsEqual(
                            getComputedStyle(element).getPropertyValue("stroke"), color));
                    expect(strokeMatches).toBe(true);
                    done();
                });
            });

            it("borderWidth", (done) => {
                (dataView.metadata.objects!).negativeBars.borderWidth = 5;

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(dataView.metadata.objects!["negativeBars"].borderWidth).toBe(5);
                    // At least one negative column should render with the configured border width
                    const widthMatches: boolean = Array.from(visualBuilder.columns)
                        .some((element: Element) => getComputedStyle(element).getPropertyValue("stroke-width") === "5px");
                    expect(widthMatches).toBe(true);
                    done();
                });
            });

            it("cornerRadius", () => {
                // Ensure a negative bar with non-zero width (the most negative value maps to zero width)
                (<number[]>dataView.categorical!.values![0].values)[0] = -300;
                (<number[]>dataView.categorical!.values![0].values)[1] = -900;

                const getPaths = (): string[] => Array.from(visualBuilder.columns)
                    .map((element: Element) => element.getAttribute("d") || "");

                visualBuilder.updateFlushAllD3Transitions(dataView);
                const before: string[] = getPaths();

                (dataView.metadata.objects!).negativeBars.cornerRadius = 10;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const after: string[] = getPaths();

                // Rounding the corners of negative bars changes their rendered path
                expect(after).not.toEqual(before);
            });
        });

        describe("Bar appearance", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    barAppearance: {}
                };
            });

            it("borderColor", (done) => {
                const color: string = "#CCDDEE";
                (dataView.metadata.objects!).barAppearance.borderColor = getSolidColorStructuralObject(color);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    // At least one column should render with the configured border color as its stroke
                    const strokeMatches: boolean = Array.from(visualBuilder.columns)
                        .some((element: Element) => areColorsEqual(
                            getComputedStyle(element).getPropertyValue("stroke"), color));
                    expect(strokeMatches).toBe(true);
                    done();
                });
            });

            it("borderWidth", (done) => {
                (dataView.metadata.objects!).barAppearance.borderWidth = 3;

                visualBuilder.updateRenderTimeout(dataView, () => {
                    // At least one column should render with the configured stroke width
                    const widthMatches: boolean = Array.from(visualBuilder.columns)
                        .some((element: Element) => getComputedStyle(element).getPropertyValue("stroke-width") === "3px");
                    expect(widthMatches).toBe(true);
                    done();
                });
            });

            it("cornerRadius", () => {
                const getPaths = (): string[] => Array.from(visualBuilder.columns)
                    .map((element: Element) => element.getAttribute("d") || "");

                visualBuilder.updateFlushAllD3Transitions(dataView);
                const before: string[] = getPaths();

                (dataView.metadata.objects!).barAppearance.cornerRadius = 15;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const after: string[] = getPaths();

                // Rounding the corners changes the rendered column paths
                expect(after).not.toEqual(before);
            });

            it("barSpacing", () => {
                const getTransforms = (): string[] => Array.from(visualBuilder.columns)
                    .map((element: Element) => element.getAttribute("transform") || "");

                visualBuilder.updateFlushAllD3Transitions(dataView);
                const before: string[] = getTransforms();

                (dataView.metadata.objects!).barAppearance.barSpacing = 25;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const after: string[] = getTransforms();

                // Changing bar spacing should reposition/resize the rendered columns
                expect(after).not.toEqual(before);
            });
        });

        describe("Center line", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    centerLine: {
                        show: true
                    }
                };
            });

            it("show", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(dataView.metadata.objects!["centerLine"].show).toBe(true);
                    // Center line should be rendered in the DOM when enabled
                    expect(visualBuilder.axis.length).toBeGreaterThan(0);
                    done();
                });
            });

            it("hidden when show is off", (done) => {
                (dataView.metadata.objects!).centerLine.show = false;

                visualBuilder.updateRenderTimeout(dataView, () => {
                    // No center line elements should be rendered when disabled
                    expect(visualBuilder.axis.length).toBe(0);
                    done();
                });
            });

            it("color", (done) => {
                const color: string = "#FF0000";
                (dataView.metadata.objects!).centerLine.color = getSolidColorStructuralObject(color);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(dataView.metadata.objects!["centerLine"].color).toBeDefined();
                    // The rendered center line stroke should match the configured color
                    Array.from(visualBuilder.axis).forEach((element: Element) => {
                        assertColorsMatch(getComputedStyle(element).getPropertyValue("stroke"), color);
                    });
                    done();
                });
            });

            it("width", (done) => {
                (dataView.metadata.objects!).centerLine.width = 5;

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(dataView.metadata.objects!["centerLine"].width).toBe(5);
                    // The rendered center line stroke-width should match the configured width
                    Array.from(visualBuilder.axis).forEach((element: Element) => {
                        expect(getComputedStyle(element).getPropertyValue("stroke-width")).toBe("5px");
                    });
                    done();
                });
            });
        });

        describe("Chart area", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    chartArea: {
                        show: true
                    }
                };
            });

            it("show", () => {
                const color: string = "#EEFFAA";
                (dataView.metadata.objects!).chartArea.backgroundColor = getSolidColorStructuralObject(color);
                (dataView.metadata.objects!).chartArea.show = false;

                visualBuilder.updateFlushAllD3Transitions(dataView);
                // With the chart area hidden, the background is not painted
                const fill: string = getComputedStyle(visualBuilder.chartAreaBackground).getPropertyValue("fill");
                expect(fill).toBe("none");
            });

            it("backgroundColor", (done) => {
                const color: string = "#EEFFAA";
                (dataView.metadata.objects!).chartArea.backgroundColor = getSolidColorStructuralObject(color);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(dataView.metadata.objects!["chartArea"].backgroundColor).toBeDefined();
                    // The background rect fill should match the configured color when shown
                    assertColorsMatch(
                        getComputedStyle(visualBuilder.chartAreaBackground).getPropertyValue("fill"),
                        color);
                    done();
                });
            });
        });

        describe("Category axis", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    categoryAxis: {}
                };
            });

            it("normalize", () => {
                const getPaths = (): string[] => Array.from(visualBuilder.columns)
                    .map((element: Element) => element.getAttribute("d") || "");

                visualBuilder.updateFlushAllD3Transitions(dataView);
                const before: string[] = getPaths();

                (dataView.metadata.objects!).categoryAxis.normalize = true;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const after: string[] = getPaths();

                // Normalizing changes how column widths are scaled per series
                expect(after).not.toEqual(before);
            });

            it("end", () => {
                const getPaths = (): string[] => Array.from(visualBuilder.columns)
                    .map((element: Element) => element.getAttribute("d") || "");

                visualBuilder.updateFlushAllD3Transitions(dataView);
                const before: string[] = getPaths();

                (dataView.metadata.objects!).categoryAxis.end = 100;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const after: string[] = getPaths();

                // Capping the axis end value rescales the rendered column widths
                expect(after).not.toEqual(before);
            });
        });
    });

    describe("Highligh test", () => {
        const expectedHighligtedCount: number = 1;
        let columns: SVGPathElement[];
        let columnsDefs: HTMLElement;
        let dataViewWithHighLighted: DataView;

        beforeEach(() => {
            dataViewWithHighLighted = dataViewBuilder.getDataView(undefined, true);
            visualBuilder.update(dataViewWithHighLighted);
            visualBuilder.updateRenderTimeout(dataViewWithHighLighted, () => {
                columns = Array.from(visualBuilder.columns);
                columnsDefs = visualBuilder.columnsDefs;
            });
        });

        it("should highligted elements change their opacity", (done) => {
            visualBuilder.updateRenderTimeout(dataViewWithHighLighted, () => {
                let highligtedCount: number = 0;
                let nonHighlightedCount: number = 0;
                Array.from(columnsDefs.children).forEach((element) => {
                    Array.from(element.children).forEach((childElement) => {
                        if(childElement.outerHTML.indexOf("100%") != -1){
                            highligtedCount += 1;
                        }
                        else{
                            nonHighlightedCount+=1
                        }
                    })
                });
                const expectedNonHighligtedCount: number = columns.length - expectedHighligtedCount;
                // As there are two gradient point per each column, to find distinct columns we divide by 2.
                expect(highligtedCount / 2).toBe(expectedHighligtedCount);
                expect(nonHighlightedCount / 2).toBe(expectedNonHighligtedCount);

                done();
            });
        });
    });

    describe("High contrast mode", () => {
        const backgroundColor: string = "#000000";
        const foregroundColor: string = "#ff00ff";

        let columns: SVGPathElement[];

        beforeEach(() => {

            visualBuilder.visualHost.colorPalette.isHighContrast = true;

            visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
            visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };

            visualBuilder.updateRenderTimeout(dataView, () => {
                columns = Array.from(visualBuilder.columns);
            });
        });

        it("should not use fill style", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                // In high-contrast mode the bar fill (gradient) uses the theme background color, not data colors
                const stopColors: string[] = Array.from(visualBuilder.gradients)
                    .flatMap((gradient: SVGElement) => Array.from(gradient.querySelectorAll("stop")))
                    .map((stop: Element) => stop.getAttribute("stop-color") || "");

                expect(stopColors.length).toBeGreaterThan(0);
                stopColors.forEach((stopColor: string) => assertColorsMatch(stopColor, backgroundColor));
                done();
            });
        });

        it("should use stroke style", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(isColorAppliedToElements(columns, foregroundColor, "stroke")).toBe(true);
                done();
            });
        });
    });

    describe("Selection tests", () => {
        it("column can be selected", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const firstColumn: SVGPathElement = visualBuilder.columns[0];
                d3Click(firstColumn, 0, 0, ClickEventType.Default);

                renderTimeout(() => {
                    expect(visualBuilder.selectedColumns?.length).toBe(1);
                    done();
                });
            });
        });

        it("column can be deselected", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const firstColumn: SVGPathElement = visualBuilder.columns[0];
                d3Click(firstColumn, 0, 0, ClickEventType.Default);

                renderTimeout(() => {
                    expect(visualBuilder.selectedColumns?.length).toBe(1);
                    d3Click(firstColumn, 0, 0, ClickEventType.CtrlKey);

                    renderTimeout(() => {
                        expect(visualBuilder.selectedColumns?.length).toBe(12);
                        done();
                    });
                });
            });
        });

        it("multi-selection should work with ctrlKey", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                checkMultiselection(ClickEventType.CtrlKey, done);
            });
        });

        it("multi-selection should work with metaKey", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                checkMultiselection(ClickEventType.MetaKey, done);
            });
        });

        it("multi-selection should work with shiftKey", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                checkMultiselection(ClickEventType.ShiftKey, done);
            });
        });

        function checkMultiselection(eventType: number, done: DoneFn): void {
            const firstColumn: SVGPathElement = visualBuilder.columns[0];
            const secondColumn: SVGPathElement = visualBuilder.columns[1];
            d3Click(firstColumn, 0, 0, ClickEventType.Default);
            renderTimeout(() => {
                expect(visualBuilder.selectedColumns?.length).toBe(1);

                d3Click(secondColumn, 0, 0, eventType);

                renderTimeout(() => {
                    expect(visualBuilder.selectedColumns?.length).toBe(2);
                    done();
                });
            });
        }
    });

    describe("Keyboard navigation and related aria-attributes tests:", () => {
        it("should have role=listbox and aria-multiselectable attributes correctly set", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const columnsElement: HTMLElement = visualBuilder.column;

                expect(columnsElement.getAttribute("role")).toBe("listbox");
                expect(columnsElement.getAttribute("aria-multiselectable")).toBe("true");

                done();
            });
        });

        it("should have role=presentation correctly set on text labels", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {

                const labels: SVGElement[] = Array.from(visualBuilder.labels).map((element: HTMLElement) => element.querySelector("text"));
                for (const label of labels) { 
                    expect(label.getAttribute("role")).toBe("presentation");
                }

                done();
            });
        });

        it("enter toggles the correct column", () => {
            const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
            checkKeyboardSingleSelection(enterEvent);
        });

        it("space toggles the correct column", () => {
            const spaceEvent = new KeyboardEvent("keydown", { code: "Space", bubbles: true });
            checkKeyboardSingleSelection(spaceEvent);
        });

        it("multiselection should work with ctrlKey", () => {
            const enterEventCtrlKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, ctrlKey: true });
            checkKeyboardMultiSelection(enterEventCtrlKey);
        });

        it("multiselection should work with metaKey", () => {
            const enterEventMetaKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, metaKey: true });
            checkKeyboardMultiSelection(enterEventMetaKey);
        });

        it("multiselection should work with shiftKey", () => {
            const enterEventShiftKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, shiftKey: true });
            checkKeyboardMultiSelection(enterEventShiftKey);
        });

        it("column can be focused", () => {
            visualBuilder.updateFlushAllD3Transitions(dataView);

            const columns: SVGPathElement[] = Array.from(visualBuilder.columns);
            const firstColumn: SVGPathElement = columns[0];

            columns.forEach((column: SVGPathElement) => {
                expect(column.matches(":focus-visible")).toBeFalse();
            });

            firstColumn.focus();
            expect(firstColumn.matches(':focus-visible')).toBeTrue();

            const otherColumns: SVGPathElement[] = columns.slice(1);
            otherColumns.forEach((column: SVGPathElement) => {
                expect(column.matches(":focus-visible")).toBeFalse();
            });

        });

        function checkKeyboardSingleSelection(keyboardSingleSelectionEvent: KeyboardEvent): void {
            visualBuilder.updateFlushAllD3Transitions(dataView);
            const columns: SVGPathElement[] = Array.from(visualBuilder.columns);
            const firstColumn: SVGPathElement = columns[0];
            const secondColumn: SVGPathElement = columns[1];

            firstColumn.dispatchEvent(keyboardSingleSelectionEvent);
            expect(firstColumn.getAttribute("aria-selected")).toBe("true");

            const otherColumns: SVGPathElement[] = columns.slice(1);
            otherColumns.forEach((column: SVGPathElement) => {
                expect(column.getAttribute("aria-selected")).toBe("false");
            });

            secondColumn.dispatchEvent(keyboardSingleSelectionEvent);
            expect(secondColumn.getAttribute("aria-selected")).toBe("true");

            columns.splice(1, 1);
            columns.forEach((column: SVGPathElement) => {
                expect(column.getAttribute("aria-selected")).toBe("false");
            }
            );
        }

        function checkKeyboardMultiSelection(keyboardMultiselectionEvent: KeyboardEvent): void {
            visualBuilder.updateFlushAllD3Transitions(dataView);
            const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
            const columns: SVGPathElement[] = Array.from(visualBuilder.columns);
            const firstColumn: SVGPathElement = columns[0];
            const secondColumn: SVGPathElement = columns[1];

            // select first column
            firstColumn.dispatchEvent(enterEvent);
            // multiselect second column
            secondColumn.dispatchEvent(keyboardMultiselectionEvent);

            expect(firstColumn.getAttribute("aria-selected")).toBe("true");
            expect(secondColumn.getAttribute("aria-selected")).toBe("true");
            expect(visualBuilder.selectedColumns?.length).toBe(2);
        }
    });
});

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
