import powerbiVisualsApi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import LegendPosition = legendInterfaces.LegendPosition;

import { TornadoChartSeries } from "./interfaces"

import Card = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import Model = formattingSettings.Model;

import IEnumMember = powerbi.IEnumMember;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import { LegendData } from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";

export const enum TornadoObjectNames {
    Legend = "legend",
    LegendTitle = "legendTitle",
    Categories = "categories",
    DataPoint = "dataPoint",
    Labels = "labels",
    NegativeBars = "negativeBars",
    BarAppearance = "barAppearance",
    CenterLine = "centerLine",
    ChartArea = "chartArea",
    CategoryAxis = "categoryAxis",
}

class DataColorCardSettings extends Card {
    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Fill",
        displayNameKey: "Visual_Fill",
        value: { value: "#000000" }
    });

    name: string = TornadoObjectNames.DataPoint;
    displayName: string = "Data colors";
    displayNameKey: string = "Visual_DataColors";
    description: string = "Display data color options";
    descriptionKey: string = "Visual_Description_DataColors";
    slices = [this.fill];
}

class CategoryAxisCardSettings extends Card {
    normalize = new formattingSettings.ToggleSwitch({
        name: "normalize",
        displayName: "Normalize to 100%",
        displayNameKey: "Visual_Axis_Normalize",
        value: false
    });

    end = new formattingSettings.NumUpDown({
        name: "end",
        displayName: "End",
        displayNameKey: "Visual_XAxisEnd",
        value: 0
    });

    name: string = "categoryAxis";
    displayName: string = "X-Axis";
    displayNameKey: string = "Visual_XAxis";
    slices = [this.normalize, this.end];
}

class NegativeBarsCardSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true
    });

    topLevelSlice? = this.show;

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Fill",
        displayNameKey: "Visual_Fill",
        value: { value: "" }
    });

    transparency = new formattingSettings.Slider({
        name: "transparency",
        displayName: "Transparency (%)",
        displayNameKey: "Visual_Transparency",
        value: 0,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 100,
            }
        }
    });

    borderColor = new formattingSettings.ColorPicker({
        name: "borderColor",
        displayName: "Border color",
        displayNameKey: "Visual_BorderColor",
        value: { value: "" }
    });

    borderWidth = new formattingSettings.Slider({
        name: "borderWidth",
        displayName: "Border width (px)",
        displayNameKey: "Visual_BorderWidth",
        value: 0,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 10,
            }
        }
    });

    cornerRadius = new formattingSettings.Slider({
        name: "cornerRadius",
        displayName: "Rounded corners (px)",
        displayNameKey: "Visual_CornerRadius",
        value: 0,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 50,
            }
        }
    });

    name: string = "negativeBars";
    displayName: string = "Negative bars";
    displayNameKey: string = "Visual_NegativeBars";
    slices = [this.fill, this.transparency, this.borderColor, this.borderWidth, this.cornerRadius];
}

class BarAppearanceCardSettings extends Card {
    borderColor = new formattingSettings.ColorPicker({
        name: "borderColor",
        displayName: "Border color",
        displayNameKey: "Visual_BorderColor",
        value: { value: "" }
    });

    borderWidth = new formattingSettings.Slider({
        name: "borderWidth",
        displayName: "Border width (px)",
        displayNameKey: "Visual_BorderWidth",
        value: 0,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 10,
            }
        }
    });

    cornerRadius = new formattingSettings.Slider({
        name: "cornerRadius",
        displayName: "Rounded corners (px)",
        displayNameKey: "Visual_CornerRadius",
        value: 0,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 50,
            }
        }
    });

    barSpacing = new formattingSettings.Slider({
        name: "barSpacing",
        displayName: "Space between bars (%)",
        displayNameKey: "Visual_BarSpacing",
        value: 0,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 75,
            }
        }
    });

    name: string = "barAppearance";
    displayName: string = "Bar appearance";
    displayNameKey: string = "Visual_BarAppearance";
    slices = [this.borderColor, this.borderWidth, this.cornerRadius, this.barSpacing];
}

class CenterLineCardSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true
    });

    topLevelSlice? = this.show;

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "" }
    });

    width = new formattingSettings.Slider({
        name: "width",
        displayName: "Width (px)",
        displayNameKey: "Visual_Width",
        value: 1,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 1,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 10,
            }
        }
    });

    name: string = "centerLine";
    displayName: string = "Center line";
    displayNameKey: string = "Visual_CenterLine";
    slices = [this.color, this.width];
}

class ChartAreaCardSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: false
    });

    topLevelSlice? = this.show;

    backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Background color",
        displayNameKey: "Visual_BackgroundColor",
        value: { value: "#B3B3B3" }
    });

    name: string = "chartArea";
    displayName: string = "Chart Area";
    displayNameKey: string = "Visual_ChartArea";
    slices = [this.backgroundColor];
}

export enum LabelDisplayMode {
    Value = "value",
    Percentage = "percentage",
    ValueAndPercentage = "valueAndPercentage",
}

export const labelContentOptions: IEnumMemberWithDisplayNameKey[] = [
    { value: LabelDisplayMode.Value, displayName: "Value", key: "Visual_Value" },
    { value: LabelDisplayMode.Percentage, displayName: "Percentage", key: "Visual_Percentage" },
    { value: LabelDisplayMode.ValueAndPercentage, displayName: "Value (%)", key: "Visual_ValueAndPercentage" },
];

class LabelsOptionsGroup extends Card {
    displayFormat = new formattingSettings.ItemDropdown({
        name: "displayFormat",
        displayName: "Label content",
        displayNameKey: "Visual_LabelContent",
        items: labelContentOptions,
        value: labelContentOptions[0]
    });

    name: string = "options";
    displayName: string = "Options";
    displayNameKey: string = "Visual_Options";
    slices: formattingSettings.Slice[] = [this.displayFormat];
}

class LabelsValuesGroup extends Card {
    font: formattingSettings.FontControl = new BaseFontControlSettings(9);

    labelPrecision = new formattingSettings.NumUpDown({
        name: "labelPrecision",
        displayName: "Decimal Places",
        displayNameKey: "Visual_DataLabels_DecimalPlaces",
        value: 0,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 25,
            }
        }
    });

    labelDisplayUnits = new formattingSettings.AutoDropdown({
        name: "labelDisplayUnits",
        displayName: "Display Units",
        displayNameKey: "Visual_DisplayUnits",
        value: 1
    });

    insideFill = new formattingSettings.ColorPicker({
        name: "insideFill",
        displayName: "Inside fill",
        displayNameKey: "Visual_DataLabels_InsideFill",
        value: { value: "#FFFFFF" }
    });

    outsideFill = new formattingSettings.ColorPicker({
        name: "outsideFill",
        displayName: "Outside fill",
        displayNameKey: "Visual_DataLabels_OutsideFill",
        value: { value: "#666666" }
    });

    negativeFill = new formattingSettings.ColorPicker({
        name: "negativeFill",
        displayName: "Negative fill",
        displayNameKey: "Visual_DataLabels_NegativeFill",
        value: { value: "" }
    });

    name: string = "values";
    displayName: string = "Values";
    displayNameKey: string = "Visual_Values";
    slices = [this.font, this.labelPrecision, this.labelDisplayUnits, this.insideFill, this.outsideFill, this.negativeFill];
}

export class DataLabelSettings extends CompositeCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });
    
    topLevelSlice = this.show;

    public labelsOptionsGroup: LabelsOptionsGroup = new LabelsOptionsGroup();
    public labelsValuesGroup: LabelsValuesGroup = new LabelsValuesGroup();

    name: string = "labels";
    displayName: string = "Data Labels";
    displayNameKey: string = "Visual_DataLabels";
    groups: formattingSettings.Group[] = [this.labelsOptionsGroup, this.labelsValuesGroup];
}

interface IEnumMemberWithDisplayNameKey extends IEnumMember{
    key: string;
}

const positionOptions : IEnumMemberWithDisplayNameKey[] = [
    {value : LegendPosition[LegendPosition.Top], displayName : "Top", key: "Visual_Legend_Position_Top"}, 
    {value : LegendPosition[LegendPosition.Bottom], displayName : "Bottom", key: "Visual_Legend_Position_Bottom"},
    {value : LegendPosition[LegendPosition.Left], displayName : "Left", key: "Visual_Legend_Position_Left"}, 
    {value : LegendPosition[LegendPosition.Right], displayName : "Right", key: "Visual_Legend_Position_Right"}, 
    {value : LegendPosition[LegendPosition.TopCenter], displayName : "Top Center", key: "Visual_Legend_Position_Top_Center"}, 
    {value : LegendPosition[LegendPosition.BottomCenter], displayName : "Bottom Center", key: "Visual_Legend_Position_Bottom_Center"}, 
    {value : LegendPosition[LegendPosition.LeftCenter], displayName : "Left Center", key: "Visual_Legend_Position_Left_Center"}, 
    {value : LegendPosition[LegendPosition.RightCenter], displayName : "Right Center", key: "Visual_Legend_Position_Right_Center"}, 
];

