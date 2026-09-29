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

                expect(Math.abs(axisRightPosition - column1RightPosition)).toBeLessThanOrEqual(1);

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

        describe("Theme colors", () => {
            const themeForeground: string = "#DDEEFF";
            const themeBackground: string = "#112233";
            const themeText: string = "#667788";
            const themeLabel: string = "#778899";
            const darkThemeForegroundLight: string = "#111111";
            const firstSeriesColor: string = "#AA3377";
            const secondSeriesColor: string = "#33AA77";

            const removeExplicitSeriesColors = (): void => {
                dataView.categorical!.values!.forEach((column: DataViewValueColumn) => {
                    if (column.source.objects?.dataPoint) {
                        delete column.source.objects.dataPoint;
                    }
                });
            };

            const enableLegend = (): void => {
                dataView.categorical!.values!.source = {
                    displayName: "Series"
                };
            };

            const useInsideAndOutsideLabels = (): void => {
                dataViewBuilder.valuesValue1 = dataViewBuilder.valuesValue1.map(() => 0);
                dataViewBuilder.valuesValue2 = dataViewBuilder.valuesValue2.map(() => 1);
                dataViewBuilder.valuesValue3 = dataViewBuilder.valuesValue3.map(() => 2);
                dataView = dataViewBuilder.getDataView();
                removeExplicitSeriesColors();
            };

            beforeEach(() => {
                visualBuilder.visualHost.colorPalette.foreground = { value: themeForeground };
                visualBuilder.visualHost.colorPalette.background = { value: themeBackground };
                visualBuilder.visualHost.colorPalette.foregroundNeutralSecondary = { value: themeText };
                visualBuilder.visualHost.colorPalette.foregroundNeutralSecondaryAlt = { value: themeLabel };
                visualBuilder.visualHost.colorPalette.foregroundLight = { value: darkThemeForegroundLight };
            });

            it("uses report palette colors for series defaults", () => {
                removeExplicitSeriesColors();
                const seriesKeys: string[] = dataView.categorical!.values!
                    .slice(0, MaxSeries)
                    .map((column: DataViewValueColumn) => column.source.queryName!);
                const assignedColors = new Map<string, string>();
                const paletteColors = [firstSeriesColor, secondSeriesColor, "#7755AA"];

                const getColorSpy = spyOn(visualBuilder.visualHost.colorPalette, "getColor").and.callFake((key: string) => {
                    if (!assignedColors.has(key)) {
                        assignedColors.set(key, paletteColors[assignedColors.size]);
                    }

                    return { value: assignedColors.get(key)! };
                });

                visualBuilder.update(dataView);
                const convertedData: TornadoChartDataView = visualBuilder.converter(dataView, visualBuilder.instance.formattingSettings);

                expect(convertedData.series[0].fill).toBe(firstSeriesColor);
                expect(convertedData.series[1].fill).toBe(secondSeriesColor);
                expect(getColorSpy).toHaveBeenCalledWith(seriesKeys[0]);
                expect(getColorSpy).toHaveBeenCalledWith(seriesKeys[1]);
                expect(getColorSpy).not.toHaveBeenCalledWith("");
            });

            it("uses theme foreground and background tokens for visual text and the center line", () => {
                useInsideAndOutsideLabels();
                enableLegend();

                visualBuilder.updateFlushAllD3Transitions(dataView);

                Array.from(visualBuilder.categoryText).forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("fill"), themeText);
                });
                Array.from(visualBuilder.axis).forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("stroke"), themeForeground);
                });

                const legendTextElements = Array.from(visualBuilder.legendText);
                expect(legendTextElements.length).withContext("legend text should be rendered").toBeGreaterThan(0);
                legendTextElements.forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("fill"), themeText);
                });

                const labelsOneSideLength: number = visualBuilder.labelText.length / 2;
                Array.from(visualBuilder.labelText).forEach((element: Element, index: number) => {
                    const expectedColor: string = index < labelsOneSideLength ? themeLabel : themeBackground;
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("fill"), expectedColor);
                });
            });

            it("shows effective default colors in formatting cards", () => {
                visualBuilder.update(dataView);

                const formattingSettings = visualBuilder.instance.formattingSettings;
                expect(formattingSettings.centerLine.color.value.value).toBe(themeForeground);
                expect(formattingSettings.legend.text.labelColor.value.value).toBe(themeText);
                expect(formattingSettings.category.fill.value.value).toBe(themeText);
                expect(formattingSettings.dataLabels.labelsValuesGroup.insideFill.value.value).toBe(themeBackground);
                expect(formattingSettings.dataLabels.labelsValuesGroup.outsideFill.value.value).toBe(themeLabel);
                expect(formattingSettings.chartArea.backgroundColor.value.value).toBe(themeBackground);
                expect(formattingSettings.barAppearance.borderColor.value.value).toBe(themeText);
                expect(formattingSettings.negativeBars.borderColor.value.value).toBe("");
                expect(formattingSettings.legend.text.font.fontSize.value).toBe(9);
                expect(formattingSettings.category.font.fontSize.value).toBe(9);
            });

            it("preserves explicit author colors over theme tokens", () => {
                const categoryColor: string = "#CC4400";
                const legendColor: string = "#00CC44";
                const centerLineColor: string = "#4400CC";
                enableLegend();
                dataView.metadata.objects = {
                    categories: {
                        fill: getSolidColorStructuralObject(categoryColor)
                    },
                    legend: {
                        labelColor: getSolidColorStructuralObject(legendColor)
                    },
                    centerLine: {
                        color: getSolidColorStructuralObject(centerLineColor)
                    }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const formattingSettings = visualBuilder.instance.formattingSettings;
                expect(formattingSettings.category.fill.value.value).toBe(categoryColor);
                expect(formattingSettings.legend.text.labelColor.value.value).toBe(legendColor);
                expect(formattingSettings.centerLine.color.value.value).toBe(centerLineColor);

                Array.from(visualBuilder.categoryText).forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("fill"), categoryColor);
                });
                Array.from(visualBuilder.legendText).forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("fill"), legendColor);
                });
                Array.from(visualBuilder.axis).forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("stroke"), centerLineColor);
                });
            });

            it("uses safe text fallbacks when theme tokens are missing", () => {
                useInsideAndOutsideLabels();
                enableLegend();
                const palette = visualBuilder.visualHost.colorPalette;
                visualBuilder.visualHost.colorPalette.foreground = { value: undefined };
                visualBuilder.visualHost.colorPalette.background = { value: undefined };
                visualBuilder.visualHost.colorPalette.foregroundNeutralSecondary = { value: undefined };
                visualBuilder.visualHost.colorPalette.foregroundNeutralSecondaryAlt = { value: undefined };
                visualBuilder.visualHost.colorPalette.foregroundLight = { value: undefined };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                Array.from(visualBuilder.categoryText).forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("fill"), palette.foregroundNeutralSecondaryAlt2.value);
                });
                Array.from(visualBuilder.legendText).forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("fill"), palette.foregroundNeutralSecondaryAlt2.value);
                });
                Array.from(visualBuilder.axis).forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("stroke"), palette.foregroundDark.value);
                });

                const labelsOneSideLength: number = visualBuilder.labelText.length / 2;
                Array.from(visualBuilder.labelText).forEach((element: Element, index: number) => {
                    const expectedColor: string = index < labelsOneSideLength
                        ? palette.foregroundNeutralSecondaryAlt2.value
                        : palette.backgroundLight.value;
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("fill"), expectedColor);
                });
            });

            it("uses default colors only when all relevant theme tokens are missing", () => {
                const palette = visualBuilder.visualHost.colorPalette;
                palette.foreground = { value: undefined };
                palette.foregroundDark = { value: undefined };
                palette.foregroundNeutralDark = { value: undefined };
                palette.foregroundNeutralSecondary = { value: undefined };
                palette.foregroundNeutralSecondaryAlt2 = { value: undefined };

                visualBuilder.update(dataView);

                const formattingSettings = visualBuilder.instance.formattingSettings;
                expect(formattingSettings.centerLine.color.value.value).toBe("#D3D3D3");
                expect(formattingSettings.legend.text.labelColor.value.value).toBe("#616161");
                expect(formattingSettings.category.fill.value.value).toBe("#707070");
            });

            it("does not change the configured legend placement", () => {
                enableLegend();
                dataView.metadata.objects = {
                    legend: {
                        position: "Bottom"
                    }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.element.querySelector(".legend")!.classList.contains("legend-position-bottom")).toBeTrue();
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
                expect(visualBuilder.labels.length).toBeGreaterThan(0);
                visualBuilder.labelText.forEach((element) => {
                    expect(document.body.contains(element)).toBeTruthy();
                });

                (dataView.metadata.objects!).labels.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(visualBuilder.labels.length).toBe(0);
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

                const expectControlState = (
                    valueDisabled: boolean,
                    percentageDisabled: boolean,
                    displayUnitsDisabled: boolean
                ): void => {
                    const valuesGroup = visualBuilder.instance.formattingSettings.dataLabels.labelsValuesGroup;
                    expect(valuesGroup.labelPrecision.disabled).toBe(valueDisabled);
                    expect(valuesGroup.percentagePrecision.disabled).toBe(percentageDisabled);
                    expect(valuesGroup.labelDisplayUnits.disabled).toBe(displayUnitsDisabled);
                };

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

                it("enables decimal places and display units for the selected content", () => {
                    (dataView.metadata.objects!).labels.displayFormat = "value";
                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    expectControlState(false, true, false);

                    (dataView.metadata.objects!).labels.displayFormat = "percentage";
                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    expectControlState(true, false, true);

                    (dataView.metadata.objects!).labels.displayFormat = "valueAndPercentage";
                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    expectControlState(false, false, false);
                });

                it("uses percentage decimal places independently", () => {
                    (dataView.metadata.objects!).labels.displayFormat = "percentage";
                    (dataView.metadata.objects!).labels.labelPrecision = 3;
                    (dataView.metadata.objects!).labels.percentagePrecision = 1;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const texts: string[] = getAllLabelTexts();
                    expect(texts.length).toBeGreaterThan(0);
                    texts.forEach((text: string) => expect(text).toMatch(/^-?\d+\.\d%$/));
                });

                it("caps automatic percentage decimal places", () => {
                    (dataView.metadata.objects!).labels.displayFormat = "percentage";
                    (dataView.metadata.objects!).labels.labelPrecision = 17;
                    (dataView.metadata.objects!).labels.percentagePrecision = NaN;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const texts: string[] = getAllLabelTexts();
                    expect(texts.length).toBeGreaterThan(0);
                    texts.forEach((text: string) => expect(text).toMatch(/^-?\d+\.\d{10}%$/));
                });

                it("falls back safely when decimal places is not finite", () => {
                    (dataView.metadata.objects!).labels.displayFormat = "value";
                    (dataView.metadata.objects!).labels.labelPrecision = NaN;
                    dataView.categorical!.values!.forEach((column: DataViewValueColumn) => {
                        column.source.format = "#,0.00";
                    });
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const texts: string[] = getAllLabelTexts();
                    expect(texts.length).toBeGreaterThan(0);
                    texts.forEach((text: string) => expect(text).toMatch(/^-?\d{1,3}(,\d{3})*\.\d{2}$/));
                });

                it("Value (%) mode renders value and percentage together", () => {
                    (dataView.metadata.objects!).labels.displayFormat = "valueAndPercentage";
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const texts: string[] = getAllLabelTexts();
                    expect(texts.length).toBeGreaterThan(0);
                    expect(texts.some((text: string) => text.includes("(") && text.includes("%)"))).toBeTrue();
                });
            });

            describe("position", () => {
                const labelPadding = 8;
                const getRenderedPoints = (): TornadoChartPoint[] =>
                    Array.from(visualBuilder.labels)
                        .map((element: HTMLElement) => <TornadoChartPoint>(<any>element).__data__)
                        .filter((point: TornadoChartPoint) => !!point.label?.value);
                const getRenderedColumnWidths = (): number[] =>
                    Array.from(visualBuilder.columns)
                        .map((element: SVGPathElement) => (<TornadoChartPoint>(<any>element).__data__).width!);
                const getCalculatedColumnWidths = (): number[] =>
                    (visualBuilder.instance as unknown as { dataView: TornadoChartDataView })
                        .dataView.dataPoints.map(point => point.width!);
                const getLabelMetrics = (point: TornadoChartPoint) => {
                    const labelElement = Array.from(visualBuilder.labels)
                        .find((element: HTMLElement) => (<TornadoChartPoint>(<any>element).__data__) === point)!;
                    const labelText = labelElement.querySelector("text.label-text") as SVGTextElement;

                    return {
                        labelWidth: labelText.getComputedTextLength(),
                        isLeftSeries: point.uniqId < dataView.categorical!.categories![0].values.length
                    };
                };

                beforeEach(() => {
                    dataViewBuilder.valuesValue1 = [50, 50, 50, 50, 50, 1000];
                    dataViewBuilder.valuesValue2 = [50, 50, 50, 50, 50, 1000];
                    dataView = dataViewBuilder.getDataView();
                    dataView.metadata.objects = { labels: { show: true } };
                });

                it("uses Auto when the property is absent", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.instance.formattingSettings.dataLabels.labelsOptionsGroup.position.value.value)
                        .toBe("auto");
                });

                it("does not reserve outside-label space when labels are hidden", () => {
                    (dataView.metadata.objects!).labels.show = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    const autoWidths = getRenderedColumnWidths();

                    (dataView.metadata.objects!).labels.position = "outsideEnd";
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(getRenderedColumnWidths()).toEqual(autoWidths);
                });

                it("does not reserve outside-label space when all negative bars are hidden", () => {
                    dataViewBuilder.valuesValue1 = [-50, -50, -50, -50, -50, -1000];
                    dataViewBuilder.valuesValue2 = [-50, -50, -50, -50, -50, -1000];
                    dataView = dataViewBuilder.getDataView();
                    dataView.metadata.objects = {
                        labels: { show: true },
                        negativeBars: { show: false }
                    };
                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    const autoWidths = getCalculatedColumnWidths();

                    (dataView.metadata.objects!).labels.position = "outsideEnd";
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(getCalculatedColumnWidths()).toEqual(autoWidths);
                });

                it("preserves auto inside and outside placement", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const points = getRenderedPoints();
                    const isInside = (point: TornadoChartPoint): boolean =>
                        point.label!.dx >= point.dx!
                        && point.label!.dx <= point.dx! + point.width!;

                    expect(points.some(isInside)).toBeTrue();
                    expect(points.some((point: TornadoChartPoint) => !isInside(point))).toBeTrue();
                });

                it("places labels outside the end on both sides", () => {
                    (dataView.metadata.objects!).labels.position = "outsideEnd";
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const points = getRenderedPoints();
                    const categoriesLength = dataView.categorical!.categories![0].values.length;
                    expect(points.length).toBe(categoriesLength * 2);
                    points.forEach((point: TornadoChartPoint) => {
                        const { labelWidth, isLeftSeries } = getLabelMetrics(point);
                        if (isLeftSeries) {
                            expect(point.label!.dx + labelWidth).toBeLessThanOrEqual(point.dx! - labelPadding + 0.01);
                        } else {
                            expect(point.label!.dx).toBeGreaterThanOrEqual(point.dx! + point.width! + labelPadding);
                            expect(point.label!.dx + labelWidth).toBeLessThanOrEqual(visualBuilder.viewport.width);
                        }
                    });
                });

                it("keeps complete outside labels when the text fits beside the bars", () => {
                    visualBuilder = new TornadoChartBuilder(260, 500);
                    dataViewBuilder.valuesValue1 = [50, 50, 50, 50, 50, 1000];
                    dataViewBuilder.valuesValue2 = [50, 50, 50, 50, 50, 1000];
                    dataView = dataViewBuilder.getDataView();
                    dataView.categorical!.values!.forEach((column: DataViewValueColumn) => {
                        column.source.format = "#,0";
                    });
                    dataView.metadata.objects = {
                        labels: {
                            show: true,
                            position: "outsideEnd",
                            displayFormat: "percentage",
                            labelPrecision: 2
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const maximumValueLabels = getRenderedPoints()
                        .filter((point: TornadoChartPoint) => point.value === 1000);
                    expect(maximumValueLabels.length).toBe(2);
                    maximumValueLabels.forEach((point: TornadoChartPoint) => {
                        expect(point.label!.value).toBe("100.00%");
                        expect(point.width).toBeGreaterThan(0);
                    });
                });

                [
                    {
                        name: "places labels inside the end on both sides",
                        position: "insideEnd",
                        precision: 1,
                        expectedDx: (point: TornadoChartPoint, labelWidth: number, isLeftSeries: boolean): number => isLeftSeries
                            ? point.dx! + labelPadding
                            : point.dx! + point.width! - labelWidth - labelPadding
                    },
                    {
                        name: "centers labels inside bars on both sides",
                        position: "insideCenter",
                        precision: 1,
                        expectedDx: (point: TornadoChartPoint, labelWidth: number): number =>
                            point.dx! + point.width! / 2 - labelWidth / 2
                    },
                    {
                        name: "places labels inside the base on both sides",
                        position: "insideBase",
                        precision: 1,
                        expectedDx: (point: TornadoChartPoint, labelWidth: number, isLeftSeries: boolean): number => isLeftSeries
                            ? point.dx! + point.width! - labelWidth - labelPadding
                            : point.dx! + labelPadding
                    }
                ].forEach(({ name, position, precision, expectedDx }) => {
                    it(name, () => {
                        (dataView.metadata.objects!).labels.position = position;
                        visualBuilder.updateFlushAllD3Transitions(dataView);

                        const points = getRenderedPoints();
                        expect(points.length).toBeGreaterThan(0);
                        points.forEach((point: TornadoChartPoint) => {
                            const { labelWidth, isLeftSeries } = getLabelMetrics(point);

                            expect(point.label!.dx).toBeCloseTo(expectedDx(point, labelWidth, isLeftSeries), precision);
                            expect(point.label!.dx).toBeGreaterThanOrEqual(point.dx!);
                            expect(point.label!.dx + labelWidth).toBeLessThanOrEqual(point.dx! + point.width! + 0.01);
                        });
                    });
                });

                it("uses rounded-end geometry for inside-end label clearance", () => {
                    const cornerRadius = 100;
                    (dataView.metadata.objects!).labels.position = "insideEnd";
                    dataView.metadata.objects!.barAppearance = { cornerRadius };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    getRenderedPoints().forEach((point: TornadoChartPoint) => {
                        const { labelWidth, isLeftSeries } = getLabelMetrics(point);
                        const radius = Math.min(cornerRadius, point.width! / 2, point.height! / 2);
                        const chartDataView = (visualBuilder.instance as unknown as { dataView: TornadoChartDataView }).dataView;
                        const halfLabelHeight = Math.min(chartDataView.labelHeight / 2, radius);
                        const expectedPadding = labelPadding + radius
                            - Math.sqrt(Math.max(0, radius ** 2 - halfLabelHeight ** 2));
                        const actualPadding = isLeftSeries
                            ? point.label!.dx - point.dx!
                            : point.dx! + point.width! - (point.label!.dx + labelWidth);

                        expect(actualPadding).toBeCloseTo(expectedPadding, 1);
                    });
                });

                it("keeps the negative label color override", () => {
                    const negativeColor = "#123456";
                    dataViewBuilder.valuesValue1 = [-50, -1000, 50, 50, 50, 1000];
                    dataView = dataViewBuilder.getDataView();
                    dataView.metadata.objects = {
                        labels: {
                            show: true,
                            position: "outsideEnd",
                            negativeFill: getSolidColorStructuralObject(negativeColor)
                        },
                        negativeBars: {
                            show: true
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const negativePoints = getRenderedPoints()
                        .filter((point: TornadoChartPoint) => point.value < 0);
                    expect(negativePoints.length).toBeGreaterThan(0);
                    negativePoints.forEach((point: TornadoChartPoint) => {
                        expect(point.label!.color).toBe(negativeColor);
                    });
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
                expect(visualBuilder.categoryText.length).toBeGreaterThan(0);
                visualBuilder.categoryText.forEach((element) => {
                    expect(document.body.contains(element)).toBeTruthy();
                });

                (dataView.metadata.objects!).categories.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(visualBuilder.categories.length).toBe(0);
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
                (<number[]>dataView.categorical!.values![0].values)[0] = -50000;
            });

            it("are hidden by default", () => {
                dataView.metadata.objects = {};

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const renderedNegativeValues: number[] = Array.from(visualBuilder.columns)
                    .map((element: SVGPathElement) => (<TornadoChartPoint>(<any>element).__data__).value)
                    .filter((value: number) => value < 0);
                expect(renderedNegativeValues).toEqual([]);
            });

            it("scale proportionally to absolute magnitude", () => {
                dataViewBuilder.valuesValue1 = [-120000, -45000, 0, 45000, 120000, 60000];
                dataViewBuilder.valuesValue2 = [0, 0, 0, 0, 0, 0];
                dataView = dataViewBuilder.getDataView();
                dataView.metadata.objects = {
                    negativeBars: {
                        show: true
                    }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const renderedPoints: TornadoChartPoint[] = Array.from(visualBuilder.columns)
                    .map((element: SVGPathElement) => <TornadoChartPoint>(<any>element).__data__);
                const mostNegative = renderedPoints.find((point: TornadoChartPoint) => point.value === -120000);
                const smallerNegative = renderedPoints.find((point: TornadoChartPoint) => point.value === -45000);
                const matchingPositive = renderedPoints.find((point: TornadoChartPoint) => point.value === 120000);

                expect(mostNegative).toBeDefined();
                expect(smallerNegative).toBeDefined();
                expect(matchingPositive).toBeDefined();
                if (!mostNegative || !smallerNegative || !matchingPositive) {
                    return;
                }

                expect(mostNegative.width).toBeGreaterThan(0);
                expect(mostNegative.width! / smallerNegative.width!).toBeCloseTo(120000 / 45000, 5);
                expect(mostNegative.width).toBeCloseTo(matchingPositive.width!, 5);
            });

            it("use transparent fill and a series-colored outline when enabled", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const negativeColumn: SVGPathElement = Array.from(visualBuilder.columns)
                    .find((element: SVGPathElement) => (<TornadoChartPoint>(<any>element).__data__).value < 0)!;
                const negativePoint: TornadoChartPoint = <TornadoChartPoint>(<any>negativeColumn).__data__;
                const styles: CSSStyleDeclaration = getComputedStyle(negativeColumn);

                expect(parseFloat(styles.getPropertyValue("fill-opacity"))).toBeCloseTo(0, 5);
                expect(styles.getPropertyValue("stroke-width")).toBe("2px");
                expect(areColorsEqual(
                    styles.getPropertyValue("stroke"),
                    negativePoint.seriesColor)).toBe(true);
            });

            it("uses inside fill for labels inside transparent negative bars", () => {
                const insideFill = "#55AA77";
                const configuredOutsideFill = "#CC4466";
                dataViewBuilder.valuesValue1 = [-120000, -45000, 0, 45000, 120000, 60000];
                dataViewBuilder.valuesValue2 = [0, 0, 0, 0, 0, 0];
                dataView = dataViewBuilder.getDataView();
                dataView.metadata.objects = {
                    labels: {
                        insideFill: getSolidColorStructuralObject(insideFill),
                        outsideFill: getSolidColorStructuralObject(configuredOutsideFill)
                    },
                    negativeBars: {
                        show: true,
                        transparency: 100
                    }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const negativeLabel: HTMLElement = Array.from(visualBuilder.labels)
                    .find((element: HTMLElement) => (<TornadoChartPoint>(<any>element).__data__).value === -120000)!;
                const labelText: SVGTextElement = negativeLabel.querySelector("text.label-text")!;

                assertColorsMatch(labelText.getAttribute("fill")!, insideFill);
            });

            it("keeps labels visible inside transparent negative bars with the default fill", () => {
                const themeLabelColor = "#777777";
                dataViewBuilder.valuesValue1 = [-120000, -45000, 0, 45000, 120000, 60000];
                dataViewBuilder.valuesValue2 = [0, 0, 0, 0, 0, 0];
                dataView = dataViewBuilder.getDataView();
                dataView.metadata.objects = {
                    labels: {},
                    negativeBars: {
                        show: true,
                        transparency: 100
                    }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const negativeLabel: HTMLElement = Array.from(visualBuilder.labels)
                    .find((element: HTMLElement) => (<TornadoChartPoint>(<any>element).__data__).value === -120000)!;
                const labelText: SVGTextElement = negativeLabel.querySelector("text.label-text")!;

                assertColorsMatch(labelText.getAttribute("fill")!, themeLabelColor);
            });

            it("uses outside fill for labels outside transparent negative bars", () => {
                const outsideFill = "#CC4466";
                dataViewBuilder.valuesValue1 = [-120000, -1000, 0, 45000, 120000, 60000];
                dataViewBuilder.valuesValue2 = [0, 0, 0, 0, 0, 0];
                dataView = dataViewBuilder.getDataView();
                dataView.metadata.objects = {
                    labels: {
                        outsideFill: getSolidColorStructuralObject(outsideFill)
                    },
                    negativeBars: {
                        show: true,
                        transparency: 100
                    }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const negativeLabel: HTMLElement = Array.from(visualBuilder.labels)
                    .find((element: HTMLElement) => (<TornadoChartPoint>(<any>element).__data__).value === -1000)!;
                const labelText: SVGTextElement = negativeLabel.querySelector("text.label-text")!;

                assertColorsMatch(labelText.getAttribute("fill")!, outsideFill);
            });

            it("uses inside fill for labels inside visible negative bars", () => {
                const insideFill = "#55AA77";
                dataViewBuilder.valuesValue1 = [-120000, -45000, 0, 45000, 120000, 60000];
                dataViewBuilder.valuesValue2 = [0, 0, 0, 0, 0, 0];
                dataView = dataViewBuilder.getDataView();
                dataView.metadata.objects = {
                    labels: {
                        insideFill: getSolidColorStructuralObject(insideFill)
                    },
                    negativeBars: {
                        show: true,
                        transparency: 100
                    }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const negativeLabel: HTMLElement = Array.from(visualBuilder.labels)
                    .find((element: HTMLElement) => (<TornadoChartPoint>(<any>element).__data__).value === -120000)!;
                const labelText: SVGTextElement = negativeLabel.querySelector("text.label-text")!;

                assertColorsMatch(labelText.getAttribute("fill")!, insideFill);
            });

            it("use the configured negative label fill", () => {
                const negativeFill = "#123456";
                const insideFill = "#55AA77";
                dataViewBuilder.valuesValue1 = [-120000, 120000, 0, 0, 0, 0];
                dataViewBuilder.valuesValue2 = [0, 0, 0, 0, 0, 0];
                dataView = dataViewBuilder.getDataView();
                dataView.metadata.objects = {
                    labels: {
                        negativeFill: getSolidColorStructuralObject(negativeFill),
                        insideFill: getSolidColorStructuralObject(insideFill)
                    },
                    negativeBars: {
                        show: true,
                        transparency: 50
                    }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const negativeLabel: HTMLElement = Array.from(visualBuilder.labels)
                    .find((element: HTMLElement) => (<TornadoChartPoint>(<any>element).__data__).value === -120000)!;
                const positiveLabel: HTMLElement = Array.from(visualBuilder.labels)
                    .find((element: HTMLElement) => (<TornadoChartPoint>(<any>element).__data__).value === 120000)!;

                assertColorsMatch(negativeLabel.querySelector("text.label-text")!.getAttribute("fill")!, negativeFill);
                assertColorsMatch(positiveLabel.querySelector("text.label-text")!.getAttribute("fill")!, insideFill);
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

            it("uses the configured fill without changing the border color", () => {
                const color: string = "#AABB11";
                (dataView.metadata.objects!).negativeBars.fill = getSolidColorStructuralObject(color);

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const negativeColumn: SVGPathElement = Array.from(visualBuilder.columns)
                    .find((element: SVGPathElement) => (<TornadoChartPoint>(<any>element).__data__).value < 0)!;
                const negativePoint: TornadoChartPoint = <TornadoChartPoint>(<any>negativeColumn).__data__;
                const negativeGradient: SVGElement = Array.from(visualBuilder.gradients)
                    .find((gradient: SVGElement) => (<TornadoChartPoint>(<any>gradient).__data__).uniqId === negativePoint.uniqId)!;
                const stopColors = Array.from(negativeGradient.querySelectorAll("stop"))
                    .map((stop: Element) => stop.getAttribute("stop-color") || "");

                expect(stopColors.some((stopColor: string) => areColorsEqual(stopColor, color))).toBe(true);
                expect(areColorsEqual(
                    getComputedStyle(negativeColumn).getPropertyValue("stroke"),
                    negativePoint.seriesColor)).toBe(true);
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

            it("shows the border by default", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const negativeColumn: SVGPathElement = Array.from(visualBuilder.columns)
                    .find((element: SVGPathElement) => (<TornadoChartPoint>(<any>element).__data__).value < 0)!;
                expect(getComputedStyle(negativeColumn).getPropertyValue("stroke-width")).toBe("2px");
            });

            it("hides the border when disabled", () => {
                (dataView.metadata.objects!).negativeBars.showBorder = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const negativeColumn: SVGPathElement = Array.from(visualBuilder.columns)
                    .find((element: SVGPathElement) => (<TornadoChartPoint>(<any>element).__data__).value < 0)!;
                expect(getComputedStyle(negativeColumn).getPropertyValue("stroke-width")).toBe("0px");
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

            it("borderColor", () => {
                const color: string = "#CCDDEE";
                (dataView.metadata.objects!).barAppearance.showBorder = true;
                (dataView.metadata.objects!).barAppearance.borderColor = getSolidColorStructuralObject(color);

                visualBuilder.updateFlushAllD3Transitions(dataView);

                // At least one column should render with the configured border color as its stroke
                const strokeMatches: boolean = Array.from(visualBuilder.columns)
                    .some((element: Element) => areColorsEqual(
                        getComputedStyle(element).getPropertyValue("stroke"), color));
                expect(strokeMatches).toBe(true);
            });

            it("hides the border by default", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const widths: string[] = Array.from(visualBuilder.columns)
                    .map((element: Element) => getComputedStyle(element).getPropertyValue("stroke-width"));
                expect(widths.every((width: string) => width === "0px")).toBe(true);
            });

            it("shows the border with the default width when enabled", () => {
                (dataView.metadata.objects!).barAppearance.showBorder = true;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const widths: string[] = Array.from(visualBuilder.columns)
                    .map((element: Element) => getComputedStyle(element).getPropertyValue("stroke-width"));
                expect(widths.every((width: string) => width === "2px")).toBe(true);
            });

            it("borderWidth", () => {
                (dataView.metadata.objects!).barAppearance.showBorder = true;
                (dataView.metadata.objects!).barAppearance.borderWidth = 3;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                // At least one column should render with the configured stroke width
                const widthMatches: boolean = Array.from(visualBuilder.columns)
                    .some((element: Element) => getComputedStyle(element).getPropertyValue("stroke-width") === "3px");
                expect(widthMatches).toBe(true);
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
                expect(visualBuilder.instance.formattingSettings.barAppearance.barSpacing.value).toBe(16);
                const before: string[] = getTransforms();

                (dataView.metadata.objects!).barAppearance.barSpacing = 25;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const after: string[] = getTransforms();

                // Changing bar spacing should reposition/resize the rendered columns
                expect(after).not.toEqual(before);
            });

            it("removes the space between bars at zero", () => {
                (dataView.metadata.objects!).barAppearance.barSpacing = 0;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const points: TornadoChartPoint[] = Array.from(visualBuilder.columns)
                    .map((element: SVGPathElement) => <TornadoChartPoint>(<any>element).__data__);
                const firstPoint = points[0];
                const secondPoint = points[1];

                expect(secondPoint.dy).toBeCloseTo(firstPoint.dy! + firstPoint.height!, 5);
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

            it("hidden when show is off", () => {
                (dataView.metadata.objects!).centerLine.show = false;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                // No center line elements should be rendered when disabled
                expect(visualBuilder.axis.length).toBe(0);
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

            it("backgroundColor", () => {
                const color: string = "#EEFFAA";
                (dataView.metadata.objects!).chartArea.backgroundColor = getSolidColorStructuralObject(color);

                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(dataView.metadata.objects!["chartArea"].backgroundColor).toBeDefined();
                // The background rect fill should match the configured color when shown
                assertColorsMatch(
                    getComputedStyle(visualBuilder.chartAreaBackground).getPropertyValue("fill"),
                    color);
            });
        });

        describe("Category axis", () => {
            const setSeriesAxis = (seriesIndex: number, axis: { start?: number | null; end?: number | null }): void => {
                const source = dataView.categorical!.values![seriesIndex].source;
                source.objects = {
                    ...source.objects,
                    categoryAxis: axis
                };
            };

            const getRenderedPoints = (): TornadoChartPoint[] => Array.from(visualBuilder.columns)
                .map((element: SVGPathElement) => <TornadoChartPoint>(<any>element).__data__);

            beforeEach(() => {
                dataView.metadata.objects = {
                    categoryAxis: {}
                };
            });

            it("normalize temporarily ignores manual ranges", () => {
                dataViewBuilder.valuesValue1 = [100, 100, 100, 100, 100, 100];
                dataViewBuilder.valuesValue2 = [400, 400, 400, 400, 400, 400];
                dataView = dataViewBuilder.getDataView();
                dataView.metadata.objects = { categoryAxis: {} };
                setSeriesAxis(0, { start: 0, end: 200 });
                setSeriesAxis(1, { start: 0, end: 800 });

                visualBuilder.updateFlushAllD3Transitions(dataView);
                const manualPoints = getRenderedPoints();
                const seriesLength = dataViewBuilder.valuesCategory.length;
                const manualLeftWidth = manualPoints[0].width!;
                const manualRightWidth = manualPoints[seriesLength].width!;

                (dataView.metadata.objects!).categoryAxis.normalize = true;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const normalizedPoints = getRenderedPoints();
                const normalizedLeftWidth = normalizedPoints[0].width!;
                const normalizedRightWidth = normalizedPoints[seriesLength].width!;

                expect(normalizedLeftWidth).toBeGreaterThan(manualLeftWidth);
                expect(normalizedRightWidth).toBeGreaterThan(manualRightWidth);
                expect(normalizedLeftWidth).toBeCloseTo(normalizedRightWidth, 5);
                const normalizedRangeGroups = (<any>visualBuilder.instance.formattingSettings.categoryAxis).groups.slice(1);
                expect(normalizedRangeGroups.length).toBe(2);
                normalizedRangeGroups.forEach(group => {
                    expect(group.slices.map(slice => slice.name)).toEqual(["start", "end"]);
                    group.slices.forEach(slice => expect(slice.disabled).toBeTrue());
                });

                (dataView.metadata.objects!).categoryAxis.normalize = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const restoredPoints = getRenderedPoints();
                const restoredRangeGroups = (<any>visualBuilder.instance.formattingSettings.categoryAxis).groups.slice(1);

                expect(restoredPoints[0].width).toBeCloseTo(manualLeftWidth, 5);
                expect(restoredPoints[seriesLength].width).toBeCloseTo(manualRightWidth, 5);
                restoredRangeGroups.forEach(group => {
                    group.slices.forEach(slice => expect(slice.disabled).toBeFalse());
                });
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

            it("uses a shared automatic range when normalization is off", () => {
                dataViewBuilder.valuesValue1 = [10, 20, 30, 40, 50, 60];
                dataViewBuilder.valuesValue2 = [100, 200, 300, 400, 500, 600];
                dataView = dataViewBuilder.getDataView();
                dataView.metadata.objects = { categoryAxis: {} };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const points = getRenderedPoints();
                const seriesLength = dataViewBuilder.valuesCategory.length;
                const leftMaxWidth = Math.max(...points.slice(0, seriesLength).map(point => point.width!));
                const rightMaxWidth = Math.max(...points.slice(seriesLength).map(point => point.width!));

                expect(rightMaxWidth).toBeCloseTo(leftMaxWidth * 10, 5);
            });

            it("normalizes each automatic series range to 100%", () => {
                dataViewBuilder.valuesValue1 = [10, 20, 30, 40, 50, 60];
                dataViewBuilder.valuesValue2 = [100, 200, 300, 400, 500, 600];
                dataView = dataViewBuilder.getDataView();
                dataView.metadata.objects = { categoryAxis: {} };

                visualBuilder.updateFlushAllD3Transitions(dataView);
                const automaticPoints = getRenderedPoints();
                const seriesLength = dataViewBuilder.valuesCategory.length;
                const automaticLeftMaxWidth = Math.max(...automaticPoints.slice(0, seriesLength).map(point => point.width!));

                (dataView.metadata.objects!).categoryAxis.normalize = true;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const normalizedPoints = getRenderedPoints();
                const normalizedLeftMaxWidth = Math.max(...normalizedPoints.slice(0, seriesLength).map(point => point.width!));
                const normalizedRightMaxWidth = Math.max(...normalizedPoints.slice(seriesLength).map(point => point.width!));
                expect(normalizedLeftMaxWidth).toBeGreaterThan(automaticLeftMaxWidth);
                expect(normalizedLeftMaxWidth).toBeCloseTo(normalizedRightMaxWidth, 5);
            });

            it("applies Start and End as the actual series domain", () => {
                dataViewBuilder.valuesValue1 = [50, 100, 150, 200, 250, 300];
                dataViewBuilder.valuesValue2 = [0, 0, 0, 0, 0, 0];
                dataView = dataViewBuilder.getDataView();
                setSeriesAxis(0, { start: 100, end: 200 });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const firstSeries = getRenderedPoints().slice(0, dataViewBuilder.valuesCategory.length);
                const fullWidth = firstSeries[3].width!;
                expect(firstSeries[0].width).toBe(0);
                expect(firstSeries[1].width).toBe(0);
                expect(firstSeries[2].width).toBeCloseTo(fullWidth / 2, 5);
                expect(firstSeries[4].width).toBeCloseTo(fullWidth, 5);
                expect(firstSeries[5].width).toBeCloseTo(fullWidth, 5);
            });

            it("clips a value above End to the full series width", () => {
                dataViewBuilder.valuesValue1 = [60000, 150, 0, 0, 0, 0];
                dataViewBuilder.valuesValue2 = [0, 0, 0, 0, 0, 0];
                dataView = dataViewBuilder.getDataView();
                setSeriesAxis(0, { start: 0, end: 150 });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const firstSeries = getRenderedPoints().slice(0, dataViewBuilder.valuesCategory.length);
                expect(firstSeries[0].width).toBeGreaterThan(0);
                expect(firstSeries[0].width).toBeCloseTo(firstSeries[1].width!, 5);
                expect(firstSeries[0].maxValue).toBe(150);
            });

            it("applies a manual range only to the selected series", () => {
                dataViewBuilder.valuesValue1 = [100, 100, 100, 100, 100, 100];
                dataViewBuilder.valuesValue2 = [100, 100, 100, 100, 100, 100];
                dataView = dataViewBuilder.getDataView();
                setSeriesAxis(0, { start: 0, end: 200 });
                setSeriesAxis(1, {});

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const points = getRenderedPoints();
                const seriesLength = dataViewBuilder.valuesCategory.length;
                const leftWidth = points[0].width!;
                const rightWidth = points[seriesLength].width!;

                expect(leftWidth).toBeCloseTo(rightWidth / 2, 5);
                expect(points[0].minValue).toBe(0);
                expect(points[0].maxValue).toBe(200);
                expect(points[seriesLength].maxValue).toBe(100);
            });

            it("uses an automatic bound when a manual bound is unset", () => {
                dataViewBuilder.valuesValue1 = [100, 200, 100, 200, 100, 200];
                dataView = dataViewBuilder.getDataView();
                setSeriesAxis(0, { start: null, end: 300 });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const firstPoint = getRenderedPoints()[0];
                expect(firstPoint.minValue).toBe(0);
                expect(firstPoint.maxValue).toBe(300);
            });

            it("applies a manual negative start to the selected series", () => {
                dataViewBuilder.valuesValue1 = [-100, 100, -100, 100, -100, 100];
                dataView = dataViewBuilder.getDataView();
                dataView.metadata.objects = {
                    negativeBars: { show: true },
                    categoryAxis: {}
                };
                setSeriesAxis(0, { start: -200, end: 100 });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const firstSeries = getRenderedPoints().slice(0, dataViewBuilder.valuesCategory.length);
                expect(firstSeries[0].minValue).toBe(-200);
                expect(firstSeries[0].maxValue).toBe(100);
                expect(firstSeries[0].width).toBeCloseTo(firstSeries[1].width!, 5);
            });

            it("preserves zero as a manual end", () => {
                dataViewBuilder.valuesValue1 = [0, -50, -100, -200, -100, -50];
                dataView = dataViewBuilder.getDataView();
                dataView.metadata.objects = {
                    negativeBars: { show: true },
                    categoryAxis: {}
                };
                setSeriesAxis(0, { start: -200, end: 0 });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const firstSeries = getRenderedPoints().slice(0, dataViewBuilder.valuesCategory.length);
                const firstEnd = (<any>visualBuilder.instance.formattingSettings.categoryAxis).groups[1].slices[1];
                const fullWidth = firstSeries[3].width!;
                expect(firstSeries[0].minValue).toBe(-200);
                expect(firstSeries[0].maxValue).toBe(0);
                expect(firstEnd.value).toBe(0);
                expect(firstSeries[0].width).toBe(0);
                expect(firstSeries[1].width).toBeCloseTo(fullWidth / 4, 5);
                expect(firstSeries[2].width).toBeCloseTo(fullWidth / 2, 5);
            });

            it("preserves legacy selector-scoped end values", () => {
                dataViewBuilder.valuesValue1 = [100, 100, 100, 100, 100, 100];
                dataViewBuilder.valuesValue2 = [400, 400, 400, 400, 400, 400];
                dataView = dataViewBuilder.getDataView();
                setSeriesAxis(0, { end: 250 });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const points = getRenderedPoints();
                const seriesLength = dataViewBuilder.valuesCategory.length;

                expect(points[0].maxValue).toBe(250);
                expect(points[seriesLength].maxValue).toBe(400);
            });

            it("falls back to the automatic series range for reversed bounds", () => {
                dataViewBuilder.valuesValue1 = [100, 200, 100, 200, 100, 200];
                dataView = dataViewBuilder.getDataView();
                setSeriesAxis(0, { start: 500, end: 100 });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const firstPoint = getRenderedPoints()[0];
                const sharedMaximum = Math.max(
                    ...dataView.categorical!.values!
                        .slice(0, MaxSeries)
                        .flatMap(column => (<number[]>column.values).map(value => Math.abs(value))));
                expect(firstPoint.minValue).toBe(0);
                expect(firstPoint.maxValue).toBe(sharedMaximum);
            });

            it("falls back to the automatic series range for equal bounds", () => {
                dataViewBuilder.valuesValue1 = [100, 200, 100, 200, 100, 200];
                dataView = dataViewBuilder.getDataView();
                setSeriesAxis(0, { start: 100, end: 100 });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const firstPoint = getRenderedPoints()[0];
                const sharedMaximum = Math.max(
                    ...dataView.categorical!.values!
                        .slice(0, MaxSeries)
                        .flatMap(column => (<number[]>column.values).map(value => Math.abs(value))));
                expect(firstPoint.minValue).toBe(0);
                expect(firstPoint.maxValue).toBe(sharedMaximum);
            });

            it("builds live validators from the opposite manual bound", () => {
                setSeriesAxis(0, { start: 100, end: 250 });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const firstRangeSlices: any[] = (<any>visualBuilder.instance.formattingSettings.categoryAxis).groups[1].slices;
                const firstStart = firstRangeSlices[0];
                const firstEnd = firstRangeSlices[1];

                expect(firstRangeSlices.map(slice => slice.name)).toEqual(["start", "end"]);
                expect(firstStart.options.minValue.type).toBe(powerbi.visuals.ValidatorType.Min);
                expect(firstStart.options.minValue.value).toBe(0);
                expect(firstStart.options.maxValue.type).toBe(powerbi.visuals.ValidatorType.Max);
                expect(firstStart.options.maxValue.value).toBe(250);
                expect(firstEnd.options.minValue.type).toBe(powerbi.visuals.ValidatorType.Min);
                expect(firstEnd.options.minValue.value).toBe(100);
            });

            it("prevents negative Start and End input values", () => {
                setSeriesAxis(0, { start: -100, end: -4 });

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const firstRangeSlices: any[] = (<any>visualBuilder.instance.formattingSettings.categoryAxis).groups[1].slices;
                const firstStart = firstRangeSlices[0];
                const firstEnd = firstRangeSlices[1];

                expect(firstStart.options.minValue.value).toBe(0);
                expect(firstStart.options.maxValue).toBeUndefined();
                expect(firstEnd.options.minValue.value).toBe(0);
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

        it("should use foreground color for themed text, axis, and legend", (done) => {
            dataView.categorical!.values!.source = {
                displayName: "Series"
            };
            dataView.metadata.objects = {
                ...dataView.metadata.objects,
                legend: {
                    showTitle: true,
                    titleText: "Legend Test",
                    labelColor: getSolidColorStructuralObject("#ff0000")
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const foregroundElementGroups: { name: string; elements: Element[] }[] = [
                    { name: "category", elements: Array.from(visualBuilder.categoryText) },
                    { name: "label", elements: Array.from(visualBuilder.labelText) },
                    { name: "legend", elements: Array.from(visualBuilder.legendText) }
                ];

                foregroundElementGroups.forEach(({ name, elements }) => {
                    expect(elements.length).withContext(`${name} elements should be rendered`).toBeGreaterThan(0);
                    elements.forEach((element: Element) => {
                        const actualColor: string = getComputedStyle(element).getPropertyValue("fill");
                        expect(areColorsEqual(actualColor, foregroundColor))
                            .withContext(`${name} should use the high-contrast foreground color`)
                            .toBeTrue();
                    });
                });
                const legendIcons = Array.from(visualBuilder.element.querySelectorAll(".legend path.legendIcon"));
                expect(legendIcons.length).withContext("legend icons should be rendered").toBeGreaterThan(0);
                legendIcons.forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("fill"), foregroundColor);
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("stroke"), foregroundColor);
                });
                Array.from(visualBuilder.axis).forEach((element: Element) => {
                    assertColorsMatch(getComputedStyle(element).getPropertyValue("stroke"), foregroundColor);
                });
                done();
            });
        });
    });

    describe("Selection tests", () => {
        it("dims unselected borders when a transparent negative bar is selected", () => {
            dataViewBuilder.valuesValue1 = [-120000, -45000, 0, 45000, 120000, 60000];
            dataViewBuilder.valuesValue2 = [0, 0, 0, 0, 0, 0];
            dataView = dataViewBuilder.getDataView();
            dataView.metadata.objects = {
                negativeBars: {
                    show: true,
                    transparency: 100,
                    borderWidth: 2
                }
            };

            visualBuilder.updateFlushAllD3Transitions(dataView);

            const selectedColumn = Array.from(visualBuilder.columns)
                .find((column: SVGPathElement) => (<TornadoChartPoint>(<any>column).__data__).value === -120000)!;
            const unselectedColumn = Array.from(visualBuilder.columns)
                .find((column: SVGPathElement) => column !== selectedColumn)!;

            d3Click(selectedColumn, 0, 0, ClickEventType.Default);

            expect(getComputedStyle(selectedColumn).getPropertyValue("fill-opacity")).toBe("0");
            expect(getComputedStyle(selectedColumn).getPropertyValue("stroke-opacity")).toBe("1");
            expect(getComputedStyle(unselectedColumn).getPropertyValue("stroke-opacity")).toBe("0.4");
        });

        it("combines selection opacity with partial negative bar transparency", () => {
            visualBuilder.visualHost.colorPalette.isHighContrast = true;
            dataViewBuilder.valuesValue1 = [-120000, -45000, 0, 45000, 120000, 60000];
            dataViewBuilder.valuesValue2 = [0, 0, 0, 0, 0, 0];
            dataView = dataViewBuilder.getDataView();
            dataView.metadata.objects = {
                negativeBars: {
                    show: true,
                    transparency: 50
                }
            };

            visualBuilder.updateFlushAllD3Transitions(dataView);

            const negativeColumn = Array.from(visualBuilder.columns)
                .find((column: SVGPathElement) => (<TornadoChartPoint>(<any>column).__data__).value === -120000)!;
            const selectedColumn = Array.from(visualBuilder.columns)
                .find((column: SVGPathElement) => (<TornadoChartPoint>(<any>column).__data__).value === 120000)!;

            d3Click(selectedColumn, 0, 0, ClickEventType.Default);

            expect(parseFloat(getComputedStyle(negativeColumn).getPropertyValue("fill-opacity"))).toBeCloseTo(0.2, 5);
        });

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
