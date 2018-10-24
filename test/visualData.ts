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

import powerbi from "powerbi-visuals-api";

import DataView = powerbi.DataView;

import { valueType as vt } from "powerbi-visuals-utils-typeutils";
import ValueType = vt.ValueType;

import { getRandomNumbers, testDataViewBuilder, getRandomNumber } from "powerbi-visuals-utils-testutils";
import TestDataViewBuilder = testDataViewBuilder.TestDataViewBuilder;
import { DataViewBuilderValuesColumnOptions } from "powerbi-visuals-utils-testutils/lib/dataViewBuilder/dataViewBuilder";

export class TornadoData extends TestDataViewBuilder {
    private static MinValue: number = 100;
    private static MaxValue: number = 1000;

    // public static ColumnCategory: string = "Country";
    public static ColumnCategory: string = "Name";
    public static ColumnValues1: string = "Sales Amount (2014)";
    public static ColumnValues2: string = "Sales Amount (2015)";
    public static ColumnValues3: string = "Sales Amount (2016)";

    public valuesCategory: string[] = [
        "Australia",
        "Canada",
        "France",
        "Germany",
        "United Kingdom",
        "United States"
    ];

    public valuesValue1: number[] = getRandomNumbers(
        this.valuesCategory.length,
        TornadoData.MinValue,
        TornadoData.MaxValue);

    public valuesValue2: number[] = getRandomNumbers(
        this.valuesCategory.length,
        TornadoData.MinValue,
        TornadoData.MaxValue);

    public valuesValue3: number[] = getRandomNumbers(
        this.valuesCategory.length,
        TornadoData.MinValue,
        TornadoData.MaxValue);

    public hightlightedElementNumber: number = getRandomNumber(0, this.valuesCategory.length - 1);

    public generateHightLightedValues(lenght: number, hightlightedElementNumber?: number): number[] {
        let array: number[] = [];
        for (let i: number = 0; i < lenght; i++) {
            array[i] = null;
        }
        if (!hightlightedElementNumber)
            return array;

        if (hightlightedElementNumber >= length || hightlightedElementNumber < 0) {
            array[0] = this.valuesValue1[0];
        } else {
            array[hightlightedElementNumber] = this.valuesValue1[hightlightedElementNumber];
        }

        return array;
    }

    public getDataView(columnNames?: string[], withHighlights: boolean = false): DataView {
        let column1: DataViewBuilderValuesColumnOptions = {
            source: {
                displayName: TornadoData.ColumnValues1,
                isMeasure: true,
                format: "$0,000.00",
                type: ValueType.fromDescriptor({ numeric: true }),
                objects: { dataPoint: { fill: { solid: { color: "purple" } } } }
            },
            values: this.valuesValue1
        };
        let column2: DataViewBuilderValuesColumnOptions = {
            source: {
                displayName: TornadoData.ColumnValues2,
                isMeasure: true,
                format: "$0,000.00",
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesValue2
        };
        let column3: DataViewBuilderValuesColumnOptions = {
            source: {
                displayName: TornadoData.ColumnValues3,
                isMeasure: true,
                format: "$0,000.00",
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesValue3
        };

        if (withHighlights) {
            const highlightedValuesCount: number = this.valuesCategory.length;

            column1.highlights = this.generateHightLightedValues(highlightedValuesCount, this.hightlightedElementNumber);
            column2.highlights = this.generateHightLightedValues(highlightedValuesCount);
            column3.highlights = this.generateHightLightedValues(highlightedValuesCount);
        }

        return this.createCategoricalDataViewBuilder([
            {
                source: {
                    displayName: TornadoData.ColumnCategory,
                    type: ValueType.fromDescriptor({ text: true })
                },
                values: this.valuesCategory
            }
        ], [
                column1,
                column2,
                column3
            ], columnNames).build();
    }
}
