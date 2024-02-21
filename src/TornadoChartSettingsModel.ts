import powerbiVisualsApi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import LegendPosition = legendInterfaces.LegendPosition;

import { TornadoChartSeries } from "./interfaces"

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

import IEnumMember = powerbi.IEnumMember;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import { LegendData } from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";

class DataColorCardSettings extends Card {
    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Fill",
        displayNameKey: "Visual_Fill",
        value: { value: "#000000" }
    });

    name: string = "dataPoint";
    displayName: string = "Data colors";
    displayNameKey: string = "Visual_DataColors";
    description: string = "Display data color options";
    descriptionKey: string = "Visual_Description_DataColors";
    slices = [this.fill];
}

class CategoryAxisCardSettings extends Card {
    end = new formattingSettings.NumUpDown({
        name: "end",
        displayName: "End",
        displayNameKey: "Visual_XAxisEnd",
        value: 0
    });

    name: string = "categoryAxis";
    displayName: string = "X-Axis";
    displayNameKey: string = "Visual_XAxis";
    slices = [this.end];
}

export class DataLabelSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });
    
    topLevelSlice? = this.show;

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

    name: string = "labels";
    displayName: string = "Data Labels";
    displayNameKey: string = "Visual_DataLabels";
    slices = [this.font, this.labelPrecision, this.labelDisplayUnits, this.insideFill, this.outsideFill];
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

export class LegendCardSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });
    
    topLevelSlice? = this.show;

    positionDropdown = new formattingSettings.ItemDropdown({
        items: positionOptions,
        value: positionOptions[0],
        displayName: "Position",
        displayNameKey: "Visual_Legend_Position",
        name: "position"
    });

    showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayName: "Title",
        displayNameKey: "Visual_Title",
        value: true,
    });

    font: formattingSettings.FontControl = new BaseFontControlSettings(8);

    titleText = new formattingSettings.TextInput({
        placeholder: "",
        value: "",
        displayName: "Legend Name",
        displayNameKey: "Visual_Legend_Name",
        name: "titleText"
    });

    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayName: "Color",
        displayNameKey: "Visual_Legend_Color",
        value: { value: "#666666" }
    });

    name: string = "legend";
    visible?: boolean = false;
    displayName: string = "Legend";
    displayNameKey: string = "Visual_Legend";
    slices = [this.positionDropdown, this.showTitle, this.titleText, this.font, this.labelColor];
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

    name: string = "categories";
    displayName: string = "Group";
    displayNameKey: string = "Visual_Group";
    slices = [this.fill, this.font, this.positionDropdown];
}


export class TornadoChartSettingsModel extends Model {
    dataColorsCardSettings = new DataColorCardSettings();
    categoryAxisCardSettings = new CategoryAxisCardSettings();
    dataLabelsSettings = new DataLabelSettings();
    legendCardSettings = new LegendCardSettings();
    categoryCardSettings = new CategoryCardSettings();


    cards = [
        this.dataColorsCardSettings,
        this.categoryAxisCardSettings,
        this.dataLabelsSettings,
        this.legendCardSettings,
        this.categoryCardSettings
    ];

    setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(positionOptions, localizationManager);
        this.setLocalizedDisplayName(categoryPositionOptions, localizationManager);
    }   

    public setLocalizedDisplayName(options: IEnumMemberWithDisplayNameKey[], localizationManager: ILocalizationManager) {
        options.forEach(option => {
            option.displayName = localizationManager.getDisplayName(option.key)
        });
    }

    public setVisibilityOfLegendCardSettings(legend: LegendData){
        this.legendCardSettings.visible = legend.dataPoints.length > 0;
    }
    
    public populateDataColorSlice(dataPoints: TornadoChartSeries[]){
        this.dataColorsCardSettings.slices = [];
        for (const dataPoint of dataPoints) {
            this.dataColorsCardSettings.slices.push(
                new formattingSettings.ColorPicker(
                {
                    name: "fill",
                    displayName: dataPoint.name,
                    selector: ColorHelper.normalizeSelector(
                            dataPoint.selectionId.getSelector(),
                            false),
                    value: { value: dataPoint.fill }
                })
            );
        }
    }

    public populateCategoryAxisSlice(dataPoints: TornadoChartSeries[]){
        this.categoryAxisCardSettings.slices = [];
        for (const dataPoint of dataPoints) {
            this.categoryAxisCardSettings.slices.push(
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