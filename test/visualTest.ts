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
// powerbi.visuals
import ISelectionId = powerbi.visuals.ISelectionId;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;

// powerbi.extensibility.visual.test
import TornadoData = powerbi.extensibility.visual.test.TornadoData;
import areColorsEqual = powerbi.extensibility.visual.test.helpers.areColorsEqual;
import isColorAppliedToElements = powerbi.extensibility.visual.test.helpers.isColorAppliedToElements;
import TornadoChartBuilder = powerbi.extensibility.visual.test.TornadoChartBuilder;
import getRandomUniqueHexColors = powerbi.extensibility.visual.test.helpers.getRandomUniqueHexColors;
import getSolidColorStructuralObject = powerbi.extensibility.visual.test.helpers.getSolidColorStructuralObject;

// powerbi.extensibility.utils.test
import assertColorsMatch = powerbi.extensibility.utils.test.helpers.color.assertColorsMatch;

// TornadoChart1452517688218
import TornadoChartPoint = powerbi.extensibility.visual.TornadoChart1452517688218.TornadoChartPoint;
import TornadoChartSeries = powerbi.extensibility.visual.TornadoChart1452517688218.TornadoChartSeries;
import TornadoChartDataView = powerbi.extensibility.visual.TornadoChart1452517688218.TornadoChartDataView;

