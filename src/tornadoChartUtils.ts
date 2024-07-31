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

export class TornadoChartUtils {
    static DimmedOpacity: number = 0.4;
    static DefaultOpacity: number = 1.0;
    static DimmedColor: string = "#A6A6A6";

    static getOpacity(selected: boolean, highlight: boolean, hasSelection: boolean, isHCM: boolean): number {
        if (!highlight && hasSelection && !selected && isHCM) {
            return TornadoChartUtils.DimmedOpacity;
        }
        return TornadoChartUtils.DefaultOpacity;
    }

    static getLegendFillOpacity(
        selected: boolean,
        hasSelection: boolean,
        isHCM: boolean): number {
    
        if ((hasSelection && !selected) && isHCM) {
            return TornadoChartUtils.DimmedOpacity;
        }
    
        return TornadoChartUtils.DefaultOpacity;
    }
    
    static getLegendFill(
        selected: boolean,
        hasSelection: boolean,
        defaultColor: string,
        isHCM: boolean): string {
    
        if ((hasSelection && !selected) && !isHCM) {
            return TornadoChartUtils.DimmedColor;
        }
    
        return defaultColor;
    }
}