class BaseFontCardSettings extends formattingSettings.FontControl {
    private static fontFamilyName: string = "fontFamily";
    private static fontSizeName: string = "fontSize";
    private static boldName: string = "fontBold";
    private static italicName: string = "fontItalic";
    private static underlineName: string = "fontUnderline";
    private static fontName: string = "font";
    public static defaultFontFamily: string = "wf_standard-font, helvetica, arial, sans-serif";
    public static minFontSize: number = 8;
    public static maxFontSize: number = 60;
    constructor(defaultFontSize: number, settingName: string = ""){
        super(
            new formattingSettings.FontControl({
                name: BaseFontCardSettings.fontName + settingName,
                displayNameKey: "Visual_FontControl",
                fontFamily: new formattingSettings.FontPicker({
                    name: BaseFontCardSettings.fontFamilyName + settingName,
                    value: BaseFontCardSettings.defaultFontFamily
                }),
                fontSize: new formattingSettings.NumUpDown({
                    name: BaseFontCardSettings.fontSizeName + settingName,
                    displayNameKey: "Visual_FontSize",
                    value: defaultFontSize,
                    options: {
                        minValue: {
                            type: powerbi.visuals.ValidatorType.Min,
                            value: BaseFontCardSettings.minFontSize
                        },
                        maxValue: {
                            type: powerbi.visuals.ValidatorType.Max,
                            value: BaseFontCardSettings.maxFontSize
                        }
                    }
                }),
                bold: new formattingSettings.ToggleSwitch({
                    name: BaseFontCardSettings.boldName + settingName,
                    value: false
                }),
                italic: new formattingSettings.ToggleSwitch({
                    name: BaseFontCardSettings.italicName + settingName,
                    value: false
                }),
                underline: new formattingSettings.ToggleSwitch({
                    name: BaseFontCardSettings.underlineName + settingName,
                    value: false
                })
            })
        );
    }
}

class LegendOptionsGroup extends Card {
    public defaultPosition: IEnumMember = positionOptions[0];

    public position = new formattingSettings.ItemDropdown({
        name: "position",
        displayNameKey: "Visual_Position",
        items: positionOptions,
        value: this.defaultPosition,
    });

    name: string = "legendOptions";
    displayName: string = "Options";
    displayNameKey: string = "Visual_Options";
    slices = [this.position];
}

class LegendTextGroup extends Card {
    public defaultLabelColor: string = "#000000";
    public defaultFontSize: number = 8;

    public labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_LabelColor",
        value: { value: this.defaultLabelColor },
    });

    public font = new BaseFontCardSettings(this.defaultFontSize);

    name: string = "legendText";
    displayName: string = "Text";
    displayNameKey: string = "Visual_Text";
    slices = [this.font, this.labelColor];
}

class LegendTitleGroup extends Card {
    public defaultShowTitle: boolean = false;
    public defaultTitleText: string = "Legend";

    public showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayNameKey: "Visual_ShowTitle",
        value: this.defaultShowTitle,
    });

    topLevelSlice = this.showTitle;

    public titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayNameKey: "Visual_TitleText",
        value: this.defaultTitleText,
        placeholder: "Title text",
    });

    name: string = TornadoObjectNames.LegendTitle;
    displayName: string = "Title";
    displayNameKey: string = "Visual_Title";
    slices = [this.titleText];
}

export class LegendCardSettings extends CompositeCard {
    public defaultShow: boolean = true;

    public name: string = "legend";
    public displayNameKey: string = "Visual_Legend";
    public analyticsPane: boolean = false;

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_LegendShow",
        value: this.defaultShow,
    });

    public topLevelSlice: formattingSettings.ToggleSwitch = this.show;

    public options: LegendOptionsGroup = new LegendOptionsGroup();
    public text: LegendTextGroup = new LegendTextGroup();
    public title: LegendTitleGroup = new LegendTitleGroup();

    public groups = [this.options, this.text, this.title];
}

const categoryPositionOptions : IEnumMemberWithDisplayNameKey[] = [
    {value : LegendPosition[LegendPosition.Left], displayName : "Left", key: "Visual_Group_Left"}, 
    {value : LegendPosition[LegendPosition.Right], displayName : "Right", key: "Visual_Group_Right"},
     
];