describe("TornadoChart", () => {
    let visualBuilder: TornadoChartBuilder,
        dataViewBuilder: TornadoData,
        dataView: DataView,
        MaxSeries: number = 2;

    beforeEach(() => {
        visualBuilder = new TornadoChartBuilder(1000, 500);
        dataViewBuilder = new TornadoData();

        dataView = dataViewBuilder.getDataView();
    });

    describe("DOM tests", () => {
        it("svg element created", () => {
            expect(visualBuilder.scrollable[0]).toBeInDOM();
        });

        it("update", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const renderedCategories: number = visualBuilder.scrollable
                    .find(".columns")
                    .children()
                    .length / 2;

                expect(renderedCategories).toBeGreaterThan(0);
                expect(renderedCategories)
                    .toBeLessThan(dataView.categorical.categories[0].values.length + 1);

                done();
            });
        });

        it("update with empty data", (done) => {
            dataView.categorical.values[0].values = [];
            visualBuilder.updateRenderTimeout(dataView, () => {
                const renderedCategories: number = visualBuilder.categories.children().length;
                expect(renderedCategories).toBe(0);
                done();
            });
        });

        it("Clear catcher covers the whole visual", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const clearCatcher: JQuery = visualBuilder.scrollable
                    .first()
                    .children()
                    .first()
                    .find("clearCatcher");

                expect(clearCatcher).toBeDefined();

                done();
            });
        });

        it("Categories tooltip is rendered correctly", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const categoriesTooltip: JQuery = visualBuilder.scrollable.find(".category-title");

                expect($(categoriesTooltip[0]).text()).toBe("Australia");
                expect($(categoriesTooltip[1]).text()).toBe("Canada");
                expect($(categoriesTooltip[2]).text()).toBe("France");

                done();
            });
        });

        it("Scrolling should not be enabled when there is no data", (done) => {
            visualBuilder = new TornadoChartBuilder(500, 50);
            visualBuilder.updateRenderTimeout(dataView, () => {
                // Check that the scroll bar and data exists
                expect(visualBuilder.scrollbarRect.length).toBe(1);
                expect(visualBuilder.columns.length).toBe(2);

                // Clear data
                dataView.categorical.categories = null;

                visualBuilder.updateRenderTimeout(dataView, () => {

                    // Check that the scroll bar and data are removed
                    expect(visualBuilder.scrollbarRect.length).toBe(0);
                    expect(visualBuilder.columns.length).toBe(0);

                    done();
                });
            });
        });

        it("Category labels should be tailored if their length is big", (done) => {
            const longText: string = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

            dataViewBuilder.valuesCategory = dataViewBuilder.valuesCategory.map(() => longText);

            dataView = dataViewBuilder.getDataView();

            visualBuilder.updateRenderTimeout(dataView, () => {
                visualBuilder.categories.each((i: number, element: Element) => {
                    expect((element as any).getBBox().width)
                        .toBeLessThan(visualBuilder.viewport.width / 3 * 2);

                    expect($(element).children("text.category-text").text()).toContain("...");
                });

                done();
            });
        });

        it("Middle axis of Tornado should have correct position", (done) => {
            visualBuilder = new TornadoChartBuilder(500, 50);

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
            dataView.categorical.values[0].source.format = "$#,0.00;($#,0.00);$#,0.00";
            dataView.categorical.values[1].source.format = "0.00 %;-0.00 %;0.00 %";

            visualBuilder.updateRenderTimeout(dataView, () => {
                const labelsText: JQuery = visualBuilder.labels.children("text.label-text");

                const labelsTextWith$: JQuery = labelsText.filter((i: number, element: Element) => {
                    return _.includes($(element).text(), "$");
                });

                expect(labelsTextWith$.length).toEqual(labelsText.length / 2);

                const labelsTextWithPercent: JQuery = labelsText.filter((i: number, element: Element) => {
                    return _.includes($(element).text(), "%");
                });

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

        it("enumerateObjectInstances arguments are null", () => {
            let options: EnumerateVisualObjectInstancesOptions = { objectName: "object" };

            expect(visualBuilder.enumerateObjectInstances(options)).toBeDefined();
        });

        it("every argument is correct", () => {
            const index: number = 0,
                series: TornadoChartSeries = callParseSeriesAndExpectExceptions(
                    dataView,
                    dataView.categorical.values,
                    index,
                    true,
                    dataView.categorical.values.grouped()[index]);

            expect(series.categoryAxisEnd).toBeDefined();
            expect(series.name).toBeDefined();

            expect(series.selectionId).toBeDefined();
            expect(series.selectionId).not.toBeNull();
            expect((series.selectionId as ISelectionId).getKey()).toBeDefined();

            expect(series.categoryAxisEnd).toBeDefined();
        });

        function callParseSeriesAndExpectExceptions(
            dataView: DataView,
            dataViewValueColumns: DataViewValueColumns,
            index: number,
            isGrouped: boolean,
            columnGroup: DataViewValueColumnGroup): TornadoChartSeries {

            let series: TornadoChartSeries;
            expect(() => {
                series = visualBuilder.parseSeries(
                    dataView,
                    dataViewValueColumns,
                    index,
                    isGrouped,
                    columnGroup);
            }).not.toThrow();

            return series;
        }
    });

    describe("Converter tests", () => {
        let tornadoChartDataView: TornadoChartDataView,
            tornadoChartSeries: TornadoChartSeries[];

        beforeEach(() => {
            visualBuilder.update(dataView);

            tornadoChartDataView = visualBuilder.converter(dataView);
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

                    expect((dataPoint.identity as ISelectionId).getKey()).toBeDefined();
                    expect((dataPoint.identity as ISelectionId).getKey()).not.toBeNull();
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
                    expect((series.selectionId as ISelectionId).getKey()).toBeDefined();
                });
            });
        });
    });

    describe("Format settings test", () => {
        describe("Data colors", () => {
            it("colors", () => {
                let colors: string[] = getRandomUniqueHexColors(dataView.categorical.values.length);

                dataView.categorical.values.forEach((column: DataViewValueColumn, index: number) => {
                    column.source.objects = {
                        dataPoint: {
                            fill: getSolidColorStructuralObject(colors[index])
                        }
                    };
                });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                let columns: JQuery[] = visualBuilder.columns
                    .toArray()
                    .map($);

                colors.forEach((color: string, index: number) => {
                    const doColumnContainColor: boolean = columns.some((element: JQuery) => {
                        return areColorsEqual(element.css("fill"), color);
                    });

                    if (index < MaxSeries) {
                        expect(doColumnContainColor).toBeTruthy();
                    } else {
                        expect(doColumnContainColor).toBe(false);
                    }
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

            it("show", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.labelText).toBeInDOM();

                (dataView.metadata.objects as any).labels.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.labelText).not.toBeInDOM();
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

                visualBuilder.labelText
                    .toArray()
                    .forEach((element: Element, index: number) => {
                        assertColorsMatch(
                            $(element).css("fill"),
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

                visualBuilder.labelText
                    .toArray()
                    .forEach((element: Element, index: number) => {
                        assertColorsMatch(
                            $(element).css("fill"),
                            color,
                            index >= labelsOneSideLength);
                    });
            });

            it("font size", () => {
                const fontSize: number = 23,
                    fontSizeInPt: string = "30.6667px";

                (dataView.metadata.objects as any).labels.fontSize = fontSize;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.labelText
                    .toArray()
                    .forEach((element: Element) => {
                        expect($(element).css("font-size")).toBe(fontSizeInPt);
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

            it("show", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.categoryText).toBeInDOM();

                (dataView.metadata.objects as any).categories.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.categoryText).not.toBeInDOM();
            });

            it("color", () => {
                const color: string = "#ABCDEF";

                (dataView.metadata.objects as any).categories.fill = getSolidColorStructuralObject(color);
                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.categoryText
                    .toArray()
                    .forEach((element: Element) => {
                        assertColorsMatch($(element).css("fill"), color);
                    });
            });
        });
    });

    describe("High contrast mode", () => {
        const backgroundColor: string = "#000000";
        const foregroundColor: string = "#ff00ff";

        let columns: JQuery[],
            linkElements: JQuery[];

        beforeEach(() => {
            visualBuilder.visualHost.colorPalette.isHighContrast = true;

            visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
            visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };

            columns = visualBuilder.columns.toArray().map($);
        });

        it("should not use fill style", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(isColorAppliedToElements(columns, null, "fill"));
                done();
            });
        });

        it("should use stroke style", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(isColorAppliedToElements(columns, foregroundColor, "stroke"));
                done();
            });
        });
    });
});
