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

import { getRandomNumbers, testDataViewBuilder } from "powerbi-visuals-utils-testutils";
import TestDataViewBuilder = testDataViewBuilder.TestDataViewBuilder;

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

    public getDataView(columnNames?: string[]): DataView {
        return this.createCategoricalDataViewBuilder([
            {
                source: {
                    displayName: TornadoData.ColumnCategory,
                    type: ValueType.fromDescriptor({ text: true })
                },
                values: this.valuesCategory
            }
        ], [
                {
                    source: {
                        displayName: TornadoData.ColumnValues1,
                        isMeasure: true,
                        format: "$0,000.00",
                        type: ValueType.fromDescriptor({ numeric: true }),
                        objects: { dataPoint: { fill: { solid: { color: "purple" } } } }
                    },
                    values: this.valuesValue1
                },
                {
                    source: {
                        displayName: TornadoData.ColumnValues2,
                        isMeasure: true,
                        format: "$0,000.00",
                        type: ValueType.fromDescriptor({ numeric: true })
                    },
                    values: this.valuesValue2
                },
                {
                    source: {
                        displayName: TornadoData.ColumnValues3,
                        isMeasure: true,
                        format: "$0,000.00",
                        type: ValueType.fromDescriptor({ numeric: true })
                    },
                    values: this.valuesValue3
                }
            ], columnNames).build();
    }
}