export class FontDefaultOptions {
    public static DefaultFontSizePt: number = 8;
    public static DefaultFontFamily: string = "Segoe UI, wf_segoe-ui_normal, helvetica, arial, sans-serif";
}

export class BaseFontControlSettings extends formattingSettings.FontControl {
    constructor(defaultFontSize: number){
        super(
            new formattingSettings.FontControl({
                name: "font",
                fontFamily: new formattingSettings.FontPicker({
                    name: "fontFamily",
                    value: FontDefaultOptions.DefaultFontFamily
                }),
                fontSize: new formattingSettings.NumUpDown({
                    name: "fontSize",
                    displayName: "Text Size",
                    displayNameKey: "Visual_TextSize",
                    value: defaultFontSize,
                    options: {
                        minValue: {
                            type: powerbiVisualsApi.visuals.ValidatorType.Min,
                            value: 8,
                        },
                        maxValue: {
                            type: powerbiVisualsApi.visuals.ValidatorType.Max,
                            value: 60,
                        }
                    }
                }),
                bold: new formattingSettings.ToggleSwitch({
                    name: "fontBold",
                    value: false
                }),
                italic: new formattingSettings.ToggleSwitch({
                    name: "fontItalic",
                    value: false
                }),
                underline: new formattingSettings.ToggleSwitch({
                    name: "fontUnderline",
                    value: false
                })
            })
        );
    }
}

export class CategoryCardSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });
    
    topLevelSlice? = this.show;

    font: formattingSettings.FontControl = new BaseFontControlSettings(8);

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "#666666" }
    });

    positionDropdown = new formattingSettings.ItemDropdown({
        items: categoryPositionOptions,
        value: categoryPositionOptions[0],
        name: "position",
        displayName: "Position",
        displayNameKey: "Visual_Position"
    });

    name: string = TornadoObjectNames.Categories;
    displayName: string = "Group";
    displayNameKey: string = "Visual_Group";
    slices = [this.positionDropdown, this.font, this.fill];
}


export class TornadoChartSettingsModel extends Model {
    dataColors = new DataColorCardSettings();
    categoryAxis = new CategoryAxisCardSettings();
    barAppearance = new BarAppearanceCardSettings();
    negativeBars = new NegativeBarsCardSettings();
    centerLine = new CenterLineCardSettings();
    chartArea = new ChartAreaCardSettings();
    dataLabels = new DataLabelSettings();
    legend = new LegendCardSettings();
    category = new CategoryCardSettings();

    cards = [
        this.dataColors,
        this.categoryAxis,
        this.barAppearance,
        this.negativeBars,
        this.centerLine,
        this.dataLabels,
        this.legend,
        this.category,
        this.chartArea
    ];

    setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(positionOptions, localizationManager);
        this.setLocalizedDisplayName(categoryPositionOptions, localizationManager);
        this.setLocalizedDisplayName(labelContentOptions, localizationManager);
    }   

    public setLocalizedDisplayName(options: IEnumMemberWithDisplayNameKey[], localizationManager: ILocalizationManager) {
        options.forEach(option => {
            option.displayName = localizationManager.getDisplayName(option.key)
        });
    }

    public setVisibilityOfLegendCardSettings(legend: LegendData){
        this.legend.visible = legend.dataPoints.length > 0;
    }
    
    public populateDataColorSlice(dataPoints: TornadoChartSeries[]){
        this.dataColors.slices = [];
        for (const dataPoint of dataPoints) {
            this.dataColors.slices.push(
                new formattingSettings.ColorPicker(
                {
                    name: "fill",
                    displayName: dataPoint.name,
                    selector: dataPoint.selectionId.getSelector(),
                    value: { value: dataPoint.fill }
                })
            );
        }
    }

    public populateCategoryAxisSlice(dataPoints: TornadoChartSeries[]){
        const isNormalized = this.categoryAxis.normalize.value;
        this.categoryAxis.slices = [this.categoryAxis.normalize];
        if (!isNormalized) {
            for (const dataPoint of dataPoints) {
                this.categoryAxis.slices.push(
                    new formattingSettings.NumUpDown({
                        name: "end",
                        displayName: dataPoint.name,
                        value: dataPoint.categoryAxisEnd ? dataPoint.categoryAxisEnd : 0,
                        selector: ColorHelper.normalizeSelector(
                            dataPoint.selectionId.getSelector(),
                            false)
                    })
                );
            }
        }
    }
}